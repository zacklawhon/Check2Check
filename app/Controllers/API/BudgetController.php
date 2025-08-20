<?php
// =================================================================
// FILE: /app/Controllers/API/BudgetController.php
// =================================================================

namespace App\Controllers\API;

use App\Controllers\API\BaseAPIController;
use App\Models\BudgetCycleModel;
use App\Models\IncomeSourceModel;
use App\Models\RecurringExpenseModel;
use App\Models\LearnedSpendingCategoryModel;
use App\Models\TransactionModel;
use App\Models\UserModel;
use App\Models\UserAccountModel;
use App\Models\UserFinancialToolsModel;
use App\Models\ActionRequestModel;
use App\Services\ProjectionService;
use CodeIgniter\API\ResponseTrait;
use DateTime;
use Exception;

class BudgetController extends BaseAPIController
{
    use ResponseTrait;

    private function handlePartnerAction(string $actionType, string $description, int $budgetId, array $payload)
    {
        $session = session();
        $requesterId = $session->get('userId');
        $ownerId = $this->getEffectiveUserId();

        $actionRequestModel = new ActionRequestModel();
        $actionRequestModel->insert([
            'requester_user_id' => $requesterId,
            'owner_user_id' => $ownerId,
            'budget_cycle_id' => $budgetId,
            'action_type' => $actionType,
            'payload' => json_encode($payload),
            'description' => $description,
        ]);

        return $this->respond(['message' => 'Your request has been sent to the budget owner for approval.']);
    }

    public function createCycle()
    {
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('Partners are not allowed to create new budgets.');
        }

        $userId = $this->getEffectiveUserId();
        $budgetCycleModel = new BudgetCycleModel();

        $existingActiveCycle = $budgetCycleModel->where('user_id', $userId)->where('status', 'active')->first();
        if ($existingActiveCycle) {
            return $this->fail('An active budget already exists.', 409);
        }

        $rules = [
            'start_date' => 'required|valid_date[Y-m-d]',
            'end_date' => 'required|valid_date[Y-m-d]',
            'income_sources' => 'required|string',
            'recurring_expenses' => 'required|string',
            'spending_categories' => 'required|string'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        try {
            $incomeSources = json_decode($this->request->getVar('income_sources'), true);
            $recurringExpenses = json_decode($this->request->getVar('recurring_expenses'), true);
            $spendingCategories = json_decode($this->request->getVar('spending_categories'), true);

            $allExpenses = [];
            foreach ($recurringExpenses as $exp) {
                $exp['type'] = 'recurring';
                $exp['is_paid'] = false;
                $allExpenses[] = $exp;
            }
            foreach ($spendingCategories as $cat) {
                $allExpenses[] = [
                    'label' => $cat['name'],
                    'estimated_amount' => null,
                    'category' => 'variable',
                    'type' => 'variable',
                ];
            }

            $newCycleData = [
                'user_id' => $userId,
                'start_date' => $this->request->getVar('start_date'),
                'end_date' => $this->request->getVar('end_date'),
                'status' => 'active',
                'initial_income' => json_encode($incomeSources),
                'initial_expenses' => json_encode($allExpenses),
            ];

            $budgetId = $budgetCycleModel->insert($newCycleData);
            if (!$budgetId) {
                return $this->fail($budgetCycleModel->errors());
            }

            return $this->respondCreated(['id' => $budgetId, 'message' => 'Budget cycle created successfully.']);
        } catch (\Exception $e) {
            log_message('error', '[ERROR_CREATE_CYCLE] {exception}', ['exception' => $e]);
            return $this->failServerError('Could not create budget cycle.');
        }
    }

    public function getCycles()
    {
        $userId = $this->getEffectiveUserId();
        $budgetCycleModel = new BudgetCycleModel();
        $cycles = $budgetCycleModel->where('user_id', $userId)->findAll();
        return $this->respond($cycles);
    }


    public function getCycleDetails($id)
    {
        $userId = $this->getEffectiveUserId(); // Use the effective user ID
        $budgetCycleModel = new BudgetCycleModel();
        $transactionModel = new TransactionModel();

        $budgetCycle = $budgetCycleModel->where('id', $id)
            ->where('user_id', $userId) // Now correctly queries for the owner's data
            ->first();

        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $initialIncome = json_decode($budgetCycle['initial_income'] ?? '[]', true);

        $transactions = $transactionModel->where('budget_cycle_id', $id)->findAll();

        $receivedIncomeDescriptions = [];
        foreach ($transactions as $t) {
            if ($t['type'] === 'income') {
                $receivedIncomeDescriptions[] = $t['description'];
            }
        }

        if (!empty($receivedIncomeDescriptions)) {
            foreach ($initialIncome as &$item) {
                // Check if the item has already been marked
                if (!isset($item['is_received'])) {
                    $isReceived = false;
                    // Loop through the transaction descriptions
                    foreach ($receivedIncomeDescriptions as $desc) {
                        // Check if the description CONTAINS the item label
                        if (strpos($desc, $item['label']) !== false) {
                            $isReceived = true;
                            break; // Found a match, no need to check further
                        }
                    }
                    if ($isReceived) {
                        $item['is_received'] = true;
                    }
                }
            }
        }

        $budgetCycle['initial_income'] = $initialIncome;
        $budgetCycle['initial_expenses'] = json_decode($budgetCycle['initial_expenses'] ?? '[]', true);
        $budgetCycle['final_summary'] = json_decode($budgetCycle['final_summary'] ?? '[]', true);

        return $this->respond($budgetCycle);
    }

    public function getTransactionsForCycle($cycleId)
    {
        $userId = $this->getEffectiveUserId();
        $transactionModel = new TransactionModel();

        $budgetCycleModel = new BudgetCycleModel();
        if (!$budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first()) {
            return $this->failNotFound('Budget cycle not found or access denied.');
        }

        $transactions = $transactionModel->where('budget_cycle_id', $cycleId)
            ->where('user_id', $userId)
            ->findAll();

        return $this->respond($transactions);
    }

    public function updateVariableExpenseAmount($cycleId)
    {
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $labelToUpdate = $this->request->getVar('label');
        $newAmount = $this->request->getVar('amount');

        if ($permission === 'update_by_request') {
            $payload = ['label' => $labelToUpdate, 'amount' => $newAmount];
            $description = "Update '{$labelToUpdate}' variable expense to $" . number_format($newAmount, 2);
            return $this->handlePartnerAction('update_variable_expense', $description, $cycleId, $payload);
        }

        $userId = $this->getEffectiveUserId();
        $budgetCycleModel = new BudgetCycleModel();

        $budgetCycle = $budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $labelToUpdate = $this->request->getVar('label');
        $newAmount = $this->request->getVar('amount');

        if (!is_numeric($newAmount)) {
            return $this->failValidationErrors('Amount must be a number.');
        }

        $expenses = json_decode($budgetCycle['initial_expenses'], true);
        $updated = false;
        foreach ($expenses as &$expense) {
            if ($expense['label'] === $labelToUpdate && $expense['category'] === 'variable') {
                $expense['estimated_amount'] = $newAmount;
                $updated = true;
                break;
            }
        }

        if ($updated) {
            $budgetCycleModel->update($cycleId, ['initial_expenses' => json_encode($expenses)]);
            return $this->respondUpdated(['message' => 'Budget updated successfully.']);
        }

        return $this->fail('Expense not found in this budget.');
    }

    public function markBillPaid($cycleId)
    {
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $labelToPay = $this->request->getVar('label');
        $amount = $this->request->getVar('amount');

        if ($permission === 'update_by_request') {
            $payload = ['label' => $labelToPay, 'amount' => $amount];
            $description = "Pay bill: '{$labelToPay}' for $" . number_format($amount, 2);
            return $this->handlePartnerAction('mark_bill_paid', $description, $cycleId, $payload);
        }

        $userId = $this->getEffectiveUserId();
        $budgetCycleModel = new BudgetCycleModel();

        $budgetCycle = $budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $labelToPay = $this->request->getVar('label');
        $expenses = json_decode($budgetCycle['initial_expenses'], true);
        $paidExpense = null;
        $updated = false;

        foreach ($expenses as &$expense) {
            if ($expense['label'] === $labelToPay && $expense['type'] === 'recurring') {
                if ($expense['is_paid'] === true) {
                    return $this->fail('This bill has already been marked as paid.');
                }
                $expense['is_paid'] = true;
                $updated = true;
                $paidExpense = $expense;
                break;
            }
        }

        if ($updated) {
            $db = \Config\Database::connect();
            $db->transStart();
            try {
                // Check if this is a transfer to a user account
                if (isset($paidExpense['transfer_to_account_id']) && !empty($paidExpense['transfer_to_account_id'])) {
                    $accountId = $paidExpense['transfer_to_account_id'];
                    $amount = (float) $paidExpense['estimated_amount'];

                    $accountModel = new UserAccountModel();
                    $account = $accountModel->where('id', $accountId)->where('user_id', $userId)->first();
                    if ($account) {
                        $newBalance = (float) $account['current_balance'] + $amount;
                        $accountModel->update($accountId, ['current_balance' => $newBalance]);
                    }

                    $transactionModel = new TransactionModel();
                    $transactionModel->logTransaction($userId, $cycleId, 'savings', $paidExpense['category'], $amount, $paidExpense['label']);

                } else {
                    // Original logic for a normal expense
                    $transactionModel = new TransactionModel();
                    $transactionModel->logTransaction($userId, $cycleId, 'expense', $paidExpense['category'], (float) $paidExpense['estimated_amount'], $paidExpense['label']);
                }

                $budgetCycleModel->update($cycleId, ['initial_expenses' => json_encode($expenses)]);

                $db->transComplete();
                if ($db->transStatus() === false) {
                    throw new \Exception('Database transaction failed.');
                }

                return $this->respondUpdated(['message' => 'Bill marked as paid and transaction logged.']);

            } catch (\Exception $e) {
                $db->transRollback();
                log_message('error', '[ERROR_MARK_PAID] {exception}', ['exception' => $e]);
                return $this->failServerError('Could not mark bill as paid.');
            }
        }

        return $this->fail('Bill not found in this budget.');
    }

    public function addIncomeToCycle($cycleId)
    {
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $newIncome = [
            'label' => $this->request->getVar('label'),
            'amount' => $this->request->getVar('amount'),
            'frequency' => $this->request->getVar('frequency') ?: 'one-time'
        ];

        if ($permission === 'update_by_request') {
            $payload = $newIncome;
            $description = "Add income: '{$newIncome['label']}' for $" . number_format($newIncome['amount'], 2);
            return $this->handlePartnerAction('add_income', $description, $cycleId, $payload);
        }

        $userId = $this->getEffectiveUserId();
        $budgetCycleModel = new BudgetCycleModel();

        $budgetCycle = $budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $rules = [
            'label' => 'required|string',
            'amount' => 'required|decimal',
            'frequency' => 'permit_empty|string',
            'save_recurring' => 'permit_empty|in_list[1,0,true,false]'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $newIncome = [
            'label' => $this->request->getVar('label'),
            'amount' => $this->request->getVar('amount'),
            'frequency' => $this->request->getVar('frequency') ?: 'one-time'
        ];

        if ($this->request->getVar('save_recurring') && $newIncome['frequency'] !== 'one-time') {
            $incomeSourceModel = new IncomeSourceModel();

            // FIX: Only save the categorical data for the new recurring source.
            $dataToSave = [
                'user_id' => $userId,
                'label' => $newIncome['label'],
                'frequency' => $newIncome['frequency']
            ];

            // Check if it already exists before saving
            $exists = $incomeSourceModel->where('user_id', $userId)
                ->where('label', $dataToSave['label'])
                ->first();
            if (!$exists) {
                $incomeSourceModel->save($dataToSave);
            }
        }

        $incomeArray = json_decode($budgetCycle['initial_income'], true);
        $incomeArray[] = $newIncome;
        $budgetCycleModel->update($cycleId, ['initial_income' => json_encode($incomeArray)]);

        // FIX: Use the centralized transaction model method
        $transactionModel = new TransactionModel();
        $transactionModel->logTransaction(
            $userId,
            $cycleId,
            'income',
            'Additional Income',
            (float) $newIncome['amount'],
            $newIncome['label']
        );

        return $this->respondUpdated(['message' => 'Income added and transaction logged.']);
    }

    /**
     * Adds a new recurring expense to a budget cycle, optionally saving it as recurring.
     *
     * Validates input, adds the expense to the initial_expenses JSON field, and optionally saves to
     * RecurringExpenseModel. Note: Shares fetch-decode-update pattern with other expense-related methods.
     * A helper method for JSON manipulation could reduce duplication.
     *
     * @param int $cycleId The ID of the budget cycle.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if added, a 404 if the cycle is not found,
     * or a validation error for invalid input.
     */
    public function addExpenseToCycle($cycleId)
    {
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $newExpense = [
            'label' => $this->request->getVar('label'),
            'estimated_amount' => $this->request->getVar('estimated_amount'),
            'due_date' => $this->request->getVar('due_date'),
            'category' => $this->request->getVar('category') ?? 'other',
            'type' => 'recurring',
            'is_paid' => false
        ];

        if ($permission === 'update_by_request') {
            $payload = $newExpense;
            $description = "Add bill: '{$newExpense['label']}' for $" . number_format($newExpense['estimated_amount'], 2);
            return $this->handlePartnerAction('add_expense', $description, $cycleId, $payload);
        }

        $userId = $this->getEffectiveUserId();
        $budgetCycleModel = new BudgetCycleModel();
        $recurringExpenseModel = new RecurringExpenseModel();

        $budgetCycle = $budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $rules = [
            'label' => 'required|string',
            'estimated_amount' => 'required|decimal',
            'due_date' => 'permit_empty|integer',
            'category' => 'permit_empty|string',
            'save_recurring' => 'permit_empty|in_list[1,0,true,false]'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $newExpense = [
            'label' => $this->request->getVar('label'),
            'estimated_amount' => $this->request->getVar('estimated_amount'),
            'due_date' => $this->request->getVar('due_date'),
            'category' => $this->request->getVar('category') ?? 'other',
            'type' => 'recurring',
            'is_paid' => false
        ];

        if ($this->request->getVar('save_recurring')) {
            $dataToSave = [
                'user_id' => $userId,
                'label' => $newExpense['label'],
                'due_date' => $newExpense['due_date'],
                'category' => $newExpense['category']
            ];

            $exists = $recurringExpenseModel->where('user_id', $userId)->where('label', $dataToSave['label'])->first();
            if (!$exists) {
                $recurringExpenseModel->save($dataToSave);
                $newExpense['id'] = $recurringExpenseModel->getInsertID();
            } else {
                $newExpense['id'] = $exists['id'];
            }
        }

        $expenseArray = json_decode($budgetCycle['initial_expenses'], true);
        $expenseArray[] = $newExpense;
        $budgetCycleModel->update($cycleId, ['initial_expenses' => json_encode($expenseArray)]);

        return $this->respondUpdated(['message' => 'Recurring expense added successfully.']);
    }

    /**
     * Removes an expense from a budget cycle.
     *
     * Verifies the budget cycle exists, removes the specified expense from the initial_expenses JSON field.
     * Note: Shares fetch-decode-update pattern with other expense-related methods. A helper method for JSON
     * manipulation could reduce duplication.
     *
     * @param int $cycleId The ID of the budget cycle.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if removed, a 404 if the cycle is not found,
     * or a validation error if the label is missing.
     */
    public function removeExpenseFromCycle($cycleId)
    {
        // Check the partner's permission level first
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $labelToRemove = $this->request->getVar('label');
        if (empty($labelToRemove)) {
            return $this->fail('Label is required.');
        }

        // If the user can only request changes, create a new action request
        if ($permission === 'update_by_request') {
            $payload = ['label' => $labelToRemove];
            $description = "Remove expense: '{$labelToRemove}'";
            // Use the handlePartnerAction helper to log the request
            return $this->handlePartnerAction('remove_expense', $description, $cycleId, $payload);
        }

        // --- This is the original logic for Owners or full_access Partners ---

        // Use the effective (owner's) ID for all data operations
        $userId = $this->getEffectiveUserId();
        $budgetCycleModel = new BudgetCycleModel();

        $budgetCycle = $budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $expenses = json_decode($budgetCycle['initial_expenses'], true);
        $expenses = array_filter($expenses, function ($expense) use ($labelToRemove) {
            return $expense['label'] !== $labelToRemove;
        });

        $budgetCycleModel->update($cycleId, ['initial_expenses' => json_encode(array_values($expenses))]);
        return $this->respondDeleted(['message' => 'Expense removed successfully.']);
    }

    public function adjustIncomeInCycle($budgetId)
    {
        // 1. Check permissions first
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $label = $this->request->getVar('label');
        $newAmount = (float) $this->request->getVar('new_amount');

        // 2. Handle the "update by request" case
        if ($permission === 'update_by_request') {
            $payload = ['label' => $label, 'new_amount' => $newAmount];
            $description = "Adjust income '{$label}' to $" . number_format($newAmount, 2);
            return $this->handlePartnerAction('adjust_income', $description, $budgetId, $payload);
        }

        // --- Original logic for Owners or full_access Partners ---

        // Use the effective (owner's) ID for all data operations
        $userId = $this->getEffectiveUserId();

        $rules = [
            'label' => 'required|string',
            'new_amount' => 'required|decimal'
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $budgetCycleModel = new BudgetCycleModel();
        $budgetCycle = $budgetCycleModel->where('id', $budgetId)->where('user_id', $userId)->first();

        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found or access denied.');
        }

        $incomeItems = json_decode($budgetCycle['initial_income'], true);

        $originalAmount = 0;
        $itemFound = false;
        foreach ($incomeItems as $item) {
            if ($item['label'] === $label) {
                $originalAmount = (float) $item['amount'];
                $itemFound = true;
                break;
            }
        }

        if (!$itemFound) {
            return $this->failNotFound('Original income item not found in this budget.');
        }

        $adjustmentAmount = $newAmount - $originalAmount;

        $transactionModel = new TransactionModel();
        $transactionModel->logTransaction(
            $userId,
            $budgetId,
            'income',
            'Adjustment',
            $adjustmentAmount,
            "Adjustment for '{$label}' from \${$originalAmount} to \${$newAmount}"
        );

        $updatedIncomeItems = array_map(function ($item) use ($label, $newAmount) {
            if ($item['label'] === $label) {
                $item['amount'] = $newAmount;
            }
            return $item;
        }, $incomeItems);

        $budgetCycleModel->update($budgetId, ['initial_income' => json_encode($updatedIncomeItems)]);

        return $this->respondUpdated(['message' => 'Income adjusted successfully.']);
    }

    public function removeIncomeFromCycle($budgetId)
    {
        // 1. Check permissions first
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $label = $this->request->getVar('label');
        if (empty($label)) {
            return $this->failValidationErrors('Label is required.');
        }

        // 2. Handle the "update by request" case
        if ($permission === 'update_by_request') {
            $payload = ['label' => $label];
            $description = "Remove income source: '{$label}'";
            return $this->handlePartnerAction('remove_income', $description, $budgetId, $payload);
        }

        // --- Original logic for Owners or full_access Partners ---

        // Use the effective (owner's) ID for all data operations
        $userId = $this->getEffectiveUserId();

        $budgetCycleModel = new BudgetCycleModel();
        $budgetCycle = $budgetCycleModel->where('id', $budgetId)->where('user_id', $userId)->first();

        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found or access denied.');
        }

        $incomeItems = json_decode($budgetCycle['initial_income'], true);
        $itemToRemove = null;

        foreach ($incomeItems as $item) {
            if ($item['label'] === $label) {
                $itemToRemove = $item;
                break;
            }
        }

        if (!$itemToRemove) {
            return $this->failNotFound('Income item not found.');
        }

        $transactionModel = new TransactionModel();
        $transactionModel->logTransaction(
            $userId,
            $budgetId,
            'income',
            'Removal',
            -(float) $itemToRemove['amount'],
            "Removal of income source '{$label}'"
        );

        $updatedIncomeItems = array_filter($incomeItems, fn($item) => $item['label'] !== $label);
        $budgetCycleModel->update($budgetId, ['initial_income' => json_encode(array_values($updatedIncomeItems))]);

        return $this->respondDeleted(['message' => 'Income removed successfully.']);
    }

    /**
     * Initializes the user’s savings profile with zip code and optional initial balance.
     *
     * Updates the user’s demographic zip code, creates or updates a financial tools record, and logs an initial
     * savings balance as a transaction if provided. No redundancy with other methods due to its unique setup logic.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if initialized, a validation error for invalid input,
     * or a 500 error on failure.
     */
    public function initializeSavings()
    {
        // 1. Add owner-only permission check
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('This action can only be performed by the budget owner.');
        }

        // 2. Use the effective (owner's) ID for all data operations
        $userId = $this->getEffectiveUserId();

        $rules = [
            'hasSavings' => 'required|in_list[1,0,true,false]',
            'zipCode' => 'required|string|max_length[10]',
            'initialBalance' => 'permit_empty|decimal'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $userModel = new UserModel();
        $toolsModel = new UserFinancialToolsModel();
        $transactionModel = new TransactionModel();
        $budgetCycleModel = new BudgetCycleModel();

        // 3. --- The rest of the original logic is correct, as it now uses the owner's ID ---
        $userModel->update($userId, ['demographic_zip_code' => $this->request->getVar('zipCode')]);

        $toolsRecord = $toolsModel->where('user_id', $userId)->first();
        if (!$toolsRecord) {
            $toolsModel->insert(['user_id' => $userId]);
            $toolsRecord = $toolsModel->where('user_id', $userId)->first();
        }

        $hasSavings = filter_var($this->request->getVar('hasSavings'), FILTER_VALIDATE_BOOLEAN);
        $initialBalance = (float) $this->request->getVar('initialBalance') ?: 0;
        $toolsData = ['has_savings_account' => $hasSavings];

        if ($hasSavings && $initialBalance > 0) {
            $toolsData['current_savings_balance'] = $initialBalance;
            $activeBudget = $budgetCycleModel->where('user_id', $userId)->where('status', 'active')->first();

            if ($activeBudget) {
                $transactionModel->logTransaction(
                    $userId,
                    $activeBudget['id'],
                    'savings',
                    'Savings',
                    $initialBalance,
                    'Initial savings balance'
                );
            }
        }

        $toolsModel->update($toolsRecord['id'], $toolsData);

        return $this->respondUpdated(['message' => 'Savings profile initialized successfully.']);
    }

    /**
     * Provides budget wizard suggestions based on user history.
     *
     * For new users, returns default dates and empty suggestions. For returning users, proposes budget dates based
     * on income frequency and fetches active income sources, expenses, and learned categories. No redundancy with other
     * methods due to its unique suggestion logic.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a JSON response with proposed dates and suggested budget data.
     */
    public function getWizardSuggestions()
    {
        $userId = $this->getEffectiveUserId();
        $incomeModel = new IncomeSourceModel();
        $expenseModel = new RecurringExpenseModel();
        $spendingCategoryModel = new LearnedSpendingCategoryModel();

        $suggestedIncome = $incomeModel->where('user_id', $userId)->where('is_active', 1)->findAll();
        $suggestedExpenses = $expenseModel->where('user_id', $userId)->where('is_active', 1)->findAll();
        $learnedCategories = $spendingCategoryModel->where('user_id', $userId)->findAll();

        $isReturningUserWithRules = false;
        if (!empty($suggestedIncome)) {
            $isReturningUserWithRules = array_reduce($suggestedIncome, function ($carry, $item) {
                return $carry || !(
                    (($item['frequency'] === 'weekly' || $item['frequency'] === 'bi-weekly') && !$item['frequency_day']) ||
                    (($item['frequency'] === 'monthly' || $item['frequency'] === 'semi-monthly') && !$item['frequency_date_1'])
                );
            }, false);
        }

        $today = new DateTime();
        $proposedStartDate = $today->format('Y-m-d');
        $proposedEndDate = (clone $today)->modify('+1 month -1 day')->format('Y-m-d');

        $data = [
            'isExpress' => $isReturningUserWithRules,
            'proposedStartDate' => $proposedStartDate,
            'proposedEndDate' => $proposedEndDate,
            'suggestedIncome' => $suggestedIncome,
            'suggestedExpenses' => $suggestedExpenses,
            'learned_spending_categories' => $learnedCategories
        ];

        if ($isReturningUserWithRules) {
            $projectionService = new \App\Services\ProjectionService();
            $data['projectedIncome'] = $projectionService->projectIncome($proposedStartDate, $proposedEndDate, $suggestedIncome);
            $data['projectedExpenses'] = $projectionService->projectExpenses($proposedStartDate, $proposedEndDate, $suggestedExpenses);
        }

        return $this->respond($data);
    }

    /**
     * Retrieves transaction history for a specific expense label.
     *
     * Fetches all expense transactions matching the provided label for the authenticated user.
     * No redundancy with other methods due to its specific history retrieval logic.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a JSON response with the transaction history or a validation error if the label is missing.
     */
    public function getExpenseHistory()
    {
        $userId = $this->getEffectiveUserId();

        // Get the expense label from the query string (e.g., /api/budget/expense-history?label=OGE)
        $label = $this->request->getGet('label');

        if (!$label) {
            return $this->failValidationErrors('The "label" query parameter is required.');
        }

        $transactionModel = new TransactionModel();

        // Find all past expense transactions where the description matches the bill's label.
        // The 'markBillPaid' function saves the label to the description field.
        $history = $transactionModel->where('user_id', $userId)
            ->where('type', 'expense')
            ->where('description', $label)
            ->orderBy('transacted_at', 'ASC')
            ->findAll();

        return $this->respond($history);
    }

    /**
     * Updates financial details of a recurring expense and syncs with the active budget cycle.
     *
     * Updates fields like principal_balance, interest_rate, etc., in RecurringExpenseModel and the active budget cycle’s
     * initial_expenses JSON field. Note: Shares fetch-decode-update pattern with other expense-related methods.
     * A helper method for JSON manipulation could reduce duplication.
     *
     * @param int $expenseId The ID of the recurring expense.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if updated, a 404 if the expense is not found,
     * a validation error for invalid input, or a 500 error on failure.
     */
    public function updateExpenseDetails($expenseId)
    {
        // 1. Check permissions first
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        // 2. Use the effective (owner's) ID for all data operations
        $userId = $this->getEffectiveUserId();
        $recurringExpenseModel = new RecurringExpenseModel();
        $budgetCycleModel = new BudgetCycleModel();

        // 3. Ensure the expense belongs to the user (owner)
        $expense = $recurringExpenseModel->where('id', '=>', $expenseId)->where('user_id', $userId)->first();
        if (!$expense) {
            return $this->failNotFound('Expense not found.');
        }

        // 4. Sanitize the incoming JSON data
        $json = $this->request->getJSON(true);
        $allowedData = [];
        $fields = ['principal_balance', 'interest_rate', 'outstanding_balance', 'maturity_date'];
        foreach ($fields as $field) {
            if (isset($json[$field])) {
                $allowedData[$field] = $json[$field] === '' ? null : $json[$field];
            }
        }

        if (empty($allowedData)) {
            return $this->failValidationErrors('No valid fields to update.');
        }

        // 5. Handle the "update by request" case
        if ($permission === 'update_by_request') {
            // A request must be associated with a budget cycle
            $activeCycle = $budgetCycleModel->where('user_id', $userId)->where('status', 'active')->first();
            if (!$activeCycle) {
                return $this->fail('An active budget cycle is required to request this change.');
            }

            $payload = ['expenseId' => $expenseId, 'updates' => $allowedData];
            $description = "Update details for expense: '{$expense['label']}'";
            return $this->handlePartnerAction('update_expense_details', $description, $activeCycle['id'], $payload);
        }

        // --- 6. Original logic for Owners or full_access Partners ---
        try {
            // Update the permanent recurring_expenses table
            if ($recurringExpenseModel->update($expenseId, $allowedData) === false) {
                return $this->fail($recurringExpenseModel->errors());
            }

            // Find the active budget cycle to update its JSON data
            $activeCycle = $budgetCycleModel->where('user_id', $userId)->where('status', 'active')->first();
            if ($activeCycle) {
                $initialExpenses = json_decode($activeCycle['initial_expenses'], true);

                // Find and update the matching expense within the JSON
                foreach ($initialExpenses as &$exp) {
                    if (isset($exp['id']) && $exp['id'] == $expenseId) {
                        $exp = array_merge($exp, $allowedData);
                        break;
                    }
                }

                $budgetCycleModel->update($activeCycle['id'], ['initial_expenses' => json_encode($initialExpenses)]);
            }

            return $this->respondUpdated(['message' => 'Expense details updated successfully.']);
        } catch (\Exception $e) {
            log_message('error', '[ERROR] {exception}', ['exception' => $e]);
            return $this->failServerError('Could not update expense details.');
        }
    }


    public function updateInitialIncomeAmount($budgetId)
    {
        // 1. Check permissions first
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $idToUpdate = $this->request->getVar('id');
        $newAmount = $this->request->getVar('amount');
        if (!is_numeric($newAmount)) {
            return $this->failValidationErrors('Amount must be a number.');
        }

        // 2. Use the effective (owner's) ID for all data operations
        $userId = $this->getEffectiveUserId();
        $budgetModel = new BudgetCycleModel();
        $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $incomeItems = json_decode($budget['initial_income'], true);
        $itemFound = false;
        $itemLabel = '';

        // Find the item to get its label for the description
        foreach ($incomeItems as $item) {
            if ($item['id'] == $idToUpdate) {
                $itemFound = true;
                $itemLabel = $item['label'];
                break;
            }
        }

        if (!$itemFound) {
            return $this->fail('Income item not found in this budget.');
        }

        // 3. Handle the "update by request" case
        if ($permission === 'update_by_request') {
            $payload = ['id' => $idToUpdate, 'amount' => $newAmount];
            $description = "Update income '{$itemLabel}' to $" . number_format($newAmount, 2);
            return $this->handlePartnerAction('update_initial_income', $description, $budgetId, $payload);
        }

        // --- 4. Original logic for Owners or full_access Partners ---
        $updated = false;
        foreach ($incomeItems as &$item) {
            if ($item['id'] == $idToUpdate) {
                $item['amount'] = $newAmount;
                $updated = true;
                break;
            }
        }

        if ($updated) {
            $budgetModel->update($budgetId, ['initial_income' => json_encode($incomeItems)]);
            return $this->respondUpdated(['message' => 'Income amount updated.']);
        }

        // This part should technically not be reachable if item was found before, but it's good for safety.
        return $this->fail('Income item not found in this budget.');
    }


    public function addVariableExpense($budgetId)
    {
        // 1. Check permissions first
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $label = $this->request->getVar('label');
        $amount = $this->request->getVar('amount');
        if (!$label || !is_numeric($amount)) {
            return $this->failValidationErrors('Label and amount are required.');
        }

        // 2. Handle the "update by request" case
        if ($permission === 'update_by_request') {
            $payload = ['label' => $label, 'amount' => $amount];
            $description = "Add variable expense '{$label}' for $" . number_format($amount, 2);
            return $this->handlePartnerAction('add_variable_expense', $description, $budgetId, $payload);
        }

        // --- 3. Original logic for Owners or full_access Partners ---

        // Use the effective (owner's) ID for all data operations
        $userId = $this->getEffectiveUserId();
        $budgetModel = new BudgetCycleModel();

        $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) {
            return $this->failNotFound('Budget cycle not found.');
        }

        // Step 1: Create or find the reusable category in 'learned_spending_categories'
        $spendingCategoryModel = new LearnedSpendingCategoryModel();
        $category = $spendingCategoryModel->where('user_id', $userId)
            ->where('name', $label)
            ->first();
        if (!$category) {
            $spendingCategoryModel->insert([
                'user_id' => $userId,
                'name' => $label,
            ]);
        }

        // Step 2: Add this item to the current budget's 'initial_expenses' JSON
        $expenseItems = json_decode($budget['initial_expenses'], true);
        $newExpense = [
            'label' => $label,
            'estimated_amount' => $amount,
            'type' => 'variable'
        ];
        $expenseItems[] = $newExpense;
        $budgetModel->update($budgetId, ['initial_expenses' => json_encode($expenseItems)]);

        return $this->respondCreated(['message' => 'Variable spending item added successfully.']);
    }


    public function transferToAccount($budgetId)
    {
        // 1. Check permissions first
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        // 2. Validate input
        $rules = [
            'account_id' => 'required|integer',
            'amount' => 'required|decimal|greater_than[0]'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $accountId = $this->request->getVar('account_id');
        $amount = (float) $this->request->getVar('amount');

        // 3. Use the effective (owner's) ID and find the account
        $userId = $this->getEffectiveUserId();
        $accountModel = new UserAccountModel();
        $account = $accountModel->where('id', $accountId)->where('user_id', $userId)->first();
        if (!$account) {
            return $this->failNotFound('Account not found.');
        }

        // 4. Handle the "update by request" case
        if ($permission === 'update_by_request') {
            $payload = ['account_id' => $accountId, 'amount' => $amount];
            $description = "Transfer $" . number_format($amount, 2) . " to " . $account['account_name'];
            return $this->handlePartnerAction('transfer_to_account', $description, $budgetId, $payload);
        }

        // --- 5. Original logic for Owners or full_access Partners ---

        // Add funds to the account
        $newBalance = (float) $account['current_balance'] + $amount;
        $accountModel->update($accountId, ['current_balance' => $newBalance]);

        // Log the transaction
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
        // 1. Check permissions first
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        // 2. Validate input
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

        // 3. Use the effective (owner's) ID and find the account
        $userId = $this->getEffectiveUserId();
        $accountModel = new UserAccountModel();
        $account = $accountModel->where('id', $accountId)->where('user_id', $userId)->first();
        if (!$account) {
            return $this->failNotFound('Account not found.');
        }

        if ($amount > (float) $account['current_balance']) {
            return $this->failValidationErrors('Transfer amount cannot exceed the account balance.');
        }

        // 4. Handle the "update by request" case
        if ($permission === 'update_by_request') {
            $payload = [
                'account_id' => $accountId,
                'amount' => $amount,
                'transfer_type' => $transferType
            ];
            $description = "Transfer $" . number_format($amount, 2) . " from " . $account['account_name'];
            return $this->handlePartnerAction('transfer_from_account', $description, $budgetId, $payload);
        }

        // --- 5. Original logic for Owners or full_access Partners ---

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

            // Add a new "Planned Income" item to the budget's data.
            $budgetCycleModel = new BudgetCycleModel();
            // Securely find the budget cycle, ensuring it belongs to the user.
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

    public function closeCycle($id)
    {
        // 1. Add owner-only permission check
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('This action can only be performed by the budget owner.');
        }

        // 2. Use the effective (owner's) ID for all data operations
        $userId = $this->getEffectiveUserId();
        $budgetCycleModel = new BudgetCycleModel();
        $transactionModel = new TransactionModel();

        // 3. --- The rest of the original logic is correct, as it now uses the owner's ID ---
        $budget = $budgetCycleModel->where('id', $id)
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->first();

        if (!$budget) {
            return $this->failNotFound('Active budget cycle not found or access denied.');
        }

        $transactions = $transactionModel->where('budget_cycle_id', $id)->findAll();
        $initialExpenses = json_decode($budget['initial_expenses'], true);
        $initialIncome = json_decode($budget['initial_income'], true);

        $actualIncome = 0;
        $actualExpenses = 0;
        $expenseBreakdown = [];

        foreach ($transactions as $t) {
            if ($t['type'] === 'income') {
                $actualIncome += (float) $t['amount'];
            }
            if ($t['type'] === 'expense' || $t['type'] === 'savings') { // Also include savings transfers as expenses in summary
                $actualExpenses += (float) $t['amount'];
                $category = $t['category_name'] ?? 'Uncategorized';
                if (!isset($expenseBreakdown[$category])) {
                    $expenseBreakdown[$category] = 0;
                }
                $expenseBreakdown[$category] += (float) $t['amount'];
            }
        }

        arsort($expenseBreakdown);
        $topSpending = array_slice($expenseBreakdown, 0, 5, true);
        $topSpendingCategories = [];
        foreach ($topSpending as $category => $amount) {
            $topSpendingCategories[] = ['category' => $category, 'amount' => $amount];
        }

        $plannedIncome = array_sum(array_column($initialIncome, 'amount'));
        $plannedExpenses = array_sum(array_column($initialExpenses, 'estimated_amount'));

        $finalSummary = [
            'plannedIncome' => $plannedIncome,
            'actualIncome' => $actualIncome,
            'plannedExpenses' => $plannedExpenses,
            'actualExpenses' => $actualExpenses,
            'plannedSurplus' => $plannedIncome - $plannedExpenses,
            'actualSurplus' => $actualIncome - $actualExpenses,
            'topSpendingCategories' => $topSpendingCategories,
        ];

        try {
            $budgetCycleModel->update($id, [
                'status' => 'completed',
                'final_summary' => json_encode($finalSummary)
            ]);
            return $this->respond(['message' => 'Budget closed successfully.']);
        } catch (\Exception $e) {
            log_message('error', '[ERROR_CLOSE_BUDGET] {exception}', ['exception' => $e]);
            return $this->failServerError('Could not close the budget cycle.');
        }
    }

    public function markBillUnpaid($cycleId)
    {
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $labelToUnpay = $this->request->getVar('label');

        if ($permission === 'update_by_request') {
            $payload = ['label' => $labelToUnpay];
            $description = "Mark bill as unpaid: '{$labelToUnpay}'.";
            return $this->handlePartnerAction('mark_bill_unpaid', $description, $cycleId, $payload);
        }

        $userId = $this->getEffectiveUserId();
        $budgetCycleModel = new BudgetCycleModel();

        $budgetCycle = $budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $labelToUnpay = $this->request->getVar('label');
        $expenses = json_decode($budgetCycle['initial_expenses'], true);
        $unpaidExpense = null;
        $updated = false;

        // 1. Find the expense in the budget's JSON and mark it as unpaid
        foreach ($expenses as &$expense) {
            if ($expense['label'] === $labelToUnpay && $expense['type'] === 'recurring') {
                if ($expense['is_paid'] === false) {
                    return $this->fail('This bill is not marked as paid.');
                }
                $expense['is_paid'] = false;
                $updated = true;
                $unpaidExpense = $expense;
                break;
            }
        }

        if ($updated) {
            $db = \Config\Database::connect();
            $db->transStart();

            try {
                // 2. Find and delete the corresponding transaction
                $transactionModel = new TransactionModel();
                // The `markBillPaid` function logs the expense label as the description.
                // This is how we find the exact transaction to delete.
                $transactionToDelete = $transactionModel->where('budget_cycle_id', $cycleId)
                    ->where('user_id', $userId)
                    ->where('type', 'expense')
                    ->where('description', $labelToUnpay)
                    ->first();

                if ($transactionToDelete) {
                    $transactionModel->delete($transactionToDelete['id']);
                }

                // 3. Save the updated expenses list to the budget cycle
                $budgetCycleModel->update($cycleId, ['initial_expenses' => json_encode($expenses)]);

                $db->transComplete();

                if ($db->transStatus() === false) {
                    throw new \Exception('Database transaction failed.');
                }

                return $this->respondUpdated(['message' => 'Bill marked as unpaid and transaction removed.']);

            } catch (\Exception $e) {
                log_message('error', '[ERROR_MARK_UNPAID] {exception}', ['exception' => $e]);
                return $this->failServerError('Could not update bill status.');
            }
        }

        return $this->fail('Bill not found in this budget.');
    }

    public function updateIncomeInCycle($budgetId)
    {
        // 1. Check permissions first
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        // 2. Validate input
        $rules = [
            'original_label' => 'required|string',
            'label' => 'required|string',
            'amount' => 'required|decimal'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $originalLabel = $this->request->getVar('original_label');
        $newLabel = $this->request->getVar('label');
        $newAmount = (float) $this->request->getVar('amount');

        // 3. Handle the "update by request" case
        if ($permission === 'update_by_request') {
            $payload = [
                'original_label' => $originalLabel,
                'label' => $newLabel,
                'amount' => $newAmount
            ];
            $description = "Update income '{$originalLabel}' to '{$newLabel}' for $" . number_format($newAmount, 2);
            return $this->handlePartnerAction('update_income_in_cycle', $description, $budgetId, $payload);
        }

        // --- 4. Original logic for Owners or full_access Partners ---

        // Use the effective (owner's) ID for all data operations
        $userId = $this->getEffectiveUserId();
        $budgetCycleModel = new BudgetCycleModel();

        $budgetCycle = $budgetCycleModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $incomeItems = json_decode($budgetCycle['initial_income'], true);
        $itemFound = false;
        $originalAmount = 0;

        // Find the original item and update it
        foreach ($incomeItems as &$item) {
            if ($item['label'] === $originalLabel) {
                $itemFound = true;
                $originalAmount = (float) $item['amount'];
                $item['label'] = $newLabel;
                $item['amount'] = $newAmount;
                break;
            }
        }

        if (!$itemFound) {
            return $this->failNotFound('Income item not found in this budget.');
        }

        // Log a transaction for the difference
        $adjustmentAmount = $newAmount - $originalAmount;
        if ($adjustmentAmount !== 0.0) {
            $transactionModel = new TransactionModel();
            $transactionModel->logTransaction(
                $userId,
                $budgetId,
                'income',
                'Adjustment',
                $adjustmentAmount,
                "Adjustment for '{$originalLabel}'"
            );
        }

        // Save the updated income array
        $budgetCycleModel->update($budgetId, ['initial_income' => json_encode($incomeItems)]);
        return $this->respondUpdated(['message' => 'Income item updated successfully.']);
    }

    public function updateBudgetDates($budgetId)
    {
        // 1. Check permissions first
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        // 2. Validate the incoming dates
        $rules = [
            'start_date' => 'required|valid_date[Y-m-d]',
            'end_date' => 'required|valid_date[Y-m-d]',
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $data = [
            'start_date' => $this->request->getVar('start_date'),
            'end_date' => $this->request->getVar('end_date'),
        ];

        // 3. Handle the "update by request" case
        if ($permission === 'update_by_request') {
            $payload = $data;
            $description = "Change budget dates to {$data['start_date']} through {$data['end_date']}";
            return $this->handlePartnerAction('update_budget_dates', $description, $budgetId, $payload);
        }

        // --- 4. Original logic for Owners or full_access Partners ---

        // Use the effective (owner's) ID for all data operations
        $userId = $this->getEffectiveUserId();
        $budgetModel = new BudgetCycleModel();

        // Find the budget and verify ownership
        $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) {
            return $this->failNotFound('Budget cycle not found or access denied.');
        }

        // Update the database
        try {
            if ($budgetModel->update($budgetId, $data)) {
                return $this->respondUpdated(['message' => 'Budget dates updated successfully.']);
            }
            return $this->fail($budgetModel->errors());
        } catch (\Exception $e) {
            log_message('error', '[ERROR_UPDATE_DATES] {exception}', ['exception' => $e]);
            return $this->failServerError('Could not update budget dates.');
        }
    }

    public function projectIncome()
    {
        $json = $this->request->getJSON(true);
        $rules = $json['income_rules'] ?? [];
        $startDate = $json['start_date'] ?? '';
        $endDate = $json['end_date'] ?? '';

        if (empty($startDate) || empty($endDate) || empty($rules)) {
            return $this->failValidationErrors('Start date, end date, and income rules are required.');
        }

        $projectionService = new ProjectionService();
        $projectedIncome = $projectionService->projectIncome($startDate, $endDate, $rules);

        return $this->respond($projectedIncome);
    }

    public function markIncomeReceived($budgetId)
    {
        // 1. Check permissions first
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        // 2. Validate input
        $rules = [
            'label' => 'required|string',
            'amount' => 'required|decimal',
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $label = $this->request->getVar('label');
        $actualAmount = (float) $this->request->getVar('amount');

        // 3. Handle the "update by request" case
        if ($permission === 'update_by_request') {
            $payload = ['label' => $label, 'amount' => $actualAmount];
            $description = "Mark income '{$label}' as received for $" . number_format($actualAmount, 2);
            return $this->handlePartnerAction('mark_income_received', $description, $budgetId, $payload);
        }

        // --- 4. Original logic for Owners or full_access Partners ---

        // Use the effective (owner's) ID for all data operations
        $userId = $this->getEffectiveUserId();
        $budgetCycleModel = new BudgetCycleModel();

        $budget = $budgetCycleModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $incomeItems = json_decode($budget['initial_income'], true);
        $itemFound = false;

        // Mark the income item as "received" in the budget's JSON data
        foreach ($incomeItems as &$item) {
            if ($item['label'] === $label) {
                $item['is_received'] = true; // Add a new flag
                $itemFound = true;
                break;
            }
        }

        if (!$itemFound) {
            return $this->failNotFound('The planned income item was not found in this budget.');
        }

        $db = \Config\Database::connect();
        $db->transStart();
        try {
            // Log the actual income transaction
            $transactionModel = new TransactionModel();
            $transactionModel->logTransaction(
                $userId,
                $budgetId,
                'income',
                'Received Income',
                $actualAmount,
                $label
            );

            // Save the updated list of planned income
            $budgetCycleModel->update($budgetId, ['initial_income' => json_encode($incomeItems)]);

            $db->transComplete();
            if ($db->transStatus() === false) {
                throw new \Exception('Database transaction failed.');
            }

            return $this->respondUpdated(['message' => 'Income marked as received.']);

        } catch (\Exception $e) {
            log_message('error', '[ERROR_MARK_INCOME_RECEIVED] ' . $e->getMessage());
            return $this->failServerError('Could not process income.');
        }
    }

    public function createSpendingCategory()
    {
        // 1. Check permissions first
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $data = $this->request->getJSON(true);
        $model = new LearnedSpendingCategoryModel();

        // 2. Use the effective (owner's) ID for all data operations
        $userId = $this->getEffectiveUserId();
        $data['user_id'] = $userId;

        // 3. Proceed with the original logic
        $exists = $model->where('user_id', $userId)->where('name', $data['name'])->first();
        if ($exists) {
            return $this->respond(['status' => 'success', 'message' => 'Category already exists.', 'id' => $exists['id']]);
        }

        if ($model->save($data)) {
            return $this->respondCreated(['status' => 'success', 'id' => $model->getInsertID()]);
        }

        return $this->fail($model->errors());
    }

    public function updateRecurringExpenseInCycle($budgetId)
    {
        // 1. Check permissions first
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        // 2. Validate input for all users
        $rules = [
            'label' => 'required|string', // Used to identify the item
            'estimated_amount' => 'required|decimal',
            'due_date' => 'permit_empty|integer|max_length[2]',
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        // 3. Get request variables once
        $labelToUpdate = $this->request->getVar('label');
        $newAmount = $this->request->getVar('estimated_amount');
        $newDueDate = $this->request->getVar('due_date');

        // 4. Handle the "update by request" case
        if ($permission === 'update_by_request') {
            $payload = [
                'label' => $labelToUpdate,
                'estimated_amount' => $newAmount,
                'due_date' => $newDueDate
            ];
            $description = "Update '{$labelToUpdate}': set amount to $" . number_format((float) $newAmount, 2);
            return $this->handlePartnerAction('update_recurring_expense', $description, $budgetId, $payload);
        }

        // --- 5. Original logic for Owners or full_access Partners ---
        $userId = $this->getEffectiveUserId();
        $budgetModel = new BudgetCycleModel();

        $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $expenses = json_decode($budget['initial_expenses'], true);
        $itemFound = false;

        foreach ($expenses as &$exp) {
            // Find the recurring expense by its unique label within this budget
            if (isset($exp['type']) && $exp['type'] === 'recurring' && $exp['label'] === $labelToUpdate) {
                $exp['estimated_amount'] = $newAmount;
                $exp['due_date'] = $newDueDate;
                $itemFound = true;
                break;
            }
        }

        if (!$itemFound) {
            return $this->failNotFound('Recurring expense not found in this budget.');
        }

        $budgetModel->update($budgetId, ['initial_expenses' => json_encode($expenses)]);

        return $this->respondUpdated(['message' => 'Budget expense updated successfully.']);
    }

}