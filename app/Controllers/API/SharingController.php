<?php

namespace App\Controllers\API;

use App\Controllers\BaseController;
use App\Models\InvitationModel;
use App\Models\UserModel;
use App\Models\ActionRequestModel;
use CodeIgniter\API\ResponseTrait;
use Config\Services;

class SharingController extends BaseController
{
    use ResponseTrait;

    /**
     * Sends a sharing invitation to a potential partner.
     */
    public function sendInvite()
    {
        $session = session();
        $ownerId = $session->get('userId');

        $rules = [
            'email' => 'required|valid_email',
            'permission_level' => 'required|in_list[read_only,update_by_request,full_access]',
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $recipientEmail = $this->request->getVar('email');
        $permissionLevel = $this->request->getVar('permission_level');

        // Prevent user from inviting themselves
        $user = $session->get('user');
        if ($user && $user['email'] === $recipientEmail) {
            return $this->failValidationErrors('You cannot invite yourself.');
        }

        $invitationModel = new InvitationModel();
        $token = bin2hex(random_bytes(32));

        $invitationModel->insert([
            'inviter_user_id'  => $ownerId,
            'recipient_email'  => $recipientEmail,
            'token'            => $token,
            'status'           => 'pending',
            'invite_type'      => 'share', // Specify the invite type
            'permission_level' => $permissionLevel,
            'expires_at'       => date('Y-m-d H:i:s', strtotime('+7 days')),
        ]);

        // Here you would send an email to $recipientEmail with a link:
        // e.g., site_url('accept-invite?token=' . $token)
        // For now, we'll just return success.

        return $this->respondCreated(['message' => 'Invitation sent successfully.']);
    }

    /**
     * Fetches all sharing-related invitations sent by the owner.
     */
    public function getInvites()
    {
        $ownerId = session()->get('userId');
        $invitationModel = new InvitationModel();

        $invites = $invitationModel
            ->where('inviter_user_id', $ownerId)
            ->where('invite_type', 'share')
            ->findAll();

        return $this->respond($invites);
    }

    /**
     * Approves a pending action request from a partner.
     */
    public function approveActionRequest($requestId)
    {
        $ownerId = session()->get('userId');
        $actionRequestModel = new ActionRequestModel();

        $request = $actionRequestModel->find($requestId);

        if (!$request || (int)$request['owner_user_id'] !== (int)$ownerId) {
            return $this->failNotFound('Action request not found or you do not have permission to approve it.');
        }

        // This is where the magic happens. We would have a service
        // that knows how to execute actions based on the 'action_type' and 'payload'.
        // For example:
        // $actionService = new \App\Services\ActionService();
        // $actionService->execute($request['action_type'], $request['payload']);

        // For now, we will just delete the request to complete the loop.
        $actionRequestModel->delete($requestId);

        return $this->respond(['message' => 'Action approved successfully.']);
    }
    
    // We will add the other methods like acceptInvite, revokeAccess, etc. in the next steps.
}
