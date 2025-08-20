<?php
namespace App\Controllers\API;

use App\Controllers\API\BaseAPIController;
use App\Models\UserGoalModel;
use App\Models\UserAccountModel;
use App\Models\TransactionModel;
use App\Models\BudgetCycleModel;
use CodeIgniter\API\ResponseTrait;

class GoalController extends BaseAPIController
{
    use ResponseTrait;

    public function index()
    {
        $userId = $this->getEffectiveUserId();
        $goalModel = new UserGoalModel();
        $goals = $goalModel->where('user_id', $userId)
            ->where('status', 'active')
            ->findAll();
        return $this->respond($goals);
    }

    public function create()
    {

        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('Partners are not allowed to manage goals.');
        }
        $userId = session()->get('userId');

        $session = session();
        $userId = $session->get('userId');

        $rules = [
            'goal_name' => 'required|string|max_length[255]',
            'goal_type' => 'required|in_list[debt_reduction,savings]',
            'strategy' => 'required|in_list[avalanche,snowball,hybrid,savings]',
            'target_amount' => 'required|decimal',
            'current_amount' => 'permit_empty|decimal', // Now optional
            'linked_account_id' => 'permit_empty|integer',
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $data = $this->validator->getValidated();
        $data['user_id'] = $userId;
        $data['status'] = 'active';

        // --- 2. NEW LOGIC FOR SAVINGS GOALS ---
        if ($data['goal_type'] === 'savings' && !empty($data['linked_account_id'])) {
            $accountModel = new UserAccountModel();
            $account = $accountModel->where('id', $data['linked_account_id'])
                ->where('user_id', $userId)
                ->first();

            // If the account is valid, set the goal's current amount to the account's balance
            if ($account) {
                $data['current_amount'] = $account['current_balance'];
            } else {
                // If an invalid account ID is sent, block the creation
                return $this->failNotFound('The specified savings account was not found.');
            }
        } else if ($data['goal_type'] === 'savings') {
            // If it's a new savings goal without a linked account, it starts at 0
            $data['current_amount'] = 0;
        }
        // --- END OF NEW LOGIC ---


        $goalModel = new UserGoalModel();
        $goalId = $goalModel->insert($data);

        if ($goalId === false) {
            return $this->fail($goalModel->errors());
        }

        $newGoal = $goalModel->find($goalId);
        return $this->respondCreated($newGoal);
    }

    public function update($id = null)
    {
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('Partners are not allowed to manage goals.');
        }
        $userId = session()->get('userId');

        $session = session();
        $userId = $session->get('userId');
        $goalModel = new UserGoalModel();

        // Ensure the goal exists and belongs to the user
        $goal = $goalModel->where('id', $id)->where('user_id', $userId)->first();
        if (!$goal) {
            return $this->failNotFound('Goal not found.');
        }

        // For now, we'll allow updating the name. This can be expanded.
        $rules = [
            'goal_name' => 'required|string|max_length[255]',
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $data = $this->validator->getValidated();

        if ($goalModel->update($id, $data) === false) {
            return $this->fail($goalModel->errors());
        }

        return $this->respondUpdated(['message' => 'Goal updated successfully.']);
    }

    // In GoalController.php

    public function delete($id = null)
    {
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('Partners are not allowed to manage goals.');
        }
        $userId = session()->get('userId');
        
        $session = session();
        $userId = $session->get('userId');
        $goalModel = new UserGoalModel();

        // Ensure the goal exists and belongs to the user
        // FIX: Removed the incorrect '==' operator from the where clause.
        $goal = $goalModel->where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$goal) {
            return $this->failNotFound('Goal not found or you do not have permission to delete it.');
        }

        // Instead of a hard delete, we'll mark it as 'deleted'.
        if ($goalModel->update($id, ['status' => 'deleted'])) {
            return $this->respondDeleted(['message' => 'Goal deleted successfully.']);
        }

        return $this->failServerError('Could not delete the goal.');
    }

    public function logPayment($id = null)
    {
        $session = session();
        $userId = $session->get('userId');

        $rules = [
            'amount' => 'required|decimal|greater_than[0]',
            'budgetId' => 'required|integer',
            'paymentType' => 'required|in_list[debt,savings]'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $amount = (float) $this->request->getVar('amount');
        $budgetId = $this->request->getVar('budgetId');
        $paymentType = $this->request->getVar('paymentType');

        $goalModel = new UserGoalModel();
        $goal = $goalModel->where('id', $id)->where('user_id', $userId)->first();

        if (!$goal) {
            return $this->failNotFound('Goal not found.');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        try {
            $currentAmount = (float) $goal['current_amount'];
            $newAmount = $currentAmount;
            $transactionType = 'expense';
            $transactionCategory = 'Extra Debt Payment';

            if ($paymentType === 'debt') {
                $newAmount -= $amount;
            } else { // savings
                $newAmount += $amount;
                $transactionType = 'savings';
                $transactionCategory = 'Goal Contribution';

                // If the goal is linked to a real account, update the account balance too
                if ($goal['linked_account_id']) {
                    $accountModel = new UserAccountModel();
                    $accountModel->where('id', $goal['linked_account_id'])->increment('current_balance', $amount);
                }
            }

            $updateData = ['current_amount' => $newAmount];

            // Check if the goal is now complete
            if (($paymentType === 'debt' && $newAmount <= 0) || ($paymentType === 'savings' && $newAmount >= (float) $goal['target_amount'])) {
                $updateData['status'] = 'completed';
            }

            $goalModel->update($id, $updateData);

            // Log a transaction to reflect this payment in the budget
            $transactionModel = new TransactionModel();
            $transactionModel->logTransaction(
                $userId,
                $budgetId,
                $transactionType,
                $transactionCategory,
                $amount,
                "Payment for goal: {$goal['goal_name']}"
            );

            $budgetModel = new BudgetCycleModel();
            $budget = $budgetModel->find($budgetId);
            if ($budget) {
                $expenses = json_decode($budget['initial_expenses'], true);

                // Create a new variable expense item that is instantly "paid"
                $newExpenseItem = [
                    'label' => "Goal Payment: {$goal['goal_name']}",
                    'estimated_amount' => $amount,
                    'type' => 'variable',
                    // This custom flag will tell the frontend to display it differently
                    'is_goal_payment' => true
                ];

                $expenses[] = $newExpenseItem; // Add it to the list

                // Save the updated list of expenses back to the budget
                $budgetModel->update($budgetId, ['initial_expenses' => json_encode($expenses)]);
            }

            $db->transComplete();

            if ($db->transStatus() === false) {
                throw new \Exception('Database transaction failed.');
            }

            return $this->respondUpdated(['message' => 'Payment logged successfully.']);

        } catch (\Exception $e) {
            log_message('error', '[GOAL_PAYMENT_ERROR] ' . $e->getMessage());
            return $this->failServerError('Could not log payment.');
        }
    }
}
