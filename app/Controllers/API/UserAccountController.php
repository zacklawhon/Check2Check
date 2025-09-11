<?php

namespace App\Controllers\API;

// 1. CHANGED: Must extend BaseAPIController to get permission helpers.
use App\Controllers\API\BaseAPIController;
use App\Models\UserAccountModel;
use CodeIgniter\API\ResponseTrait;

class UserAccountController extends BaseAPIController
{
    use ResponseTrait;

    // This method is already compliant.
    public function index()
    {
        $userId = $this->getEffectiveUserId();
        $model = new UserAccountModel();
        $accounts = $model->where('user_id', $userId)->findAll();
        return $this->respond($accounts);
    }

    public function create()
    {
        // 2. ADDED: Owner-only check for this high-level action.
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('Only the budget owner can create new accounts.');
        }

        $userId = $this->getEffectiveUserId();
        $rules = [
            'account_name' => 'required|string|max_length[255]',
            'account_type' => 'required|in_list[checking,savings,credit_card,other]',
            'current_balance' => 'required|decimal'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $data = $this->validator->getValidated();
        $data['user_id'] = $userId;

        $model = new UserAccountModel();
        $id = $model->insert($data);

        if ($id === false) {
            return $this->fail($model->errors());
        }

        $newAccount = $model->find($id);
        return $this->respondCreated($newAccount);
    }

    public function update($id = null)
    {
        // 3. ADDED: Owner-only check for this high-level action.
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('Only the budget owner can modify accounts.');
        }

        $userId = $this->getEffectiveUserId();
        $model = new UserAccountModel();

        $account = $model->where('id', $id)->where('user_id', $userId)->first();
        if (!$account) {
            return $this->failNotFound('Account not found.');
        }

        $rules = [
            'account_name' => 'required|string|max_length[255]',
            'account_type' => 'required|in_list[checking,savings,credit_card,other]',
            'manage_url' => 'permit_empty|valid_url|max_length[255]'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        if ($model->update($id, $this->validator->getValidated()) === false) {
            return $this->fail($model->errors());
        }

        return $this->respondUpdated($model->find($id));
    }

    public function delete($id = null)
    {
        // 4. ADDED: Owner-only check for this high-level action.
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('Only the budget owner can delete accounts.');
        }

        $userId = $this->getEffectiveUserId();
        $model = new UserAccountModel();

        $account = $model->where('id', $id)->where('user_id', $userId)->first();
        if (!$account) {
            return $this->failNotFound('Account not found.');
        }

        if ($model->delete($id)) {
            return $this->respondDeleted(['id' => $id]);
        }

        return $this->failServerError('Could not delete account.');
    }

    public function updateBalance($id = null)
    {
        // 5. ADDED: Full permission logic for this transactional update.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $userId = $this->getEffectiveUserId();
        $model = new UserAccountModel();

        $account = $model->where('id', $id)->where('user_id', $userId)->first();
        if (!$account) {
            return $this->failNotFound('Account not found.');
        }

        $rules = [
            'current_balance' => 'required|decimal',
            // For partners, the frontend must also send the active budget ID
            'budget_cycle_id' => 'permit_empty|integer'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $newBalance = $this->request->getVar('current_balance');

        // Handle the "update by request" case
        if ($permission === 'update_by_request') {
            $budgetId = $this->request->getVar('budget_cycle_id');
            if (empty($budgetId)) {
                return $this->failValidationErrors('A budget_cycle_id is required to request this action.');
            }

            $payload = ['account_id' => $id, 'new_balance' => $newBalance];
            $description = "Update balance for '{$account['account_name']}' to $" . number_format($newBalance, 2);
            return $this->handlePartnerAction('update_account_balance', $description, $budgetId, $payload);
        }

        // --- Logic for Owners or full_access Partners ---
        if ($model->update($id, ['current_balance' => $newBalance]) === false) {
            return $this->fail($model->errors());
        }

        return $this->respondUpdated($model->find($id));
    }
}