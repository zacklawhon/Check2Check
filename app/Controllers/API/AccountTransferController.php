<?php

namespace App\Controllers\API;

use App\Controllers\API\BaseAPIController;
use App\Models\BudgetCycleModel;
use App\Models\TransactionModel;
use App\Models\UserAccountModel;
use CodeIgniter\API\ResponseTrait;

class AccountTransferController extends BaseAPIController
{
    use ResponseTrait;

    public function transferToAccount($budgetId)
    {
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $rules = [
            'account_id' => 'required|integer',
            'amount' => 'required|decimal|greater_than[0]'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $accountId = $this->request->getVar('account_id');
        $amount = (float) $this->request->getVar('amount');

        $userId = $this->getEffectiveUserId();
        $accountModel = new UserAccountModel();
        $account = $accountModel->where('id', $accountId)->where('user_id', $userId)->first();
        if (!$account) {
            return $this->failNotFound('Account not found.');
        }

        if ($permission === 'update_by_request') {
            $payload = ['account_id' => $accountId, 'amount' => $amount];
            $description = "Transfer $" . number_format($amount, 2) . " to " . $account['account_name'];
            return $this->handlePartnerAction('transfer_to_account', $description, $budgetId, $payload);
        }

        $newBalance = (float) $account['current_balance'] + $amount;
        $accountModel->update($accountId, ['current_balance' => $newBalance]);

        $transactionModel = new TransactionModel();
        $transactionModel->logTransaction(
            $userId,
            $budgetId,
            'savings',
            'Transfer',
            $amount,
            'Transfer to ' . $account['account_name']
        );

        return $this->respondUpdated(['message' => 'Transfer successful.']);
    }

    public function transferFromAccount($budgetId)
    {
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $rules = [
            'account_id' => 'required|integer',
            'amount' => 'required|decimal|greater_than[0]',
            'transfer_type' => 'required|in_list[income,external]'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $accountId = $this->request->getVar('account_id');
        $amount = (float) $this->request->getVar('amount');
        $transferType = $this->request->getVar('transfer_type');

        $userId = $this->getEffectiveUserId();
        $accountModel = new UserAccountModel();
        $account = $accountModel->where('id', $accountId)->where('user_id', $userId)->first();
        if (!$account) {
            return $this->failNotFound('Account not found.');
        }

        if ($amount > (float) $account['current_balance']) {
            return $this->failValidationErrors('Transfer amount cannot exceed the account balance.');
        }

        if ($permission === 'update_by_request') {
            $payload = [
                'account_id' => $accountId,
                'amount' => $amount,
                'transfer_type' => $transferType
            ];
            $description = "Transfer $" . number_format($amount, 2) . " from " . $account['account_name'];
            return $this->handlePartnerAction('transfer_from_account', $description, $budgetId, $payload);
        }

        $newBalance = (float) $account['current_balance'] - $amount;
        $accountModel->update($accountId, ['current_balance' => $newBalance]);

        if ($transferType === 'income') {
            $transactionModel = new TransactionModel();
            $transactionModel->logTransaction(
                $userId,
                $budgetId,
                'income',
                'Transfer',
                $amount,
                'Transfer from ' . $account['account_name']
            );

            $budgetCycleModel = new BudgetCycleModel();
            $budgetCycle = $budgetCycleModel->where('id', $budgetId)->where('user_id', $userId)->first();
            if ($budgetCycle) {
                $incomeItems = json_decode($budgetCycle['initial_income'], true);
                $newIncomeItem = [
                    'label' => 'Transfer from ' . $account['account_name'],
                    'amount' => $amount,
                    'frequency' => 'one-time'
                ];
                $incomeItems[] = $newIncomeItem;
                $budgetCycleModel->update($budgetId, ['initial_income' => json_encode($incomeItems)]);
            }
        }
        return $this->respondUpdated(['message' => 'Transfer successful.']);
    }
}