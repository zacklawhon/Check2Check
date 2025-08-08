<?php

namespace App\Controllers\API;

use App\Controllers\BaseController;
use App\Models\TransactionModel;
use CodeIgniter\API\ResponseTrait;

class TransactionController extends BaseController
{
    use ResponseTrait;

    /**
     * Adds a new transaction for the authenticated user.
     *
     * Validates input (budget cycle ID, type, category, amount, description) and logs the transaction
     * using TransactionModel::logTransaction. Returns the transaction data with the new ID. Shares
     * logTransaction with BudgetController methods (e.g., createCycle, markBillPaid, addSavings),
     * but serves a distinct purpose: manual transaction entry vs. automated logging for budget actions.
     * The centralized logTransaction method avoids duplication of core logic. No redundancy within
     * the controller or with other controllers.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a 201 response with the transaction data if saved,
     * a 404 if the budget cycle is not found or access is denied, a validation error for invalid input,
     * or a 500 error if insertion fails.
     */
    public function addTransaction()
    {
        $session = session();
        $userId = $session->get('userId');

        $rules = [
            'budget_cycle_id' => 'required|numeric',
            'type' => 'required|in_list[income,expense]',
            'category_name' => 'required|string|max_length[255]',
            'amount' => 'required|decimal',
            'description' => 'permit_empty|string',
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        try {
            $transactionModel = new TransactionModel();
            $transactionId = $transactionModel->logTransaction(
                $userId,
                $this->request->getVar('budget_cycle_id'),
                $this->request->getVar('type'),
                $this->request->getVar('category_name'),
                (float) $this->request->getVar('amount'),
                $this->request->getVar('description')
            );

            if ($transactionId === false) {
                return $this->fail($transactionModel->errors());
            }

            $data = $this->request->getJSON(true);
            $data['id'] = $transactionId;
            return $this->respondCreated($data, 'Transaction added successfully.');

        } catch (\Exception $e) {
            log_message('error', '[ERROR_LOG_TXN] {exception}', ['exception' => $e]);
            // Provide a generic error but also a specific one if access is denied.
            if ($e->getMessage() === 'Budget cycle not found or access denied.') {
                return $this->failNotFound($e->getMessage());
            }
            return $this->failServerError('Could not add transaction.');
        }
    }
}