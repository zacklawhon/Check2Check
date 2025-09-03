<?php
namespace App\Services;

use App\Models\BudgetCycleModel;
use App\Models\TransactionModel;
use App\Models\IncomeSourceModel;
use App\Models\RecurringExpenseModel;
use App\Models\LearnedSpendingCategoryModel;
use App\Services\ProjectionService;
use DateTime;
use Exception;

class BudgetService
{

    /**
     * Fetches the complete, processed state for a budget cycle.
     *
     * @param int $userId
     * @param int $cycleId
     * @return array
     */
    public function getCompleteBudgetState(int $userId, int $cycleId): array
    {
        $budgetCycleModel = new BudgetCycleModel();
        $budget = $budgetCycleModel->where('id', $cycleId)
            ->where('user_id', $userId)
            ->first();

        if (!$budget) {
            // Return empty state if not found, letting the calling function handle the error.
            return ['budget' => null, 'transactions' => []];
        }

        // Decode all JSON fields into arrays
        $budget['initial_income'] = json_decode($budget['initial_income'] ?? '[]', true);
        $budget['initial_expenses'] = json_decode($budget['initial_expenses'] ?? '[]', true);
        $budget['final_summary'] = json_decode($budget['final_summary'] ?? '[]', true);

        // Fetch all related transactions
        $transactionModel = new TransactionModel();
        $transactions = $transactionModel->where('budget_cycle_id', $cycleId)
            ->where('user_id', $userId)
            ->findAll();

        return [
            'budget' => $budget,
            'transactions' => $transactions
        ];
    }


    /**
     * Marks a bill as paid within a budget cycle, updates the budget's JSON data,
     * and logs the corresponding transaction.
     *
     * @param int    $userId The owner's user ID.
     * @param int    $cycleId The ID of the budget cycle.
     * @param string $labelToPay The label of the bill to mark as paid.
     * @param float  $amount The actual amount that was paid.
     * @return bool
     * @throws Exception
     */
    public function markBillPaid(int $userId, int $cycleId, string $labelToPay, float $amount): array
    {
        $budgetCycleModel = new BudgetCycleModel();
        $budgetCycle = $budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first();

        if (!$budgetCycle) {
            throw new Exception('Budget cycle not found.');
        }

        $expenses = json_decode($budgetCycle['initial_expenses'], true);
        $paidExpense = null;
        $updated = false;

        foreach ($expenses as &$expense) {
            if ($expense['label'] === $labelToPay && $expense['type'] === 'recurring') {
                if ($expense['is_paid'] === true) {
                    throw new Exception('This bill has already been marked as paid.');
                }
                $expense['is_paid'] = true;
                $updated = true;
                $paidExpense = $expense;
                break;
            }
        }

        if (!$updated) {
            throw new Exception('Bill not found in this budget.');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        try {
            $transactionModel = new TransactionModel();
            $transactionModel->logTransaction($userId, $cycleId, 'expense', $paidExpense['category'], $amount, $paidExpense['label']);

            $budgetCycleModel->update($cycleId, ['initial_expenses' => json_encode($expenses)]);

            $db->transComplete();
            if ($db->transStatus() === false) {
                throw new Exception('Database transaction failed while marking bill as paid.');
            }
        } catch (Exception $e) {
            $db->transRollback();
            log_message('error', '[SERVICE_ERROR_MARK_PAID] ' . $e->getMessage());
            throw $e; // Re-throw the exception to be caught by the controller
        }

        return $this->getCompleteBudgetState($userId, $cycleId);
    }

    /**
     * Marks a bill as unpaid, updates the budget's JSON data,
     * and deletes the corresponding transaction.
     *
     * @param int    $userId The owner's user ID.
     * @param int    $cycleId The ID of the budget cycle.
     * @param string $labelToUnpay The label of the bill to mark as unpaid.
     * @return bool
     * @throws \Exception
     */
    public function markBillUnpaid(int $userId, int $cycleId, string $labelToUnpay): array
    {
        $budgetCycleModel = new BudgetCycleModel();
        $budgetCycle = $budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first();

        if (!$budgetCycle) {
            throw new \Exception('Budget cycle not found.');
        }

        $expenses = json_decode($budgetCycle['initial_expenses'], true);
        $updated = false;

        foreach ($expenses as &$expense) {
            if ($expense['label'] === $labelToUnpay && $expense['type'] === 'recurring') {
                if ($expense['is_paid'] === false) {
                    throw new \Exception('This bill is not marked as paid.');
                }
                $expense['is_paid'] = false;
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            throw new \Exception('Bill not found in this budget.');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        try {
            // Find and delete the corresponding transaction
            $transactionModel = new TransactionModel();
            $transactionToDelete = $transactionModel->where('budget_cycle_id', $cycleId)
                ->where('user_id', $userId)
                ->where('type', 'expense')
                ->where('description', $labelToUnpay)
                ->first();

            if ($transactionToDelete) {
                $transactionModel->delete($transactionToDelete['id']);
            }

            // Save the updated expenses list
            $budgetCycleModel->update($cycleId, ['initial_expenses' => json_encode($expenses)]);

            $db->transComplete();
            if ($db->transStatus() === false) {
                throw new \Exception('Database transaction failed while marking bill unpaid.');
            }
        } catch (\Exception $e) {
            $db->transRollback();
            log_message('error', '[SERVICE_ERROR_MARK_UNPAID] ' . $e->getMessage());
            throw $e;
        }

        return $this->getCompleteBudgetState($userId, $cycleId);
    }

    /**
     * Marks a planned income item as received, updates the budget's JSON data,
     * and logs the corresponding income transaction.
     *
     * @param int    $userId The owner's user ID.
     * @param int    $budgetId The ID of the budget cycle.
     * @param string $label The label of the income item.
     * @param float  $actualAmount The actual amount received.
     * @return bool
     * @throws \Exception
     */
    public function markIncomeReceived(int $userId, int $budgetId, string $label, float $actualAmount, string $date): array
    {
        $budgetCycleModel = new BudgetCycleModel();
        $budget = $budgetCycleModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) {
            throw new \Exception('Budget cycle not found.');
        }

        $incomeItems = json_decode($budget['initial_income'], true);
        $itemFound = false;

        foreach ($incomeItems as &$item) {
            if ($item['label'] === $label && $item['date'] === $date && empty($item['is_received'])) {
                $item['is_received'] = true;
                $item['amount'] = $actualAmount; // Optionally update the amount to the actual received amount
                $itemFound = true;
                break; // Stop after finding and updating the first match
            }
        }

        if (!$itemFound) {
            throw new \Exception('The planned income item was not found in this budget.');
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
                throw new \Exception('Database transaction failed while processing income.');
            }
        } catch (\Exception $e) {
            $db->transRollback();
            log_message('error', '[SERVICE_ERROR_MARK_INCOME_RECEIVED] ' . $e->getMessage());
            throw $e;
        }

        return $this->getCompleteBudgetState($userId, $budgetId);
    }

    /**
     * Fetches all transactions for a specific budget cycle.
     * Includes a security check to ensure the user owns the budget cycle.
     *
     * @param int $userId The owner's user ID.
     * @param int $cycleId The ID of the budget cycle.
     * @return array
     * @throws \Exception
     */
    public function getTransactionsForCycle(int $userId, int $cycleId): array
    {
        $budgetCycleModel = new BudgetCycleModel();
        if (!$budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first()) {
            throw new \Exception('Budget cycle not found or access denied.');
        }

        $transactionModel = new TransactionModel();
        return $transactionModel->where('budget_cycle_id', $cycleId)
            ->where('user_id', $userId)
            ->findAll();
    }

    /**
     * Fetches the transaction history for a specific recurring expense.
     *
     * @param int    $userId The owner's user ID.
     * @param string $label The label of the expense to find history for.
     * @return array
     */
    public function getExpenseHistory(int $userId, string $label): array
    {
        $transactionModel = new TransactionModel();

        return $transactionModel->where('user_id', $userId)
            ->where('type', 'expense')
            ->where('description', $label)
            ->orderBy('transacted_at', 'ASC')
            ->findAll();
    }

    /**
     * Adds a new income item to a budget cycle.
     * Optionally saves it as a recurring income source for future budgets.
     *
     * @param int   $userId          The owner's user ID.
     * @param int   $cycleId         The ID of the budget cycle.
     * @param array $incomeData      An array containing 'label', 'amount', 'frequency'.
     * @param bool  $saveAsRecurring Whether to save this as a recurring income source.
     * @return bool
     * @throws \Exception
     */
    public function addIncomeToCycle(int $userId, int $cycleId, array $incomeData, $saveAsRecurring): array
    {
        $budgetCycleModel = new BudgetCycleModel();
        $budgetCycle = $budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            throw new \Exception('Budget cycle not found.');
        }

        $db = \Config\Database::connect();
        $db->transStart();
        try {
            // Step 1: Optionally save as a recurring income source template
            if ($saveAsRecurring && $incomeData['frequency'] !== 'one-time') {
                $incomeSourceModel = new IncomeSourceModel();
                $dataToSave = [
                    'user_id' => $userId,
                    'label' => $incomeData['label'],
                    'frequency' => $incomeData['frequency']
                ];

                $exists = $incomeSourceModel->where('user_id', $userId)
                    ->where('label', $dataToSave['label'])
                    ->first();
                if (!$exists) {
                    $incomeSourceModel->save($dataToSave);
                }
            }

            // --- START: FIX ---

            // Step 2: Build a complete income item object
            $newItem = [
                'id' => uniqid('inc_', true), // Add a unique ID
                'label' => $incomeData['label'],
                'amount' => $incomeData['amount'],
                'date' => $incomeData['date'],
                'is_received' => false, // Set the default status correctly
                'frequency' => $incomeData['frequency'] ?? 'one-time'
            ];

            // Add the new, complete item to the budget's JSON data
            $incomeArray = json_decode($budgetCycle['initial_income'], true);
            $incomeArray[] = $newItem;
            $budgetCycleModel->update($cycleId, ['initial_income' => json_encode($incomeArray)]);

            // Step 3: The premature transaction log has been REMOVED.

            // --- END: FIX ---

            $db->transComplete();
            if ($db->transStatus() === false) {
                throw new \Exception('Database transaction failed while adding income.');
            }
        } catch (\Exception $e) {
            $db->transRollback();
            log_message('error', '[SERVICE_ERROR_ADD_INCOME] ' . $e->getMessage());
            throw $e;
        }

        return $this->getCompleteBudgetState($userId, $cycleId);
    }


    /**
     * Removes an income item from a budget cycle and logs a reversal transaction.
     *
     * @param int    $userId The owner's user ID.
     * @param int    $budgetId The ID of the budget cycle.
     * @param string $label The label of the income item to remove.
     * @return bool
     * @throws \Exception
     */
    public function removeIncomeFromCycle(int $userId, int $budgetId, string $label): array
    {
        $budgetCycleModel = new BudgetCycleModel();
        $budgetCycle = $budgetCycleModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            throw new \Exception('Budget cycle not found or access denied.');
        }

        $incomeItems = json_decode($budgetCycle['initial_income'], true);
        $itemExists = false;
        foreach ($incomeItems as $item) {
            if ($item['label'] === $label) {
                $itemExists = true;
                break;
            }
        }

        if (!$itemExists) {
            throw new \Exception('Income item not found.');
        }

        $db = \Config\Database::connect();
        $db->transStart();
        try {

            $updatedIncomeItems = array_filter($incomeItems, fn($item) => $item['label'] !== $label);
            $budgetCycleModel->update($budgetId, ['initial_income' => json_encode(array_values($updatedIncomeItems))]);

            $db->transComplete();
            if ($db->transStatus() === false) {
                throw new \Exception('Database transaction failed while removing income.');
            }
        } catch (\Exception $e) {
            $db->transRollback();
            log_message('error', '[SERVICE_ERROR_REMOVE_INCOME] ' . $e->getMessage());
            throw $e;
        }

        return $this->getCompleteBudgetState($userId, $budgetId);
    }

    /**
     * Adds a new expense item to a budget cycle.
     * Optionally saves it as a recurring expense source for future budgets.
     *
     * @param int   $userId          The owner's user ID.
     * @param int   $cycleId         The ID of the budget cycle.
     * @param array $expenseData     An array containing the new expense's details.
     * @param bool  $saveAsRecurring Whether to save this as a recurring expense source.
     * @return bool
     * @throws \Exception
     */
    public function addExpenseToCycle(int $userId, int $cycleId, array $newExpense, bool $saveAsRecurring): array
    {
        $budgetCycleModel = new BudgetCycleModel();
        $budgetCycle = $budgetCycleModel->where('id', $cycleId)
            ->where('user_id', $userId)
            ->first();

        if (!$budgetCycle) {
            throw new \Exception('Budget cycle not found.');
        }

        // Defensive: default type to 'recurring' if not set or invalid
        $validTypes = ['recurring', 'one-time', 'variable'];
        $expenseType = isset($newExpense['type']) && in_array($newExpense['type'], $validTypes) ? $newExpense['type'] : 'recurring';
        $newExpense['type'] = $expenseType;

        $db = \Config\Database::connect();
        $db->transStart();

        try {
            // Only save as recurring if requested and type is recurring
            if ($saveAsRecurring && $expenseType === 'recurring') {
                $recurringExpenseModel = new RecurringExpenseModel();
                $dataToSave = [
                    'user_id' => $userId,
                    'label' => $newExpense['label'],
                    'estimated_amount' => $newExpense['estimated_amount'],
                    'due_date' => $newExpense['due_date'],
                    'category' => $newExpense['category'],
                ];

                $exists = $recurringExpenseModel->where('user_id', $userId)
                    ->where('label', $dataToSave['label'])
                    ->first();

                if (!$exists) {
                    $recurringExpenseModel->save($dataToSave);
                }
            }

            // Only create a learned spending category if type is 'variable'
            if ($expenseType === 'variable') {
                $spendingCategoryModel = new LearnedSpendingCategoryModel();
                $category = $spendingCategoryModel->where('user_id', $userId)
                    ->where('name', $newExpense['label'])
                    ->first();
                if (!$category) {
                    $spendingCategoryModel->insert([
                        'user_id' => $userId,
                        'name' => $newExpense['label'],
                    ]);
                }
            }

            // Add a unique ID to the new expense object before saving it.
            $newExpense['id'] = uniqid('exp_', true);

            // Add the complete expense item to the budget's JSON data
            $expensesArray = json_decode($budgetCycle['initial_expenses'], true);
            $expensesArray[] = $newExpense;
            $budgetCycleModel->update($cycleId, ['initial_expenses' => json_encode($expensesArray)]);

            $db->transComplete();

            if ($db->transStatus() === false) {
                throw new \Exception('Database transaction failed.');
            }

        } catch (\Exception $e) {
            $db->transRollback();
            log_message('error', '[SERVICE_ERROR_ADD_EXPENSE] ' . $e->getMessage());
            throw $e; // Re-throw the exception
        }

        return $this->getCompleteBudgetState($userId, $cycleId);
    }

    /**
     * Removes an expense item from a budget cycle.
     *
     * @param int    $userId The owner's user ID.
     * @param int    $cycleId The ID of the budget cycle.
     * @param string $labelToRemove The label of the expense to remove.
     * @return bool
     * @throws \Exception
     */
    public function removeExpenseFromCycle(int $userId, int $cycleId, string $labelToRemove): array
    {
        $budgetCycleModel = new BudgetCycleModel();
        $budgetCycle = $budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            throw new \Exception('Budget cycle not found.');
        }

        $expenses = json_decode($budgetCycle['initial_expenses'], true);
        $initialCount = count($expenses);

        $updatedExpenses = array_filter($expenses, function ($expense) use ($labelToRemove) {
            return $expense['label'] !== $labelToRemove;
        });

        if (count($updatedExpenses) === $initialCount) {
            throw new \Exception('Expense not found in this budget.');
        }

        try {
            $budgetCycleModel->update($cycleId, ['initial_expenses' => json_encode(array_values($updatedExpenses))]);
        } catch (\Exception $e) {
            log_message('error', '[SERVICE_ERROR_REMOVE_EXPENSE] ' . $e->getMessage());
            throw $e;
        }

        return $this->getCompleteBudgetState($userId, $cycleId);
    }

    /**
     * Adds a new variable expense item to a budget cycle.
     * Also creates or finds a reusable "learned" spending category.
     *
     * @param int    $userId The owner's user ID.
     * @param int    $budgetId The ID of the budget cycle.
     * @param string $label The label for the new expense.
     * @param float  $amount The amount of the new expense.
     * @return bool
     * @throws \Exception
     */
    public function addVariableExpense(int $userId, int $budgetId, string $label, float $amount): array
    {
        $budgetModel = new BudgetCycleModel();
        $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) {
            throw new \Exception('Budget cycle not found.');
        }

        $db = \Config\Database::connect();
        $db->transStart();
        try {
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

            $db->transComplete();
            if ($db->transStatus() === false) {
                throw new \Exception('Database transaction failed while adding variable expense.');
            }
        } catch (\Exception $e) {
            $db->transRollback();
            log_message('error', '[SERVICE_ERROR_ADD_VARIABLE_EXPENSE] ' . $e->getMessage());
            throw $e;
        }

        return $this->getCompleteBudgetState($userId, $budgetId);
    }

    /**
     * Updates the amount for a specific variable expense item in a budget cycle.
     *
     * @param int    $userId    The owner's user ID.
     * @param int    $cycleId   The ID of the budget cycle.
     * @param string $label     The label of the variable expense to update.
     * @param float  $newAmount The new amount for the expense.
     * @return bool
     * @throws \Exception
     */
    public function updateVariableExpenseAmount(int $userId, int $cycleId, string $label, float $newAmount): array
    {
        $budgetCycleModel = new BudgetCycleModel();
        $budgetCycle = $budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            throw new \Exception('Budget cycle not found.');
        }

        $expenses = json_decode($budgetCycle['initial_expenses'], true);
        $updated = false;

        foreach ($expenses as &$expense) {
            if ($expense['label'] === $label && isset($expense['type']) && $expense['type'] === 'variable') {
                $expense['estimated_amount'] = $newAmount;
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            throw new \Exception('Variable expense not found in this budget.');
        }

        try {
            $budgetCycleModel->update($cycleId, ['initial_expenses' => json_encode($expenses)]);
        } catch (\Exception $e) {
            log_message('error', '[SERVICE_ERROR_UPDATE_VARIABLE_EXPENSE] ' . $e->getMessage());
            throw $e;
        }

        return $this->getCompleteBudgetState($userId, $cycleId);
    }

    /**
     * Adjusts the amount of an income item in a budget cycle and logs the difference.
     *
     * @param int    $userId    The owner's user ID.
     * @param int    $budgetId  The ID of the budget cycle.
     * @param string $label     The label of the income item to adjust.
     * @param float  $newAmount The new amount for the income item.
     * @return bool
     * @throws \Exception
     */
    public function adjustIncomeInCycle(int $userId, int $budgetId, string $label, float $newAmount): array
    {
        $budgetCycleModel = new BudgetCycleModel();
        $budgetCycle = $budgetCycleModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            throw new \Exception('Budget cycle not found or access denied.');
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
            throw new \Exception('Original income item not found in this budget.');
        }

        $db = \Config\Database::connect();
        $db->transStart();
        try {
            // Step 1: Log a transaction for the difference in amount
            $adjustmentAmount = $newAmount - $originalAmount;
            if ($adjustmentAmount !== 0.0) {
                $transactionModel = new TransactionModel();
                $transactionModel->logTransaction(
                    $userId,
                    $budgetId,
                    'income',
                    'Adjustment',
                    $adjustmentAmount,
                    "Adjustment for '{$label}' from \${$originalAmount} to \${$newAmount}"
                );
            }

            // Step 2: Update the budget's JSON data
            $updatedIncomeItems = array_map(function ($item) use ($label, $newAmount) {
                if ($item['label'] === $label) {
                    $item['amount'] = $newAmount;
                }
                return $item;
            }, $incomeItems);

            $budgetCycleModel->update($budgetId, ['initial_income' => json_encode($updatedIncomeItems)]);

            $db->transComplete();
            if ($db->transStatus() === false) {
                throw new \Exception('Database transaction failed while adjusting income.');
            }
        } catch (\Exception $e) {
            $db->transRollback();
            log_message('error', '[SERVICE_ERROR_ADJUST_INCOME] ' . $e->getMessage());
            throw $e;
        }

        return $this->getCompleteBudgetState($userId, $budgetId);
    }

    /**
     * Updates the amount for a specific income item in a budget cycle's initial plan.
     *
     * @param int   $userId    The owner's user ID.
     * @param int   $budgetId  The ID of the budget cycle.
     * @param int   $incomeId  The unique ID of the income item to update.
     * @param float $newAmount The new amount for the income item.
     * @return bool
     * @throws \Exception
     */
    public function updateInitialIncomeAmount(int $userId, int $budgetId, int $incomeId, float $newAmount): bool
    {
        $budgetModel = new BudgetCycleModel();
        $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) {
            throw new \Exception('Budget cycle not found.');
        }

        $incomeItems = json_decode($budget['initial_income'], true);
        $updated = false;

        foreach ($incomeItems as &$item) {
            if (isset($item['id']) && $item['id'] == $incomeId) {
                $item['amount'] = $newAmount;
                $updated = true;
                break;
            }
        }

        if (!$updated) {
            throw new \Exception('Income item not found in this budget.');
        }

        try {
            $budgetModel->update($budgetId, ['initial_income' => json_encode($incomeItems)]);
        } catch (\Exception $e) {
            log_message('error', '[SERVICE_ERROR_UPDATE_INCOME_AMOUNT] ' . $e->getMessage());
            throw $e;
        }

        return $this->getCompleteBudgetState($userId, $budgetId);
    }

    /**
     * Updates an income item's details within a budget cycle and logs the difference.
     *
     * @param int    $userId        The owner's user ID.
     * @param int    $budgetId      The ID of the budget cycle.
     * @param string $originalLabel The original label of the income item to find.
     * @param string $newLabel      The new label for the income item.
     * @param float  $newAmount     The new amount for the income item.
     * @return bool
     * @throws \Exception
     */
    public function updateIncomeInCycle(int $userId, int $budgetId, string $originalLabel, string $newLabel, float $newAmount): array
    {
        $budgetCycleModel = new BudgetCycleModel();
        $budgetCycle = $budgetCycleModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            throw new \Exception('Budget cycle not found.');
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
            throw new \Exception('Income item not found in this budget.');
        }

        $db = \Config\Database::connect();
        $db->transStart();
        try {
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

            $db->transComplete();
            if ($db->transStatus() === false) {
                throw new \Exception('Database transaction failed while updating income.');
            }
        } catch (\Exception $e) {
            $db->transRollback();
            log_message('error', '[SERVICE_ERROR_UPDATE_INCOME] ' . $e->getMessage());
            throw $e;
        }

        return $this->getCompleteBudgetState($userId, $budgetId);
    }

    /**
     * Updates a recurring expense's details within a budget cycle.
     *
     * @param int    $userId     The owner's user ID.
     * @param int    $budgetId   The ID of the budget cycle.
     * @param string $label      The label of the expense to update.
     * @param float  $newAmount  The new estimated amount.
     * @param int|null $newDueDate The new due date.
     * @return bool
     * @throws \Exception
     */
    public function updateRecurringExpenseInCycle(int $userId, int $budgetId, string $label, float $newAmount, ?int $newDueDate): array
    {
        $budgetModel = new BudgetCycleModel();
        $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) {
            throw new \Exception('Budget cycle not found.');
        }

        $expenses = json_decode($budget['initial_expenses'], true);
        $itemFound = false;

        foreach ($expenses as &$exp) {
            if (isset($exp['type']) && $exp['type'] === 'recurring' && $exp['label'] === $label) {
                $exp['estimated_amount'] = $newAmount;
                $exp['due_date'] = $newDueDate;
                $itemFound = true;
                break;
            }
        }

        if (!$itemFound) {
            throw new \Exception('Recurring expense not found in this budget.');
        }

        try {
            $budgetModel->update($budgetId, ['initial_expenses' => json_encode($expenses)]);
        } catch (\Exception $e) {
            log_message('error', '[SERVICE_ERROR_UPDATE_RECURRING_EXPENSE] ' . $e->getMessage());
            throw $e;
        }

        return $this->getCompleteBudgetState($userId, $budgetId);
    }

    /**
     * Creates a new budget cycle for a user.
     *
     * @param int   $userId              The owner's user ID.
     * @param array $cycleData           Data for the new cycle (start_date, end_date).
     * @param array $incomeSources       Array of initial income items.
     * @param array $recurringExpenses   Array of initial recurring expense items.
     * @param array $spendingCategories  Array of initial variable spending categories.
     * @return int The ID of the newly created budget cycle.
     * @throws \Exception
     */
    public function createCycle(int $userId, array $cycleData, array $incomeSources, array $recurringExpenses, array $spendingCategories): int
    {
        $budgetCycleModel = new BudgetCycleModel();

        // Security check: Ensure no other active budget exists for the user.
        $existingActiveCycle = $budgetCycleModel->where('user_id', $userId)->where('status', 'active')->first();
        if ($existingActiveCycle) {
            throw new \Exception('An active budget already exists.');
        }

        // Prepare the initial expenses array
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
            'start_date' => $cycleData['start_date'],
            'end_date' => $cycleData['end_date'],
            'status' => 'active',
            'initial_income' => json_encode($incomeSources),
            'initial_expenses' => json_encode($allExpenses),
        ];

        try {
            $budgetId = $budgetCycleModel->insert($newCycleData);
            if (!$budgetId) {
                // This will be caught by the generic exception below, but is good practice
                throw new \Exception('Failed to insert new budget cycle.');
            }
        } catch (\Exception $e) {
            log_message('error', '[SERVICE_ERROR_CREATE_CYCLE] ' . $e->getMessage());
            throw $e;
        }

        return $budgetId;
    }

    /**
     * Fetches all budget cycles for a user.
     *
     * @param int $userId The owner's user ID.
     * @return array
     */
    public function getCycles(int $userId): array
    {
        $budgetCycleModel = new BudgetCycleModel();
        return $budgetCycleModel->where('user_id', $userId)->findAll();
    }

    /**
     * Fetches the detailed data for a single budget cycle, including processed income status.
     *
     * @param int $userId The owner's user ID.
     * @param int $cycleId The ID of the budget cycle.
     * @return array|null
     * @throws \Exception
     */
    public function getCycleDetails(int $userId, int $cycleId): ?array
    {

        $state = $this->getCompleteBudgetState($userId, $cycleId);

        if (!$state['budget']) {
            throw new \Exception('Budget cycle not found or access denied.');
        }

        return $state['budget'];
    }

    /**
     * Gathers all necessary data and projections for the budget creation wizard.
     *
     * @param int $userId The owner's user ID.
     * @return array
     */
    public function getWizardSuggestions(int $userId): array
    {
        $incomeModel = new IncomeSourceModel();
        $expenseModel = new RecurringExpenseModel();
        $spendingCategoryModel = new LearnedSpendingCategoryModel();

        $suggestedIncome = $incomeModel->where('user_id', $userId)->where('is_active', 1)->findAll();
        $suggestedExpenses = $expenseModel->where('user_id', $userId)->where('is_active', 1)->findAll();
        $learnedCategories = $spendingCategoryModel->where('user_id', $userId)->findAll();

        // Business logic to determine if the user has a complete set of rules for express setup
        $isReturningUserWithRules = false;
        if (!empty($suggestedIncome)) {
            $isReturningUserWithRules = array_reduce($suggestedIncome, function ($carry, $item) {
                return $carry || !(
                    (($item['frequency'] === 'weekly' || $item['frequency'] === 'bi-weekly') && !$item['frequency_day']) ||
                    (($item['frequency'] === 'monthly' || $item['frequency'] === 'semi-monthly') && !$item['frequency_date_1'])
                );
            }, false);
        }

        $today = new \DateTime();
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

        // If the user is eligible for express setup, run the projections
        if ($isReturningUserWithRules) {
            $projectionService = new ProjectionService();
            $data['projectedIncome'] = $projectionService->projectIncome($proposedStartDate, $proposedEndDate, $suggestedIncome);
            $data['projectedExpenses'] = $projectionService->projectExpenses($proposedStartDate, $proposedEndDate, $suggestedExpenses);
        }

        return $data;
    }

    /**
     * Closes an active budget cycle, calculates the final summary, and saves it.
     *
     * @param int $userId The owner's user ID.
     * @param int $cycleId The ID of the budget cycle to close.
     * @return bool
     * @throws \Exception
     */
    public function closeCycle(int $userId, int $cycleId): bool
    {
        $budgetCycleModel = new BudgetCycleModel();
        $transactionModel = new TransactionModel();

        $budget = $budgetCycleModel->where('id', $cycleId)
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->first();

        if (!$budget) {
            throw new \Exception('Active budget cycle not found or access denied.');
        }

        // --- All of the calculation logic is now in the service ---
        $transactions = $transactionModel->where('budget_cycle_id', $cycleId)->findAll();
        $initialExpenses = json_decode($budget['initial_expenses'], true) ?: [];
        $initialIncome = json_decode($budget['initial_income'], true) ?: [];

        $actualIncome = 0;
        $actualExpenses = 0;
        $expenseBreakdown = [];

        foreach ($transactions as $t) {
            if ($t['type'] === 'income') {
                $actualIncome += (float) $t['amount'];
            }
            if ($t['type'] === 'expense' || $t['type'] === 'savings') {
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
            $budgetCycleModel->update($cycleId, [
                'status' => 'completed',
                'final_summary' => json_encode($finalSummary)
            ]);
        } catch (\Exception $e) {
            log_message('error', '[SERVICE_ERROR_CLOSE_BUDGET] ' . $e->getMessage());
            throw $e;
        }

        return true;
    }

    /**
     * Updates the start and end dates for a budget cycle.
     *
     * @param int    $userId    The owner's user ID.
     * @param int    $budgetId  The ID of the budget cycle to update.
     * @param string $startDate The new start date.
     * @param string $endDate   The new end date.
     * @return bool
     * @throws \Exception
     */
    public function updateBudgetDates(int $userId, int $budgetId, string $startDate, string $endDate): array
    {
        $budgetModel = new BudgetCycleModel();

        // Find the budget and verify ownership.
        $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) {
            throw new \Exception('Budget cycle not found or access denied.');
        }

        $data = [
            'start_date' => $startDate,
            'end_date' => $endDate,
        ];

        try {
            if ($budgetModel->update($budgetId, $data) === false) {
                // Throw an exception if the model's own validation fails
                throw new \Exception(implode(', ', $budgetModel->errors()));
            }
        } catch (\Exception $e) {
            log_message('error', '[SERVICE_ERROR_UPDATE_DATES] ' . $e->getMessage());
            throw $e;
        }

        return $this->getCompleteBudgetState($userId, $budgetId);
    }

    /**
     * Projects income over a given date range based on a set of rules.
     *
     * @param string $startDate   The start date for the projection (Y-m-d).
     * @param string $endDate     The end date for the projection (Y-m-d).
     * @param array  $incomeRules The array of income source rules.
     * @return array
     */
    public function projectIncome(string $startDate, string $endDate, array $incomeRules): array
    {
        // This service method acts as a clean wrapper around the ProjectionService
        $projectionService = new ProjectionService();
        return $projectionService->projectIncome($startDate, $endDate, $incomeRules);
    }

    public function getActiveBudgetForUser(int $userId): ?array
    {
        $budgetCycleModel = new BudgetCycleModel();

        return $budgetCycleModel
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Creates a new learned spending category for a user.
     *
     * @param int    $userId The user's ID.
     * @param string $name   The name of the new category.
     * @return int The ID of the new or existing category.
     * @throws \Exception
     */
    public function createSpendingCategory(int $userId, string $name): int
    {
        $model = new LearnedSpendingCategoryModel();

        // Check if a category with this name already exists for the user.
        $exists = $model->where('user_id', $userId)->where('name', $name)->first();
        if ($exists) {
            return $exists['id'];
        }

        $data = [
            'user_id' => $userId,
            'name' => $name,
        ];

        try {
            if ($model->save($data)) {
                return $model->getInsertID();
            }
        } catch (\Exception $e) {
            log_message('error', '[SERVICE_ERROR_CREATE_SPENDING_CATEGORY] ' . $e->getMessage());
            throw $e;
        }

        // This line should ideally not be reached if exceptions are handled correctly.
        throw new \Exception('Could not save spending category.');
    }

    /**
     * Logs a transaction for a variable expense and returns the updated budget state.
     *
     * @param int $userId
     * @param int $cycleId
     * @param string $label
     * @param float $amount
     * @param string|null $description
     * @return array
     */
    public function logVariableExpenseTransaction(int $userId, int $cycleId, string $label, float $amount, ?string $description = null): array
    {
        $budgetCycleModel = new BudgetCycleModel();
        $budget = $budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first();
        if (!$budget) {
            throw new \Exception('Budget cycle not found.');
        }
        $db = \Config\Database::connect();
        $db->transStart();
        try {
            $transactionModel = new TransactionModel();
            $transactionModel->logTransaction(
                $userId,
                $cycleId,
                'expense',
                $label, // category_name
                $amount,
                $description ?? $label
            );
            $db->transComplete();
            if ($db->transStatus() === false) {
                throw new \Exception('Database transaction failed while logging variable expense.');
            }
        } catch (\Exception $e) {
            $db->transRollback();
            log_message('error', '[SERVICE_ERROR_LOG_VARIABLE_EXPENSE] ' . $e->getMessage());
            throw $e;
        }
        return $this->getCompleteBudgetState($userId, $cycleId);
    }
}