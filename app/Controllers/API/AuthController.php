<?php
namespace App\Controllers\API;

use App\Controllers\BaseController;
use App\Models\UserModel;
use App\Models\AuthTokenModel;
use App\Models\BudgetCycleModel;
use App\Models\TransactionModel;
use App\Models\InvitationModel;
use CodeIgniter\API\ResponseTrait;
use Exception;
use Config\Services;

class AuthController extends BaseController
{
    use ResponseTrait;

    /**
     * Requests a magic login link for a user, creating a new account if necessary.
     *
     * Validates the provided email and optional invite token. For new users, requires a valid invitation
     * during a closed beta, creates a user account, and marks the invitation as claimed. Generates a
     * temporary authentication token and sends a welcome or returning user email based on budget existence.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if the email is sent, a 403 for
     * invalid invitations or deactivated accounts, a validation error for invalid input, or a 500 error on failure.
     */
    public function requestLink()
    {
        // --- NEW: Accept an invite_token along with the email ---
        $rules = [
            'email' => 'required|valid_email',
            'invite_token' => 'permit_empty|string'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $emailAddress = $this->validator->getValidated()['email'];
        $inviteToken = $this->validator->getValidated()['invite_token'] ?? null;

        try {
            $userModel = new UserModel();
            $user = $userModel->where('email', $emailAddress)->first();

            $budgetCycleModel = new BudgetCycleModel();
            $hasBudgets = $user ? $budgetCycleModel->where('user_id', $user['id'])->countAllResults() > 0 : false;

            if (!$user) {
                // --- NEW: Logic to validate the invitation for new users ---
                if (!$inviteToken) {
                    // For a closed beta, an invitation is required.
                    return $this->fail('An invitation is required to create a new account.', 403);
                }

                $invitationModel = new InvitationModel();
                $invitation = $invitationModel->where('invite_token', $inviteToken)
                    ->where('status', 'pending')
                    ->first();

                if (!$invitation) {
                    return $this->fail('This invitation is invalid or has already been claimed.', 403);
                }
                // --- End of new invitation logic ---

                $userId = $userModel->insert([
                    'email' => $emailAddress,
                    'status' => 'active'
                ]);

                // --- NEW: Mark the invitation as claimed after user is created ---
                $invitationModel->update($invitation['id'], [
                    'status' => 'claimed',
                    'claimed_by_user_id' => $userId,
                    'claimed_at' => date('Y-m-d H:i:s')
                ]);
                // --- End of claim logic ---

            } else {
                $userId = $user['id'];
                if ($user['status'] !== 'active') {
                    return $this->failForbidden('This account has been deactivated.');
                }
            }

            $authTokenModel = new AuthTokenModel();
            $token = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', time() + (15 * 60));
            $authTokenModel->insert(['user_id' => $userId, 'token' => $token, 'expires_at' => $expiresAt]);

            $emailService = Services::email();

            if (!$user || !$hasBudgets) {
                $this->sendWelcomeEmail($emailService, $emailAddress, $token);
            } else {
                $this->sendReturningUserEmail($emailService, $emailAddress, $token, $userId);
            }

            return $this->respond(['status' => 'success', 'message' => 'Login link sent successfully. Please check your email.']);
        } catch (\Throwable $e) {
            log_message('error', '[AUTH] ' . $e->getMessage() . ' IN ' . $e->getFile() . ' ON LINE ' . $e->getLine());
            return $this->failServerError('Could not send login email. Please try again later.');
        }
    }

    /**
     * Sends a welcome email to new users or those without budgets.
     *
     * Generates a magic login link using site_url() and sends a welcome email with the link.
     * Logs and throws an exception if the email fails to send. Note: The email-sending logic is similar
     * to sendReturningUserEmail. Consider refactoring into a generic sendEmail method to reduce duplication.
     *
     * @param \CodeIgniter\Email\Email $email The email service instance.
     * @param string $recipientEmail The recipient's email address.
     * @param string $token The authentication token for the magic link.
     * @throws Exception If the email fails to send.
     */
    private function sendWelcomeEmail($email, string $recipientEmail, string $token)
    {
        // FIX: Use site_url() to generate a dynamic link
        $magicLink = site_url('verify-login?token=' . $token);
        $emailData = ['magicLink' => $magicLink];
        $message = view('emails/welcome_email', $emailData);

        $email->setTo($recipientEmail);
        $email->setSubject('Welcome to Check2Check.org!');
        $email->setMessage($message);

        if (!$email->send(false)) {
            log_message('error', 'Email Send Failed: ' . $email->printDebugger(['headers']));
            $email->clear();
            throw new Exception('The email service failed to send the welcome email.');
        }
        $email->clear();
    }

    /**
     * Sends a login email to returning users, including a budget snapshot if available.
     *
     * Generates a magic login link and includes a snapshot of the user's active or last completed budget,
     * calculating income and expenses for active budgets or using the final surplus for completed ones.
     * Logs and throws an exception if the email fails to send. Note: The email-sending logic is similar to
     * sendWelcomeEmail. Consider refactoring into a generic sendEmail method to reduce duplication.
     *
     * @param \CodeIgniter\Email\Email $email The email service instance.
     * @param string $recipientEmail The recipient's email address.
     * @param string $token The authentication token for the magic link.
     * @param int $userId The ID of the user.
     * @throws Exception If the email fails to send.
     */
    private function sendReturningUserEmail($email, string $recipientEmail, string $token, int $userId)
    {
        // FIX: Use site_url() to generate a dynamic link
        $magicLink = site_url('verify-login?token=' . $token);
        $snapshotData = null;

        $budgetCycleModel = new BudgetCycleModel();
        $activeBudget = $budgetCycleModel->where('user_id', $userId)->where('status', 'active')->first();

        if ($activeBudget) {
            $transactionModel = new TransactionModel();
            $transactions = $transactionModel->where('budget_cycle_id', $activeBudget['id'])->findAll();
            $income = array_sum(array_column(array_filter($transactions, fn($t) => $t['type'] === 'income'), 'amount'));
            $expenses = array_sum(array_column(array_filter($transactions, fn($t) => $t['type'] === 'expense'), 'amount'));

            $snapshotData = [
                'title' => 'Active Budget Snapshot',
                'message' => 'Your current cash balance is $' . number_format($income - $expenses, 2) . '. Keep up the great work!'
            ];
        } else {
            $lastBudget = $budgetCycleModel->where('user_id', $userId)->where('status', 'completed')->orderBy('end_date', 'DESC')->first();
            if ($lastBudget) {
                $summary = json_decode($lastBudget['final_summary'], true);
                $surplus = $summary['actualSurplus'] ?? 0;
                $snapshotData = [
                    'title' => 'Your Last Budget',
                    'message' => 'You finished your last budget with a surplus of $' . number_format($surplus, 2) . '. Let\'s start a new one!'
                ];
            }
        }

        $emailData = ['magicLink' => $magicLink, 'snapshotData' => $snapshotData];
        $message = view('emails/login_email', $emailData);

        $email->setTo($recipientEmail);
        $email->setSubject('Your Check2Check.org Login Link');
        $email->setMessage($message);

        if (!$email->send(false)) {
            log_message('error', 'Email Send Failed: ' . $email->printDebugger(['headers']));
            $email->clear();
            throw new Exception('The email service failed to send the login email.');
        }
        $email->clear();
    }

    /**
     * Verifies a magic login link and authenticates the user.
     *
     * Validates the provided token against the AuthTokenModel, checks its expiration, and sets session
     * data for authentication if valid. Deletes the token after use to prevent reuse. No redundancy with
     * other methods due to its unique token verification and session management logic.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if authenticated, a validation error
     * if the token is missing, or a 401 error if the token is invalid or expired.
     */
    public function verifyLink()
    {
        $token = $this->request->getVar('token');
        if (empty($token)) {
            return $this->failValidationErrors('A valid token is required.');
        }

        $authTokenModel = new AuthTokenModel();
        $tokenData = $authTokenModel->where('token', $token)->first();

        if (!$tokenData || strtotime($tokenData['expires_at']) < time()) {
            if ($tokenData)
                $authTokenModel->delete($tokenData['id']);
            return $this->failUnauthorized('This login link is invalid or has expired.');
        }

        // --- THIS IS THE NEW LOGIC ---
        $userModel = new UserModel();
        $user = $userModel->find($tokenData['user_id']);

        if (!$user) {
            $authTokenModel->delete($tokenData['id']);
            return $this->failNotFound('User associated with this link not found.');
        }

        $sessionData = [
            'isLoggedIn' => true,
            'userId' => $user['id'],
            'user' => $user, // Store the full user object
        ];

        // If the user is a partner, add owner info to the session
        if (!empty($user['owner_user_id'])) {
            $sessionData['ownerUserId'] = $user['owner_user_id'];
            $sessionData['permissionLevel'] = $user['permission_level'];
        }
        // --- END OF NEW LOGIC ---

        $session = Services::session();
        $session->set($sessionData);

        $authTokenModel->delete($tokenData['id']);
        return $this->respond(['status' => 'success', 'message' => 'Login successful.']);
    }

    /**
     * Logs out the authenticated user by destroying their session.
     *
     * Clears all session data to end the user's session. No redundancy with other methods due to its
     * unique session destruction logic.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a success response indicating logout.
     */
    public function logout()
    {
        $session = session();
        $session->destroy();
        return $this->respond(['status' => 'success', 'message' => 'Logged out successfully.']);
    }
}