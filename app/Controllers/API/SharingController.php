<?php

namespace App\Controllers\API;

use App\Controllers\BaseController;
use App\Models\InvitationModel;
use App\Models\UserModel;
use App\Models\ActionRequestModel;
use CodeIgniter\API\ResponseTrait;
use Config\Services;

class SharingController extends BaseAPIController
{
    use ResponseTrait;

    public function sendInvite()
    {
        $session = session();
        $ownerId = $session->get('userId');
        $owner = $session->get('user');

        $rules = [
            'email' => 'required|valid_email',
            'permission_level' => 'required|in_list[read_only,update_by_request,full_access]',
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $recipientEmail = $this->request->getVar('email');
        $permissionLevel = $this->request->getVar('permission_level');

        if ($owner && $owner['email'] === $recipientEmail) {
            return $this->failValidationErrors('You cannot invite yourself.');
        }

        $invitationModel = new InvitationModel();
        $token = bin2hex(random_bytes(32));

        $inviteData = [
            'inviter_user_id' => $ownerId,
            'recipient_email' => $recipientEmail,
            'invite_token' => $token,
            'status' => 'sent',
            'invite_type' => 'share',
            'permission_level' => $permissionLevel,
            'expires_at' => date('Y-m-d H:i:s', strtotime('+7 days')),
        ];
        $invitationModel->insert($inviteData);

        // --- ADDED: Email Sending Logic ---
        try {
            $email = Services::email();
            $emailData = [
                'ownerName' => $owner['email'], // Or a name field if you have one
                // Update the invite link to point to the frontend route
                'inviteLink' => site_url('accept-invite?token=' . $token)
            ];
            $message = view('emails/share_invitation', $emailData);

            $email->setTo($recipientEmail);
            $email->setSubject($owner['email'] . ' has invited you to share a budget');
            $email->setMessage($message);

            if (!$email->send(false)) {
                log_message('error', 'Share Invitation Email Send Failed: ' . $email->printDebugger(['headers']));
                // Even if email fails, the invite was created, so don't fail the whole request.
            }
        } catch (\Exception $e) {
            log_message('error', '[SEND_SHARE_INVITE_ERROR] ' . $e->getMessage());
        }
        // --- END: Email Sending Logic ---

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

        if (!$request || (int) $request['owner_user_id'] !== (int) $ownerId) {
            return $this->failNotFound('Action request not found or you do not have permission to approve it.');
        }

        $payload = json_decode($request['payload'], true);
        $budgetService = new \App\Services\BudgetService();
        $updatedBudget = null;

        // Execute the action based on action_type
        switch ($request['action_type']) {
            case 'add_income':
                $incomeData = [
                    'label' => $payload['label'],
                    'amount' => $payload['amount'],
                    'date' => $payload['date'],
                    'frequency' => $payload['frequency'] ?? 'one-time'
                ];
                $saveAsRecurring = $payload['save_recurring'] ?? false;
                $updatedBudget = $budgetService->addIncomeToCycle($this->getEffectiveUserId(), $request['budget_cycle_id'], $incomeData, $saveAsRecurring);
                break;
            case 'remove_income':
                $updatedBudget = $budgetService->removeIncomeFromCycle($this->getEffectiveUserId(), $request['budget_cycle_id'], $payload['label'], $payload['date'] ?? null, $payload['id'] ?? null);
                break;
            case 'add_expense':
                $expenseData = [
                    'label' => $payload['label'],
                    'estimated_amount' => $payload['estimated_amount'],
                    'category' => $payload['category'] ?? 'other',
                    'type' => $payload['type'],
                    'due_date' => $payload['due_date'] ?? null,
                    'is_paid' => false
                ];
                $saveAsRecurring = $payload['save_recurring'] ?? false;
                $updatedBudget = $budgetService->addExpenseToCycle($this->getEffectiveUserId(), $request['budget_cycle_id'], $expenseData, $saveAsRecurring);
                break;
            case 'remove_expense':
                $updatedBudget = $budgetService->removeExpenseFromCycle($this->getEffectiveUserId(), $request['budget_cycle_id'], $payload['label']);
                break;
            case 'update_variable_expense':
                $updatedBudget = $budgetService->updateVariableExpenseAmount($this->getEffectiveUserId(), $request['budget_cycle_id'], $payload['label'], $payload['amount']);
                break;
            case 'mark_bill_paid':
                $updatedBudget = $budgetService->markBillPaid($this->getEffectiveUserId(), $request['budget_cycle_id'], $payload['label'], $payload['amount']);
                break;
            case 'mark_bill_unpaid':
                $updatedBudget = $budgetService->markBillUnpaid($this->getEffectiveUserId(), $request['budget_cycle_id'], $payload['label']);
                break;
            case 'update_income_in_cycle':
                $updatedBudget = $budgetService->updateIncomeInCycle($this->getEffectiveUserId(), $request['budget_cycle_id'], $payload['original_label'], $payload['label'], $payload['amount'], $payload['date']);
                break;
            case 'update_recurring_expense':
                $updatedBudget = $budgetService->updateRecurringExpenseInCycle($this->getEffectiveUserId(), $request['budget_cycle_id'], $payload['label'], $payload['estimated_amount'], $payload['due_date']);
                break;
            case 'adjust_income':
                $updatedBudget = $budgetService->adjustIncomeInCycle($this->getEffectiveUserId(), $request['budget_cycle_id'], $payload['label'], $payload['new_amount']);
                break;
            case 'update_initial_income':
                $updatedBudget = $budgetService->updateInitialIncomeAmount($this->getEffectiveUserId(), $request['budget_cycle_id'], $payload['id'], $payload['amount']);
                break;
            case 'mark_income_received':
                $updatedBudget = $budgetService->markIncomeReceived($this->getEffectiveUserId(), $request['budget_cycle_id'], $payload['label'], $payload['amount'], $payload['date']);
                break;
            case 'update_budget_dates':
                $updatedBudget = $budgetService->updateBudgetDates($this->getEffectiveUserId(), $request['budget_cycle_id'], $payload['start_date'], $payload['end_date']);
                break;
            // Add more cases as needed for other action_types
            default:
                // For unsupported actions, just delete the request
                break;
        }

        // Delete the request after execution
        $actionRequestModel->delete($requestId);

        // Return the updated budget state
        if (!$updatedBudget) {
            $updatedBudget = $budgetService->getCompleteBudgetState($this->getEffectiveUserId(), $request['budget_cycle_id']);
        }
        return $this->respondUpdated($updatedBudget);
    }

    /**
     * Accepts a sharing invitation.
     * This method is called when a user clicks the invite link.
     */
    public function acceptInvite()
    {
        $token = $this->request->getJSON()->token ?? null;
        if (empty($token)) {
            return $this->fail('Invitation token is required.');
        }

        $invitationModel = new InvitationModel();
        $userModel = new UserModel();

        // Accept invites with status 'sent'
        $invite = $invitationModel->where('invite_token', $token)->first();

        if (!$invite || $invite['invite_type'] !== 'share' || $invite['status'] !== 'sent') {
            return $this->failNotFound('This invitation is invalid, has expired, or has already been accepted.');
        }

        // 2. Check if a user already exists with the recipient's email
        $recipientEmail = $invite['recipient_email'];
        $existingUser = $userModel->where('email', $recipientEmail)->first();

        $db = \Config\Database::connect();
        $db->transStart();

        try {
            // --- SCENARIO A: The user is NEW ---
            if (!$existingUser) {
                // Create the new user as a partner
                $newUserId = $userModel->insert([
                    'email' => $recipientEmail,
                    'status' => 'active',
                    'owner_user_id' => $invite['inviter_user_id'],
                    'permission_level' => $invite['permission_level'],
                ]);

                // Mark the invitation as accepted
                $invitationModel->update($invite['id'], [
                    'status' => 'accepted',
                    'claimed_by_user_id' => $newUserId,
                    'claimed_at' => date('Y-m-d H:i:s'),
                ]);

                $db->transComplete();

                if ($db->transStatus() === false) {
                    throw new \Exception('Database transaction failed during new user creation.');
                }

                // Create a session for the new user to log them in automatically
                $newUser = $userModel->find($newUserId);
                $sessionData = [
                    'isLoggedIn' => true,
                    'userId' => $newUser['id'],
                    'user' => $newUser,
                    'ownerUserId' => $newUser['owner_user_id'],
                    'permissionLevel' => $newUser['permission_level'],
                ];

                Services::session()->set($sessionData);

                return $this->respondCreated([
                    'message' => 'Account created and invitation accepted.',
                    'status' => 'new_user_accepted'
                ]);
            }

            // --- SCENARIO B: The user ALREADY EXISTS ---
            else {
                // Do not change the database yet.
                // Send a specific status to the frontend, which will prompt the user to confirm.
                return $this->respond([
                    'message' => 'You already have an account. Please confirm you want to convert it to a partner account.',
                    'status' => 'existing_user_confirmation_required',
                    'invite_token' => $token // Send the token back for the next step
                ]);
            }
        } catch (\Exception $e) {
            log_message('error', '[ACCEPT_INVITE_ERROR] ' . $e->getMessage());
            return $this->failServerError('Could not process the invitation.');
        }
    }

    /**
     * Converts an existing user's account into a partner account.
     * This is a destructive action that deletes the user's old financial data.
     */
    public function transformAccount()
    {
        $rules = ['token' => 'required|string'];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $token = $this->request->getVar('token');
        $session = Services::session();
        $loggedInUserId = $session->get('userId');

        // 1. The user must be logged in to their own account to confirm this.
        if (!$loggedInUserId) {
            return $this->failUnauthorized('You must be logged in to perform this action.');
        }

        $invitationModel = new InvitationModel();
        $userModel = new UserModel();

        // 2. Re-validate the invitation token
        $invite = $invitationModel->where('invite_token', $token)->first();
        if (!$invite || $invite['invite_type'] !== 'share' || $invite['status'] !== 'pending') {
            return $this->failNotFound('This invitation is invalid, has expired, or has already been accepted.');
        }

        // 3. Security Check: Ensure the logged-in user is the one who was invited.
        $user = $session->get('user');
        if ($user['email'] !== $invite['recipient_email']) {
            return $this->failForbidden('This invitation is not for the currently logged-in user.');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        try {
            // 4. Delete all personal financial data for the user.
            // NOTE: Add any other relevant models here!
            $modelsToDeleteFrom = [
                new \App\Models\BudgetCycleModel(),
                new \App\Models\UserGoalModel(),
                new \App\Models\UserAccountModel(),
                new \App\Models\TransactionModel(),
                new \App\Models\IncomeSourceModel(),
                new \App\Models\RecurringExpenseModel(),
            ];

            foreach ($modelsToDeleteFrom as $model) {
                $model->where('user_id', $loggedInUserId)->delete();
            }

            // 5. Update the user's record to link them to the owner.
            $userModel->update($loggedInUserId, [
                'owner_user_id' => $invite['inviter_user_id'],
                'permission_level' => $invite['permission_level'],
            ]);

            // 6. Mark the invitation as accepted.
            $invitationModel->update($invite['id'], [
                'status' => 'accepted',
                'claimed_by_user_id' => $loggedInUserId,
                'claimed_at' => date('Y-m-d H:i:s'),
            ]);

            $db->transComplete();
            if ($db->transStatus() === false) {
                throw new \Exception('Database transaction failed during account transformation.');
            }
        } catch (\Exception $e) {
            log_message('error', '[TRANSFORM_ACCOUNT_ERROR] ' . $e->getMessage());
            return $this->failServerError('Could not transform the account.');
        }

        // 7. Re-create the session with the new partner information.
        $updatedUser = $userModel->find($loggedInUserId);
        $sessionData = [
            'isLoggedIn' => true,
            'userId' => $updatedUser['id'],
            'user' => $updatedUser,
            'ownerUserId' => $updatedUser['owner_user_id'],
            'permissionLevel' => $updatedUser['permission_level'],
        ];
        $session->set($sessionData);

        return $this->respond([
            'message' => 'Account successfully converted to a partner account.',
            'status' => 'transform_complete'
        ]);
    }

    /**
     * Updates the permission level for an existing partner.
     * This action can only be performed by the budget owner.
     */
    public function updatePermission($partnerId)
    {
        // 1. This action is performed by the owner.
        $ownerId = session()->get('userId');

        // 2. Validate the new permission level from the request body.
        $rules = [
            'permission_level' => 'required|in_list[read_only,update_by_request,full_access]',
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $newPermissionLevel = $this->request->getVar('permission_level');
        $userModel = new UserModel();

        // 3. Security Check: Find the partner AND verify they belong to the owner.
        $partner = $userModel->where('id', $partnerId)
            ->where('owner_user_id', $ownerId)
            ->first();

        if (!$partner) {
            return $this->failNotFound('Partner not found or you do not have permission to modify this user.');
        }

        // 4. Update the partner's user record with the new permission level.
        try {
            $userModel->update($partnerId, ['permission_level' => $newPermissionLevel]);
            return $this->respondUpdated(['message' => 'Partner permissions updated successfully.']);
        } catch (\Exception $e) {
            log_message('error', '[UPDATE_PERMISSION_ERROR] ' . $e->getMessage());
            return $this->failServerError('Could not update partner permissions.');
        }
    }

    /**
     * Revokes a partner's access to the owner's budget.
     * This severs the link and converts the partner's account back to a standard account.
     */
    public function revokeAccess($partnerId)
    {
        // 1. This action is performed by the owner.
        $ownerId = session()->get('userId');
        $owner = session()->get('user'); // Get the full owner object
        $userModel = new UserModel();

        // 2. Security Check: Find the partner AND verify they belong to the owner.
        $partner = $userModel->where('id', $partnerId)
            ->where('owner_user_id', $ownerId)
            ->first();

        if (!$partner) {
            return $this->failNotFound('Partner not found or you do not have permission to modify this user.');
        }

        // 3. Update the partner's record to sever the link.
        try {
            $userModel->update($partnerId, [
                'owner_user_id' => null,
                'permission_level' => null,
            ]);

            // 4. ADDED: Send the notification email.
            $email = Services::email();
            $emailData = [
                'ownerName' => $owner['email'] // Or a name field if you have one
            ];
            $message = view('emails/access_revoked', $emailData);

            $email->setTo($partner['email']);
            $email->setSubject('Your Shared Access Has Been Updated');
            $email->setMessage($message);

            if (!$email->send(false)) {
                // Log the error but don't stop the process, as the access was successfully revoked.
                log_message('error', 'Revoke Access Email Send Failed: ' . $email->printDebugger(['headers']));
            }

            return $this->respondUpdated(['message' => 'Partner access has been successfully revoked.']);

        } catch (\Exception $e) {
            log_message('error', '[REVOKE_ACCESS_ERROR] ' . $e->getMessage());
            return $this->failServerError('Could not revoke partner access.');
        }
    }

    /**
     * Fetches all pending action requests for a given budget cycle.
     * Only the owner of the budget can access these requests.
     */
    public function getActionRequests($budgetId)
    {
        // 1. This action is performed by the owner.
        $ownerId = $this->getEffectiveUserId();

        $actionRequestModel = new ActionRequestModel();

        // 2. Find all 'pending' requests that belong to this  budget.
        $requests = $actionRequestModel
            ->where('owner_user_id', $ownerId)
            ->where('budget_cycle_id', $budgetId)
            ->where('status', 'pending')
            ->findAll();

        return $this->respond($requests);
    }

    public function denyActionRequest($requestId)
    {
        $ownerId = session()->get('userId');
        $actionRequestModel = new ActionRequestModel();

        $request = $actionRequestModel->find($requestId);

        if (!$request || (int) $request['owner_user_id'] !== (int) $ownerId) {
            return $this->failNotFound('Action request not found or you do not have permission to deny it.');
        }

        // Simply delete the request.
        $actionRequestModel->delete($requestId);

        // Fetch and return the updated budget state
        $budgetService = new \App\Services\BudgetService();
        $updatedBudget = $budgetService->getCompleteBudgetState($this->getEffectiveUserId(), $request['budget_cycle_id']);

        return $this->respondUpdated($updatedBudget);
    }

    public function cancelActionRequest($requestId)
    {
        // 1. This action is performed by the partner who made the request.
        $requesterId = session()->get('userId');
        $actionRequestModel = new ActionRequestModel();

        $request = $actionRequestModel->find($requestId);

        // 2. Security Check: Ensure the request exists and that the logged-in user is the one who created it.
        if (!$request || (int) $request['requester_user_id'] !== (int) $requesterId) {
            return $this->failNotFound('Action request not found or you do not have permission to cancel it.');
        }

        // 3. Delete the request.
        $actionRequestModel->delete($requestId);

        // 4. Fetch and return the updated budget state.
        $budgetService = new \App\Services\BudgetService();
        $updatedBudget = $budgetService->getCompleteBudgetState($this->getEffectiveUserId(), $request['budget_cycle_id']);

        return $this->respondUpdated($updatedBudget);
    }

    /**
     * Fetches partners and pending invites for the current user.
     */
    public function getPartnersAndInvites()
    {
        $userId = $this->getEffectiveUserId();

        // --- Fetch partners (users who have accepted the invite) ---
        $userModel = new UserModel();
        $partners = $userModel->where('owner_user_id', $userId)->findAll();

        // --- Fetch pending invites (status = 'sent') ---
        $inviteModel = new InvitationModel(); // <-- Use InvitationModel
        $pendingInvites = $inviteModel
            ->where('inviter_user_id', $userId)
            ->where('invite_type', 'share')
            ->where('status', 'sent')
            ->findAll();

        return $this->respond([
            'partners' => $partners,
            'pendingInvites' => $pendingInvites,
        ]);
    }

    /**
     * Cancels a pending invite by the owner.
     */
    public function cancelInvite($inviteId)
    {
        $ownerId = session()->get('userId');
        $invitationModel = new InvitationModel();

        $invite = $invitationModel
            ->where('id', $inviteId)
            ->where('inviter_user_id', $ownerId)
            ->where('status', 'sent')
            ->first();

        if (!$invite) {
            return $this->failNotFound('Invite not found or already claimed/cancelled.');
        }

        // You can either delete or update status to 'cancelled'
        $invitationModel->delete($inviteId);

        return $this->respondDeleted(['message' => 'Invite cancelled.']);
    }
}

