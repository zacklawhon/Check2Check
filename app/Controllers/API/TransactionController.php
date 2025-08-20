<?php

namespace App\Controllers\API;

// 1. CHANGED: Must extend BaseAPIController to get permission helpers.
use App\Controllers\API\BaseAPIController;
use App\Models\TransactionModel;
use CodeIgniter\API\ResponseTrait;

class TransactionController extends BaseAPIController
{
    use ResponseTrait;

    public function addTransaction()
    {
        // 2. ADDED: Full permission check for this data modification action.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $rules = [
            'budget_cycle_id' => 'required|numeric',
            'type'            => 'required|in_list[income,expense]',
            'category_name'   => 'required|string|max_length[255]',
            'amount'          => 'required|decimal',
            'description'     => 'permit_empty|string',
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }
        
        $data = $this->validator->getValidated();

        // Handle the "update by request" case
        if ($permission === 'update_by_request') {
            $payload = $data;
            $description = "Add " . $data['type'] . ": '" . ($data['description'] ?: $data['category_name']) . "' for $" . number_format($data['amount'], 2);
            // This now uses the shared helper method from BaseAPIController
            return $this->handlePartnerAction('add_transaction', $description, $data['budget_cycle_id'], $payload);
        }

        // --- Original logic for Owners or full_access Partners ---
        
        // 3. CHANGED: Use the effective (owner's) ID for all data operations.
        $userId = $this->getEffectiveUserId();

        try {
            $transactionModel = new TransactionModel();
            $transactionId = $transactionModel->logTransaction(
                $userId,
                $data['budget_cycle_id'],
                $data['type'],
                $data['category_name'],
                (float) $data['amount'],
                $data['description']
            );

            if ($transactionId === false) {
                return $this->fail($transactionModel->errors());
            }

            $data['id'] = $transactionId;
            return $this->respondCreated($data, 'Transaction added successfully.');

        } catch (\Exception $e) {
            log_message('error', '[ERROR_LOG_TXN] {exception}', ['exception' => $e]);
            if ($e->getMessage() === 'Budget cycle not found or access denied.') {
                return $this->failNotFound($e->getMessage());
            }
            return $this->failServerError('Could not add transaction.');
        }
    }
}