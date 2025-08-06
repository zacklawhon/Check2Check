<?php
namespace App\Controllers\API;

use App\Controllers\BaseController;
use App\Models\UserModel;
use App\Models\AuthTokenModel;
use App\Models\BudgetCycleModel;
use App\Models\TransactionModel;
use CodeIgniter\API\ResponseTrait;
use Exception;
use Config\Services;

class AuthController extends BaseController
{
    use ResponseTrait;

    public function requestLink()
    {
        $emailAddress = $this->request->getVar('email');
        if (empty($emailAddress) || !filter_var($emailAddress, FILTER_VALIDATE_EMAIL)) {
            return $this->failValidationErrors('A valid email address is required.');
        }

        try {
            $userModel = new UserModel();
            $user = $userModel->where('email', $emailAddress)->first();

            $budgetCycleModel = new BudgetCycleModel();
            $hasBudgets = $user ? $budgetCycleModel->where('user_id', $user['id'])->countAllResults() > 0 : false;

            if (!$user) {
                $userId = $userModel->insert([
                    'email' => $emailAddress,
                    'status' => 'active'
                ]);
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

        $session = Services::session();
        $session->set([
            'isLoggedIn' => true,
            'userId' => $tokenData['user_id']
        ]);

        $authTokenModel->delete($tokenData['id']);
        return $this->respond(['status' => 'success', 'message' => 'Login successful.']);
    }

    public function logout()
    {
        $session = session();
        $session->destroy();
        return $this->respond(['status' => 'success', 'message' => 'Logged out successfully.']);
    }
}