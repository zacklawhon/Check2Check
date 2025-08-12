<?php
// =================================================================
// FILE: /app/Controllers/API/BudgetController.php
// =================================================================

namespace App\Controllers\API;

use App\Controllers\BaseController;
use App\Models\BudgetCycleModel;
use App\Models\IncomeSourceModel;
use App\Models\RecurringExpenseModel;
use App\Models\LearnedSpendingCategoryModel;
use App\Models\TransactionModel;
use App\Models\UserModel;
use App\Models\UserAccountModel;
use App\Models\UserFinancialToolsModel;
use CodeIgniter\API\ResponseTrait;
use DateTime;
use Exception;

class BudgetController extends BaseController
{
    use ResponseTrait;

    /**
     * Creates a new budget cycle for the authenticated user.
     *
     * Validates input data (start/end dates, income sources, expenses, categories) and ensures no active budget exists.
     * Processes JSON inputs for income sources, recurring expenses, and spending categories, then creates a budget cycle
     * and logs initial income transactions. No redundancy with other methods due to its unique creation logic.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a 201 response with the new budget ID if successful, a 409 if an active budget exists,
     * a validation error for invalid input, or a 500 error on failure.
     */
    public function createCycle()
    {
        $session = session();
        $userId = $session->get('userId');
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
            // FIX: This now uses the lists of items sent from the wizard's selections
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

            // FIX: Use the centralized transaction model method
            $transactionModel = new TransactionModel();
            foreach ($incomeSources as $income) {
                $transactionModel->logTransaction(
                    $userId,
                    $budgetId,
                    'income',
                    $income['label'],
                    (float) $income['amount'],
                    "Initial income from {$income['label']}"
                );
            }

            return $this->respondCreated(['id' => $budgetId, 'message' => 'Budget cycle created successfully.']);
        } catch (\Exception $e) {
            log_message('error', '[ERROR_CREATE_CYCLE] {exception}', ['exception' => $e]);
            return $this->failServerError('Could not create budget cycle.');
        }
    }

    /**
     * Retrieves all budget cycles for the authenticated user.
     *
     * Fetches all budget cycles associated with the user from the BudgetCycleModel.
     * No redundancy with other methods due to its unique retrieval purpose.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a JSON response with an array of budget cycles.
     */
    public function getCycles()
    {
        $session = session();
        $userId = $session->get('userId');
        $budgetCycleModel = new BudgetCycleModel();
        $cycles = $budgetCycleModel->where('user_id', $userId)->findAll();
        return $this->respond($cycles);
    }

    /**
     * Retrieves details of a specific budget cycle for the authenticated user.
     *
     * Fetches a budget cycle by ID, verifies user ownership, and decodes JSON fields (initial_income, initial_expenses, final_summary).
     * No redundancy with other methods due to its specific retrieval logic.
     *
     * @param int $id The ID of the budget cycle.
     * @return \CodeIgniter\API\ResponseTrait Returns a JSON response with the budget cycle details or a 404 if not found.
     */
    public function getCycleDetails($id)
    {
        $session = session();
        $userId = $session->get('userId');
        $budgetCycleModel = new BudgetCycleModel();

        $budgetCycle = $budgetCycleModel->where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $budgetCycle['initial_income'] = json_decode($budgetCycle['initial_income'] ?? '[]', true);
        $budgetCycle['initial_expenses'] = json_decode($budgetCycle['initial_expenses'] ?? '[]', true);
        $budgetCycle['final_summary'] = json_decode($budgetCycle['final_summary'] ?? '[]', true);

        return $this->respond($budgetCycle);
    }

    /**
     * Retrieves all transactions for a specific budget cycle.
     *
     * Verifies the budget cycle exists and belongs to the user, then fetches all associated transactions.
     * No redundancy with other methods due to its specific transaction retrieval logic.
     *
     * @param int $cycleId The ID of the budget cycle.
     * @return \CodeIgniter\API\ResponseTrait Returns a JSON response with the transactions or a 404 if the cycle is not found.
     */
    public function getTransactionsForCycle($cycleId)
    {
        $session = session();
        $userId = $session->get('userId');
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

    /**
     * Updates the estimated amount of a variable expense in a budget cycle.
     *
     * Verifies the budget cycle exists and belongs to the user, updates the specified variable expense’s amount
     * in the initial_expenses JSON field. Note: Shares fetch-decode-update pattern with other expense-related methods
     * (e.g., markBillPaid, addExpenseToCycle). A helper method for JSON manipulation could reduce duplication.
     *
     * @param int $cycleId The ID of the budget cycle.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if updated, a 404 if the cycle or expense is not found,
     * or a validation error if the amount is invalid.
     */
    public function updateVariableExpenseAmount($cycleId)
    {
        $session = session();
        $userId = $session->get('userId');
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

    /**
     * Marks a recurring expense as paid in a budget cycle and logs a transaction.
     *
     * Verifies the budget cycle and expense exist, marks the expense as paid in the initial_expenses JSON field,
     * and logs a transaction. Note: Shares fetch-decode-update pattern with other expense-related methods.
     * A helper method for JSON manipulation could reduce duplication.
     *
     * @param int $cycleId The ID of the budget cycle.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if updated, a 404 if the cycle or expense is not found,
     * or a failure response if the expense is already paid.
     */
    public function markBillPaid($cycleId)
    {
        $session = session();
        $userId = $session->get('userId');
        $budgetCycleModel = new BudgetCycleModel();

        // --- THIS IS THE FIX ---
        // The query was incorrectly written with '=>'
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

                    $accountModel = new \App\Models\UserAccountModel();
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

    /**
     * Adds a new income to a budget cycle, optionally saving it as recurring.
     *
     * Validates input, adds the income to the initial_income JSON field, logs a transaction, and optionally
     * saves to IncomeSourceModel. Note: Shares fetch-decode-update pattern with other income-related methods
     * (e.g., adjustIncomeInCycle, updateInitialIncomeAmount). A helper method for JSON manipulation could reduce duplication.
     *
     * @param int $cycleId The ID of the budget cycle.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if added, a 404 if the cycle is not found,
     * or a validation error for invalid input.
     */
    public function addIncomeToCycle($cycleId)
    {
        $session = session();
        $userId = $session->get('userId');
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
        $session = session();
        $userId = $session->get('userId');
        $budgetCycleModel = new BudgetCycleModel();
        $recurringExpenseModel = new RecurringExpenseModel();

        // --- THIS IS THE FIX ---
        // The query was incorrectly written as 'id', '=>' . $cycleId
        // It is now corrected to 'id', $cycleId
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
        $session = session();
        $userId = $session->get('userId');
        $budgetCycleModel = new BudgetCycleModel();

        $budgetCycle = $budgetCycleModel->where('id', $cycleId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $labelToRemove = $this->request->getVar('label');
        if (empty($labelToRemove)) {
            return $this->fail('Label is required.');
        }

        $expenses = json_decode($budgetCycle['initial_expenses'], true);
        $expenses = array_filter($expenses, function ($expense) use ($labelToRemove) {
            return $expense['label'] !== $labelToRemove;
        });

        $budgetCycleModel->update($cycleId, ['initial_expenses' => json_encode(array_values($expenses))]);
        return $this->respondDeleted(['message' => 'Expense removed successfully.']);
    }

    /**
     * Adjusts the amount of an existing income in a budget cycle.
     *
     * Validates input, adjusts the specified income’s amount in the initial_income JSON field, and logs a transaction
     * for the difference. Note: Shares fetch-decode-update pattern with other income-related methods. Similar to
     * updateInitialIncomeAmount but includes transaction logging. Consider consolidating with a parameter to toggle logging.
     *
     * @param int $budgetId The ID of the budget cycle.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if adjusted, a 404 if the cycle or income is not found,
     * or a validation error for invalid input.
     */
    public function adjustIncomeInCycle($budgetId)
    {
        $session = session();
        $userId = $session->get('userId');

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

        $label = $this->request->getVar('label');
        $newAmount = (float) $this->request->getVar('new_amount');

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

    /**
     * Removes an income from a budget cycle.
     *
     * Verifies the budget cycle exists, removes the specified income from the initial_income JSON field,
     * and logs a negative transaction. Note: Shares fetch-decode-update pattern with other income-related methods.
     * A helper method for JSON manipulation could reduce duplication.
     *
     * @param int $budgetId The ID of the budget cycle.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if removed, a 404 if the cycle or income is not found,
     * or a validation error if the label is missing.
     */
    public function removeIncomeFromCycle($budgetId)
    {
        $session = session();
        $userId = $session->get('userId');
        $label = $this->request->getVar('label');

        if (empty($label)) {
            return $this->failValidationErrors('Label is required.');
        }

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
        $session = session();
        $userId = $session->get('userId');

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
        // The SavingsHistoryModel is no longer needed here
        $transactionModel = new TransactionModel(); // Use TransactionModel instead
        $budgetCycleModel = new BudgetCycleModel(); // Needed to find the active budget

        // 1. Update User's Zip Code
        $userModel->update($userId, ['demographic_zip_code' => $this->request->getVar('zipCode')]);

        // 2. Find or create the financial tools record
        $toolsRecord = $toolsModel->where('user_id', $userId)->first();
        if (!$toolsRecord) {
            $toolsModel->insert(['user_id' => $userId]);
            $toolsRecord = $toolsModel->where('user_id', $userId)->first();
        }

        // Use a boolean directly
        $hasSavings = filter_var($this->request->getVar('hasSavings'), FILTER_VALIDATE_BOOLEAN);
        $initialBalance = (float) $this->request->getVar('initialBalance') ?: 0;

        $toolsData = ['has_savings_account' => $hasSavings];

        if ($hasSavings && $initialBalance > 0) {
            $toolsData['current_savings_balance'] = $initialBalance;

            // --- REPLACEMENT LOGIC ---
            // Find the active budget to associate the transaction with
            $activeBudget = $budgetCycleModel->where('user_id', $userId)->where('status', 'active')->first();

            if ($activeBudget) {
                // Log the initial balance as a "savings" transaction
                $transactionModel->logTransaction(
                    $userId,
                    $activeBudget['id'],
                    'savings', // A new type to distinguish it from income/expense
                    'Savings', // A general category
                    $initialBalance,
                    'Initial savings balance'
                );
            }
            // --- END REPLACEMENT ---
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
        $session = session();
        $userId = $session->get('userId');
        $incomeModel = new IncomeSourceModel();
        $expenseModel = new RecurringExpenseModel();
        $spendingCategoryModel = new LearnedSpendingCategoryModel();

        $lastIncome = $incomeModel->where('user_id', $userId)
            ->where('is_active', 1)
            ->orderBy('created_at', 'DESC')
            ->first();

        // --- FIX: This block now handles a new user gracefully ---
        if (!$lastIncome) {
            // This is a new user with no saved income. Provide default dates.
            $proposedStartDate = date('Y-m-d');
            $proposedEndDate = date('Y-m-d', strtotime('+2 weeks'));

            $data = [
                'proposedStartDate' => $proposedStartDate,
                'proposedEndDate' => $proposedEndDate,
                'suggestedIncome' => [],
                'suggestedExpenses' => [],
                'learned_spending_categories' => []
            ];

            return $this->respond($data);
        }
        // --- End of FIX ---

        // The rest of the function is the original logic for a returning user
        $frequency = $lastIncome['frequency'];
        $today = new \DateTime();

        // Logic to propose dates based on income frequency
        if ($frequency === 'weekly') {
            $proposedStartDate = $today->modify('next Sunday')->format('Y-m-d');
            $proposedEndDate = (new \DateTime($proposedStartDate))->modify('+6 days')->format('Y-m-d');
        } elseif ($frequency === 'bi-weekly') {
            $proposedStartDate = $today->modify('next Friday')->format('Y-m-d');
            $proposedEndDate = (new \DateTime($proposedStartDate))->modify('+13 days')->format('Y-m-d');
        } else { // Default for semi-monthly, monthly
            $dayOfMonth = (int) $today->format('d');
            if ($dayOfMonth < 15) {
                $proposedStartDate = $today->format('Y-m-15');
                $proposedEndDate = $today->format('Y-m-t'); // Last day of current month
            } else {
                $proposedStartDate = $today->format('Y-m-t');
                $proposedEndDate = (new \DateTime($proposedStartDate))->modify('+15 days')->format('Y-m-t');
            }
        }

        $suggestedIncome = $incomeModel->where('user_id', $userId)->where('is_active', 1)->findAll();
        $suggestedExpenses = $expenseModel->where('user_id', $userId)->where('is_active', 1)->findAll();
        $learnedCategories = $spendingCategoryModel->where('user_id', $userId)->findAll();

        $data = [
            'proposedStartDate' => $proposedStartDate,
            'proposedEndDate' => $proposedEndDate,
            'suggestedIncome' => $suggestedIncome,
            'suggestedExpenses' => $suggestedExpenses,
            'learned_spending_categories' => $learnedCategories
        ];

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
        $session = session();
        $userId = $session->get('userId');

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
        $session = session();
        $userId = $session->get('userId');
        $recurringExpenseModel = new RecurringExpenseModel();
        $budgetCycleModel = new BudgetCycleModel();

        // 1. Ensure the expense belongs to the user
        $expense = $recurringExpenseModel->where('id', $expenseId)->where('user_id', $userId)->first();
        if (!$expense) {
            return $this->failNotFound('Expense not found.');
        }

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

        try {
            // 2. Update the permanent recurring_expenses table
            if ($recurringExpenseModel->update($expenseId, $allowedData) === false) {
                return $this->fail($recurringExpenseModel->errors());
            }

            // 3. Find the active budget cycle to update its JSON data
            $activeCycle = $budgetCycleModel->where('user_id', $userId)->where('status', 'active')->first();
            if ($activeCycle) {
                $initialExpenses = json_decode($activeCycle['initial_expenses'], true);

                // Find and update the matching expense within the JSON
                foreach ($initialExpenses as &$exp) {
                    if (isset($exp['id']) && $exp['id'] == $expenseId) {
                        // Merge the new data into the existing item
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

    /**
     * Updates the amount of a specific income in a budget cycle.
     *
     * Updates the amount of an income identified by ID in the initial_income JSON field. Note: Similar to
     * adjustIncomeInCycle but lacks transaction logging. Consider consolidating with a parameter to toggle logging.
     * Shares fetch-decode-update pattern with other income-related methods.
     *
     * @param int $budgetId The ID of the budget cycle.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if updated, a 404 if the cycle or income is not found,
     * or a validation error if the amount is invalid.
     */
    public function updateInitialIncomeAmount($budgetId)
    {
        $session = session();
        $userId = $session->get('userId');
        $budgetModel = new BudgetCycleModel();
        $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $idToUpdate = $this->request->getVar('id');
        $newAmount = $this->request->getVar('amount');
        if (!is_numeric($newAmount)) {
            return $this->failValidationErrors('Amount must be a number.');
        }

        $incomeItems = json_decode($budget['initial_income'], true);
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
        return $this->fail('Income item not found in this budget.');
    }

    /**
     * Adds a variable expense to a budget cycle and optionally saves it as a learned category.
     *
     * Adds a variable expense to the initial_expenses JSON field and saves the category to LearnedSpendingCategoryModel
     * if it doesn’t exist. Note: Shares fetch-decode-update pattern with other expense-related methods.
     * A helper method for JSON manipulation could reduce duplication.
     *
     * @param int $budgetId The ID of the budget cycle.
     * @return \CodeIgniter\API\ResponseTrait Returns a 201 response if added, a 404 if the cycle is not found,
     * or a validation error for invalid input.
     */
    public function addVariableExpense($budgetId)
    {
        $session = session();
        $userId = $session->get('userId');
        $budgetModel = new BudgetCycleModel();

        $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $label = $this->request->getVar('label');
        $amount = $this->request->getVar('amount');
        if (!$label || !is_numeric($amount)) {
            return $this->failValidationErrors('Label and amount are required.');
        }

        // Step 1: Create or find the reusable category in 'learned_spending_categories'
        $spendingCategoryModel = new \App\Models\LearnedSpendingCategoryModel();
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

    /**
     * Adds a savings contribution to a budget cycle and updates the balance.
     *
     * Validates the amount, updates the savings balance in UserFinancialToolsModel, and logs a transaction.
     * Note: Similar to logSavings but uses TransactionModel and requires a budget cycle. Consider consolidating
     * with logSavings, using a parameter to toggle the logging model, or deprecating if SavingsHistoryModel is redundant.
     *
     * @param int $budgetId The ID of the budget cycle.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response with the new balance, a 404 if the cycle is not found,
     * a validation error if the savings account is not set up or the amount is invalid, or a 500 error on failure.
     */
    public function transferToAccount($budgetId)
    {
        $session = session();
        $userId = $session->get('userId');
        $rules = [
            'account_id' => 'required|integer',
            'amount' => 'required|decimal|greater_than[0]'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $accountId = $this->request->getVar('account_id');
        $amount = (float) $this->request->getVar('amount');

        $accountModel = new UserAccountModel();
        $account = $accountModel->where('id', $accountId)->where('user_id', $userId)->first();
        if (!$account) {
            return $this->failNotFound('Account not found.');
        }

        // Add funds to the account
        $newBalance = (float) $account['current_balance'] + $amount;
        $accountModel->update($accountId, ['current_balance' => $newBalance]);

        // Log an expense, as money is leaving the budget's cash flow
        $transactionModel = new TransactionModel();
        $transactionModel->logTransaction(
            $userId,
            $budgetId,
            'savings', // <-- Change this from 'expense' to 'savings'
            'Transfer',
            $amount,
            'Transfer to ' . $account['account_name']
        );

        return $this->respondUpdated(['message' => 'Transfer successful.']);
    }


    /**
     * Withdraws money from savings, logging it as an income or external transaction.
     *
     * Validates the amount and withdrawal type, updates the savings balance, and logs a transaction based on the
     * withdrawal type (income to add to budget or external to exclude). No redundancy with other methods due to its
     * unique withdrawal logic, but shares balance update pattern with addSavings and logSavings.
     *
     * @param int $budgetId The ID of the budget cycle.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response with the new balance, a 404 if the cycle is not found,
     * a validation error if the savings account is not set up or the amount exceeds the balance, or a 500 error on failure.
     */
    public function transferFromAccount($budgetId)
    {
        $session = session();
        $userId = $session->get('userId');
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

        $accountModel = new \App\Models\UserAccountModel();
        $account = $accountModel->where('id', $accountId)->where('user_id', $userId)->first();
        if (!$account) {
            return $this->failNotFound('Account not found.');
        }

        if ($amount > (float) $account['current_balance']) {
            return $this->failValidationErrors('Transfer amount cannot exceed the account balance.');
        }

        // This logic remains the same
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

            // --- THIS IS THE FIX ---
            // We now also add a new "Planned Income" item to the budget's data.
            $budgetCycleModel = new BudgetCycleModel();
            $budgetCycle = $budgetCycleModel->find($budgetId);
            $incomeItems = json_decode($budgetCycle['initial_income'], true);

            $newIncomeItem = [
                'label' => 'Transfer from ' . $account['account_name'],
                'amount' => $amount,
                'frequency' => 'one-time'
            ];

            $incomeItems[] = $newIncomeItem;
            $budgetCycleModel->update($budgetId, ['initial_income' => json_encode($incomeItems)]);
            // --- END OF FIX ---
        }

        return $this->respondUpdated(['message' => 'Transfer successful.']);
    }

    public function closeCycle($id)
    {
        $session = session();
        $userId = $session->get('userId');
        $budgetCycleModel = new BudgetCycleModel();
        $transactionModel = new TransactionModel();

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
            if ($t['type'] === 'expense') {
                $actualExpenses += (float) $t['amount'];
                $category = $t['category_name'] ?? 'Uncategorized';
                if (!isset($expenseBreakdown[$category])) {
                    $expenseBreakdown[$category] = 0;
                }
                $expenseBreakdown[$category] += (float) $t['amount'];
            }
        }

        // --- THIS IS THE NEW AND IMPROVED LOGIC ---
        // Sort the spending breakdown by amount, from highest to lowest.
        arsort($expenseBreakdown);

        // Take just the top 5 categories.
        $topSpending = array_slice($expenseBreakdown, 0, 5, true);

        // Format the array into the structure the frontend expects.
        $topSpendingCategories = [];
        foreach ($topSpending as $category => $amount) {
            $topSpendingCategories[] = ['category' => $category, 'amount' => $amount];
        }
        // --- END OF NEW LOGIC ---

        $plannedIncome = array_sum(array_column($initialIncome, 'amount'));
        $plannedExpenses = array_sum(array_column($initialExpenses, 'estimated_amount'));

        $finalSummary = [
            'plannedIncome' => $plannedIncome,
            'actualIncome' => $actualIncome,
            'plannedExpenses' => $plannedExpenses,
            'actualExpenses' => $actualExpenses,
            'plannedSurplus' => $plannedIncome - $plannedExpenses,
            'actualSurplus' => $actualIncome - $actualExpenses,
            'topSpendingCategories' => $topSpendingCategories, // Use the new, correct key
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
        $session = session();
        $userId = $session->get('userId');
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
        $session = session();
        $userId = $session->get('userId');
        $rules = [
            'original_label' => 'required|string',
            'label' => 'required|string',
            'amount' => 'required|decimal'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $budgetCycleModel = new BudgetCycleModel();
        $budgetCycle = $budgetCycleModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $originalLabel = $this->request->getVar('original_label');
        $newLabel = $this->request->getVar('label');
        $newAmount = (float) $this->request->getVar('amount');

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
        $session = session();
        $userId = $session->get('userId');
        $budgetModel = new BudgetCycleModel();

        // 1. Find the budget and verify ownership
        $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) {
            return $this->failNotFound('Budget cycle not found or access denied.');
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

        // 3. Update the database
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
}