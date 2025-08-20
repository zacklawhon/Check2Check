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

    // This method was already compliant. No changes needed.
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
        // 1. KEPT: Owner-only check is appropriate for creating goals.
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('Partners are not allowed to manage goals.');
        }

        // 2. CHANGED: Use the effective (owner's) ID for all data operations.
        $userId = $this->getEffectiveUserId();

        $rules = [
            'goal_name' => 'required|string|max_length[255]',
            'goal_type' => 'required|in_list[debt_reduction,savings]',
            'strategy' => 'required|in_list[avalanche,snowball,hybrid,savings]',
            'target_amount' => 'required|decimal',
            'current_amount' => 'permit_empty|decimal',
            'linked_account_id' => 'permit_empty|integer',
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $data = $this->validator->getValidated();
        $data['user_id'] = $userId;
        $data['status'] = 'active';

        if ($data['goal_type'] === 'savings' && !empty($data['linked_account_id'])) {
            $accountModel = new UserAccountModel();
            $account = $accountModel->where('id', $data['linked_account_id'])
                ->where('user_id', $userId) // Uses correct ID
                ->first();

            if ($account) {
                $data['current_amount'] = $account['current_balance'];
            } else {
                return $this->failNotFound('The specified savings account was not found.');
            }
        } else if ($data['goal_type'] === 'savings') {
            $data['current_amount'] = 0;
        }

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
        // 1. KEPT: Owner-only check is appropriate for updating goals.
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('Partners are not allowed to manage goals.');
        }

        // 2. CHANGED: Use the effective (owner's) ID for all data operations.
        $userId = $this->getEffectiveUserId();
        $goalModel = new UserGoalModel();

        $goal = $goalModel->where('id', $id)->where('user_id', $userId)->first();
        if (!$goal) {
            return $this->failNotFound('Goal not found.');
        }

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

    public function delete($id = null)
    {
        // 1. KEPT: Owner-only check is appropriate for deleting goals.
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('Partners are not allowed to manage goals.');
        }

        // 2. CHANGED: Use the effective (owner's) ID for all data operations.
        $userId = $this->getEffectiveUserId();
        $goalModel = new UserGoalModel();

        $goal = $goalModel->where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$goal) {
            return $this->failNotFound('Goal not found or you do not have permission to delete it.');
        }

        if ($goalModel->update($id, ['status' => 'deleted'])) {
            return $this->respondDeleted(['message' => 'Goal deleted successfully.']);
        }

        return $this->failServerError('Could not delete the goal.');
    }

    public function logPayment($id = null)
    {
        // 1. ADDED: Full permission check for this transactional method.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        // 2. CHANGED: Use the effective (owner's) ID for all data operations.
        $userId = $this->getEffectiveUserId();

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

        // 3. ADDED: Handle the "update by request" case.
        if ($permission === 'update_by_request') {
            $payload = [
                'goalId' => $id,
                'amount' => $amount,
                'budgetId' => $budgetId,
                'paymentType' => $paymentType
            ];
            $description = "Log a \${$amount} payment for goal: {$goal['goal_name']}";
            return $this->handlePartnerAction('log_goal_payment', $description, $budgetId, $payload);
        }

        // --- 4. Original logic for Owners or full_access Partners ---
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

                if ($goal['linked_account_id']) {
                    $accountModel = new UserAccountModel();
                    // SECURE: Ensures the account being updated also belongs to the owner.
                    $accountModel->where('id', $goal['linked_account_id'])
                        ->where('user_id', $userId)
                        ->increment('current_balance', $amount);
                }
            }

            $updateData = ['current_amount' => $newAmount];

            if (($paymentType === 'debt' && $newAmount <= 0) || ($paymentType === 'savings' && $newAmount >= (float) $goal['target_amount'])) {
                $updateData['status'] = 'completed';
            }

            $goalModel->update($id, $updateData);

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
            // SECURE: Ensures the budget being updated also belongs to the owner.
            $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
            if ($budget) {
                $expenses = json_decode($budget['initial_expenses'], true);

                $newExpenseItem = [
                    'label' => "Goal Payment: {$goal['goal_name']}",
                    'estimated_amount' => $amount,
                    'type' => 'variable',
                    'is_goal_payment' => true
                ];

                $expenses[] = $newExpenseItem;
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