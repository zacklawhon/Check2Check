<?php

namespace App\Controllers\API;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;
use App\Models\InvitationModel;
use App\Models\UserModel;
use Config\Services;

class InvitationController extends BaseController
{
    use ResponseTrait;

    /**
     * Sends an invitation email to a recipient for joining Check2Check.
     *
     * Validates the recipient’s email, checks if the inviter exists, prevents self-invitations and
     * inviting existing users, enforces a daily invitation limit (5 per day), generates a unique
     * invitation token, and sends an email with a registration link. No redundancy within the
     * controller, but the email-sending logic is similar to AuthController’s sendWelcomeEmail and
     * sendReturningUserEmail. A shared sendEmail helper could reduce duplication across controllers.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if the invitation is sent,
     * a 404 if the inviter is not found, a validation error for invalid input or existing users,
     * a 429 for exceeding the daily limit, or a 500 error if email sending fails.
     */
    public function sendInvite()
    {
        $rules = ['recipient_email' => 'required|valid_email'];
        if (!$this->validate($rules)) {
            return $this->failValidationErrors('A valid email address is required.');
        }

        $inviterId = session()->get('userId');
        $recipientEmail = $this->validator->getValidated()['recipient_email'];

        $userModel = new UserModel();
        $inviter = $userModel->find($inviterId);
        if (!$inviter) {
            return $this->failNotFound('Inviting user not found.');
        }

        // Optional: Prevent users from inviting themselves
        if ($inviter['email'] === $recipientEmail) {
            return $this->failValidationErrors('You cannot invite yourself.');
        }
        
        // Optional: Check if the recipient is already a user
        $existingRecipient = $userModel->where('email', $recipientEmail)->first();
        if ($existingRecipient) {
            return $this->failValidationErrors('This person is already a member of Check2Check.');
        }

        $invitationModel = new InvitationModel();

        // Optional: Rate limiting to prevent spam (e.g., 5 invites per day)
        $today = date('Y-m-d 00:00:00');
        $sentToday = $invitationModel->where('inviter_user_id', $inviterId)->where('created_at >=', $today)->countAllResults();
        if ($sentToday >= 7) {
            return $this->fail('You have reached the maximum number of daily invitations.', 429); // 429 Too Many Requests
        }

        $token = bin2hex(random_bytes(32));

        $invitationModel->insert([
            'inviter_user_id' => $inviterId,
            'recipient_email' => $recipientEmail,
            'invite_token'    => $token

        ]);

        $this->sendInvitationEmail($recipientEmail, $inviter['email'], $token);

        return $this->respond(['message' => 'Invitation sent successfully!']);
    }

    /**
     * Retrieves all invitations sent by the authenticated user.
     *
     * Fetches all invitations from the InvitationModel for the current user, ordered by creation date.
     * No redundancy with other methods or controllers, as invitation retrieval is a unique feature.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a JSON response with an array of invitations.
     */
    public function getUserInvitations()
    {
        $inviterId = session()->get('userId');
        $invitationModel = new InvitationModel();

        $invitations = $invitationModel->where('inviter_user_id', $inviterId)->orderBy('created_at', 'DESC')->findAll();
        
        return $this->respond($invitations);
    }
    
    /**
     * Sends an invitation email to the recipient with a registration link.
     *
     * Prepares email data (inviter email, pitch message, registration link) and sends the email using
     * the email service. Logs and throws an exception if sending fails. Note: Shares email-sending
     * logic with AuthController’s sendWelcomeEmail and sendReturningUserEmail. A shared sendEmail
     * helper in BaseController or a utility class could reduce duplication across controllers.
     *
     * @param string $recipientEmail The email address of the recipient.
     * @param string $inviterEmail The email address of the inviting user.
     * @param string $token The unique invitation token.
     * @throws \Exception If the email fails to send.
     */
    private function sendInvitationEmail(string $recipientEmail, string $inviterEmail, string $token)
    {
        $email = Services::email();
        
        $data = [
            'inviterEmail' => $inviterEmail,
            'pitchMessage' => "It's a simple, no-nonsense app that helps you track your income and expenses so you always know where your money is going.",
            'inviteLink'   => site_url('register?invite_token=' . $token) // Link to your frontend registration page
        ];

        $message = view('emails/invitation', $data);

        $email->setTo($recipientEmail);
        $email->setSubject($inviterEmail . ' has invited you to Check2Check!');
        $email->setMessage($message);

        if (!$email->send(false)) { // `false` prevents clearing the email for debugging
            log_message('error', 'Invitation Email Send Failed: ' . $email->printDebugger(['headers']));
            $email->clear(); // Manually clear after logging
            throw new \Exception('The email service failed to send the invitation.');
        }
        $email->clear();
    }
}