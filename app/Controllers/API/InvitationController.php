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
        if ($sentToday >= 5) {
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

    public function getUserInvitations()
    {
        $inviterId = session()->get('userId');
        $invitationModel = new InvitationModel();

        $invitations = $invitationModel->where('inviter_user_id', $inviterId)->orderBy('created_at', 'DESC')->findAll();
        
        return $this->respond($invitations);
    }
    
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