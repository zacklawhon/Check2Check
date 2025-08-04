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
use App\Models\UserFinancialToolsModel;
use App\Models\SavingsHistoryModel;
use CodeIgniter\API\ResponseTrait;
use DateTime;
use Exception;

class BudgetController extends BaseController
{
    use ResponseTrait;

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
            'end_date'   => 'required|valid_date[Y-m-d]',
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
                    (float)$income['amount'],
                    "Initial income from {$income['label']}"
                );
            }

            return $this->respondCreated(['id' => $budgetId, 'message' => 'Budget cycle created successfully.']);
        } catch (\Exception $e) {
            log_message('error', '[ERROR_CREATE_CYCLE] {exception}', ['exception' => $e]);
            return $this->failServerError('Could not create budget cycle.');
        }
    }

    public function getCycles()
    {
        $session = session();
        $userId = $session->get('userId');
        $budgetCycleModel = new BudgetCycleModel();
        $cycles = $budgetCycleModel->where('user_id', $userId)->findAll();
        return $this->respond($cycles);
    }

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

    public function markBillPaid($cycleId)
    {
        $session = session();
        $userId = $session->get('userId');
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
            // FIX: Use the centralized transaction model method
            $transactionModel = new TransactionModel();
            $transactionModel->logTransaction(
                $userId,
                $cycleId,
                'expense',
                $paidExpense['category'],
                (float)$paidExpense['estimated_amount'],
                $paidExpense['label']
            );

            $budgetCycleModel->update($cycleId, ['initial_expenses' => json_encode($expenses)]);
            return $this->respondUpdated(['message' => 'Bill marked as paid and transaction logged.']);
        }

        return $this->fail('Bill not found in this budget.');
    }

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
            'save_recurring' => 'permit_empty|boolean'
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
            (float)$newIncome['amount'],
            $newIncome['label']
        );

        return $this->respondUpdated(['message' => 'Income added and transaction logged.']);
    }

    public function addExpenseToCycle($cycleId)
    {
        $session = session();
        $userId = $session->get('userId');
        $budgetCycleModel = new BudgetCycleModel();
        $recurringExpenseModel = new RecurringExpenseModel();

        $budgetCycle = $budgetCycleModel->getCycleForUser($cycleId, $userId);
        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found.');
        }

        $json = $this->request->getJSON(true);

        // --- Data for the recurring_expenses table ---
        $recurringData = [
            'user_id' => $userId,
            'label' => $json['label'],
            'category' => $json['category'],
            'due_date' => $json['due_date'] ?? null,
        ];

        // FIX: Add category-specific fields to the saved record
        if ($recurringData['category'] === 'loan') {
            $recurringData['principal_balance'] = $json['principal_balance'] ?? null;
            $recurringData['interest_rate'] = $json['interest_rate'] ?? null;
            $recurringData['maturity_date'] = $json['maturity_date'] ?? null;
        } elseif ($recurringData['category'] === 'credit-card') {
            $recurringData['outstanding_balance'] = $json['outstanding_balance'] ?? null;
            $recurringData['interest_rate'] = $json['interest_rate'] ?? null;
        }
        
        $recurringExpenseModel->save($recurringData);

        // --- Data for the current budget cycle's initial_expenses JSON ---
        $newExpenseForCycle = [
            'label' => $json['label'],
            'estimated_amount' => $json['amount'], // The amount for THIS cycle
            'category' => $json['category'],
            'type' => 'recurring',
            'due_date' => $json['due_date'] ?? null,
            'is_paid' => false,
        ];

        $expensesArray = json_decode($budgetCycle['initial_expenses'], true);
        $expensesArray[] = $newExpenseForCycle;
        $budgetCycleModel->update($cycleId, ['initial_expenses' => json_encode($expensesArray)]);

        return $this->respondUpdated(['message' => 'New recurring bill added successfully.']);
    }

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
        $expenses = array_filter($expenses, function($expense) use ($labelToRemove) {
            return $expense['label'] !== $labelToRemove;
        });

        $budgetCycleModel->update($cycleId, ['initial_expenses' => json_encode(array_values($expenses))]);
        return $this->respondDeleted(['message' => 'Expense removed successfully.']);
    }

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
        $newAmount = (float)$this->request->getVar('new_amount');

        $incomeItems = json_decode($budgetCycle['initial_income'], true);

        $originalAmount = 0;
        $itemFound = false;
        foreach ($incomeItems as $item) {
            if ($item['label'] === $label) {
                $originalAmount = (float)$item['amount'];
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

        $updatedIncomeItems = array_map(function($item) use ($label, $newAmount) {
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
            -(float)$itemToRemove['amount'],
            "Removal of income source '{$label}'"
        );

        $updatedIncomeItems = array_filter($incomeItems, fn($item) => $item['label'] !== $label);
        $budgetCycleModel->update($budgetId, ['initial_income' => json_encode(array_values($updatedIncomeItems))]);

        return $this->respondDeleted(['message' => 'Income source removed successfully.']);
    }

    public function updateBudgetDates($budgetId)
    {
        $session = session();
        $userId = $session->get('userId');

        $rules = [
            'start_date' => 'required|valid_date[Y-m-d]',
            'end_date'   => 'required|valid_date[Y-m-d]',
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $budgetCycleModel = new BudgetCycleModel();
        $budgetCycle = $budgetCycleModel->where('id', $budgetId)->where('user_id', $userId)->first();

        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found or access denied.');
        }

        $startDate = $this->request->getVar('start_date');
        $endDate = $this->request->getVar('end_date');

        if (new DateTime($endDate) < new DateTime($startDate)) {
            return $this->failValidationErrors('End date must be after the start date.');
        }

        $data = [
            'start_date' => $startDate,
            'end_date' => $endDate,
        ];

        try {
            if ($budgetCycleModel->update($budgetId, $data) === false) {
                return $this->fail($budgetCycleModel->errors());
            }
            return $this->respondUpdated(['message' => 'Budget dates updated successfully.']);
        } catch (\Exception $e) {
            log_message('error', '[ERROR] {exception}', ['exception' => $e]);
            return $this->failServerError('Could not update budget dates.');
        }
    }

    public function closeCycle($budgetId)
    {
        $session = session();
        $userId = $session->get('userId');

        $budgetCycleModel = new BudgetCycleModel();
        $transactionModel = new TransactionModel();

        $budgetCycle = $budgetCycleModel->where('id', $budgetId)
                                        ->where('user_id', $userId)
                                        ->first();

        if (!$budgetCycle) {
            return $this->failNotFound('Budget cycle not found or access denied.');
        }

        if ($budgetCycle['status'] !== 'active') {
            return $this->failValidationErrors('This budget cycle is not active and cannot be closed.');
        }

        // Fetch transactions
        $transactions = $transactionModel->where('budget_cycle_id', $budgetId)
                                        ->where('user_id', $userId)
                                        ->findAll();

        $actualIncome = 0;
        $actualExpenses = 0;
        $spendingBreakdown = [];

        foreach ($transactions as $t) {
            if ($t['type'] === 'income') {
                $actualIncome += (float)$t['amount'];
            } else {
                $actualExpenses += (float)$t['amount'];
                $category = $t['category_name'];
                $spendingBreakdown[$category] = ($spendingBreakdown[$category] ?? 0) + (float)$t['amount'];
            }
        }

        arsort($spendingBreakdown);

        $initialIncome = json_decode($budgetCycle['initial_income'], true);
        $initialExpenses = json_decode($budgetCycle['initial_expenses'], true);

        $plannedIncome = array_reduce($initialIncome, fn($sum, $item) => $sum + (float)($item['amount'] ?? 0), 0);
        $plannedExpenses = array_reduce($initialExpenses, fn($sum, $item) => $sum + (float)($item['estimated_amount'] ?? 0), 0);

        // Fetch previous budget cycles for comparison (last 3 completed cycles)
        $previousCycles = $budgetCycleModel->where('user_id', $userId)
                                           ->where('status', 'completed')
                                           ->where('id !=', $budgetId)
                                           ->orderBy('end_date', 'DESC')
                                           ->findAll(3);

        $comparison = [];
        foreach ($previousCycles as $cycle) {
            $summary = json_decode($cycle['final_summary'], true) ?? [];
            $comparison[] = [
                'cycle_id' => $cycle['id'],
                'start_date' => $cycle['start_date'],
                'end_date' => $cycle['end_date'],
                'planned_surplus' => $summary['planned_surplus'] ?? 0,
                'actual_surplus' => $summary['actual_surplus'] ?? 0,
                'total_income' => $summary['total_income'] ?? 0,
                'total_expenses' => $summary['total_expenses'] ?? 0,
            ];
        }

        $finalSummary = [
            'plannedSurplus' => $plannedIncome - $plannedExpenses,
            'actualSurplus' => $actualIncome - $actualExpenses,
            'totalIncome' => $actualIncome,
            'totalExpenses' => $actualExpenses,
            'topSpendingCategories' => $spendingBreakdown, // Renamed from 'spending_breakdown'
            'previous_cycles' => $comparison,
            'deficit_advice' => $actualIncome < $actualExpenses ? [
            'message' => "Don't Panic, Let's Make a Plan!",
            'suggestions' => [
            'Review your top spending categories to identify potential cuts.',
            'Consider a side hustle like DoorDash or Uber for extra income.',
            'Avoid high-interest loans or predatory lending options.',
            'Reach out to bill providers to negotiate payment plans if needed.'
            ]
                ] : null
        ];

        $updateData = [
            'status' => 'completed',
            'final_summary' => json_encode($finalSummary)
        ];

        try {
            if ($budgetCycleModel->update($budgetId, $updateData) === false) {
                return $this->fail($budgetCycleModel->errors());
            }
            return $this->respondUpdated(['message' => 'Budget cycle has been successfully closed.', 'summary' => $finalSummary]);
        } catch (\Exception $e) {
            log_message('error', '[ERROR] {exception}', ['exception' => $e]);
            return $this->failServerError('Could not close budget cycle.');
        }
    }


    public function getDemographics()
    {
        $session = session();
        $userId = $session->get('userId');
        $userModel = new UserModel();

        $user = $userModel->find($userId);
        if (!$user) {
            return $this->failNotFound('User not found.');
        }

        $demographics = json_decode($user['demographics'], true) ?? [];
        return $this->respond($demographics);
    }

    public function setExperienceMode()
    {
        $session = session();
        $userId = $session->get('userId');
        $userModel = new UserModel();

        $rules = [
            'mode' => 'required|in_list[simple,guided]'
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $mode = $this->request->getVar('mode');

        try {
            $userModel->update($userId, ['experience_mode' => $mode]);
            return $this->respondUpdated(['message' => 'Experience mode updated successfully.']);
        } catch (\Exception $e) {
            log_message('error', '[ERROR] {exception}', ['exception' => $e]);
            return $this->failServerError('Could not update experience mode.');
        }
    }

    public function getExperienceMode()
    {
        $session = session();
        $userId = $session->get('userId');
        $userModel = new UserModel();

        $user = $userModel->find($userId);
        if (!$user) {
            return $this->failNotFound('User not found.');
        }

        return $this->respond(['mode' => $user['experience_mode'] ?? 'simple']);
    }


    public function getSavingsBalance()
    {
        $session = session();
        $userId = $session->get('userId');
        $userModel = new UserModel();

        $user = $userModel->find($userId);
        if (!$user) {
            return $this->failNotFound('User not found.');
        }

        $financialTools = json_decode($user['financial_tools'], true) ?? [];
        return $this->respond(['savings_balance' => $financialTools['savingsBalance'] ?? 0]);
    }

    
    public function initializeSavings()
    {
        // Add a try-catch block to capture any fatal error
        try {
            $session = session();
            $userId = $session->get('userId');

            $rules = [
                'hasSavings' => 'required|in_list[true,false]',
                'zipCode' => 'required|string|max_length[10]',
                'initialBalance' => 'permit_empty|decimal'
            ];

            if (!$this->validate($rules)) {
                return $this->fail($this->validator->getErrors());
            }

            $userModel = new UserModel();
            $toolsModel = new UserFinancialToolsModel();
            $historyModel = new SavingsHistoryModel();

            // 1. Update User's Zip Code
            $userModel->update($userId, ['demographic_zip_code' => $this->request->getVar('zipCode')]);

            // 2. Find or create the financial tools record
            $toolsRecord = $toolsModel->where('user_id', $userId)->first();
            if (!$toolsRecord) {
                $toolsModel->insert(['user_id' => $userId]);
                $toolsRecord = $toolsModel->where('user_id', $userId)->first();
            }

            $hasSavings = $this->request->getVar('hasSavings') === 'true';
            $initialBalance = (float)$this->request->getVar('initialBalance') ?: 0;
            
            $toolsData = ['has_savings_account' => $hasSavings];

            if ($hasSavings) {
                $toolsData['current_savings_balance'] = $initialBalance;
                
                if ($initialBalance > 0) {
                    $historyModel->insert([
                        'user_id' => $userId,
                        'balance' => $initialBalance
                    ]);
                }
            }
            
            $toolsModel->update($toolsRecord['id'], $toolsData);

            return $this->respondUpdated(['message' => 'Savings profile initialized successfully.']);

        } catch (\Throwable $e) {
            // If any error occurs, catch it and return it as a proper JSON response
            log_message('error', '[FATAL_ERROR] ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine());
            
            return $this->failServerError(
                'A server error occurred: ' . $e->getMessage(),
                500,
                'Error',
                ['file' => $e->getFile(), 'line' => $e->getLine()]
            );
        }
    }

    /**
     * Logs a new contribution to the user's savings.
     */
    public function logSavings()
    {
        $session = session();
        $userId = $session->get('userId');

        $rules = [
            'amount' => 'required|decimal|greater_than[0]'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $toolsModel = new UserFinancialToolsModel();
        $historyModel = new SavingsHistoryModel();
        
        $toolsRecord = $toolsModel->where('user_id', $userId)->first();

        if (!$toolsRecord || !$toolsRecord['has_savings_account']) {
            return $this->failValidationErrors('User does not have an active savings account setup.');
        }

        $amountToAdd = (float)$this->request->getVar('amount');
        $newBalance = (float)$toolsRecord['current_savings_balance'] + $amountToAdd;

        // 1. Log the new contribution
        $historyModel->insert([
            'user_id' => $userId,
            'balance' => $amountToAdd
        ]);

        // 2. Update the current balance
        $toolsModel->update($toolsRecord['id'], ['current_savings_balance' => $newBalance]);

        return $this->respondUpdated([
            'message' => 'Savings logged successfully.',
            'newBalance' => $newBalance
        ]);
    }
    
    public function getWizardSuggestions()
    {
        // Add a try-catch block to capture any fatal error
        try {
            $session = session();
            $userId = $session->get('userId');

            $incomeSourceModel = new IncomeSourceModel();
            $recurringExpenseModel = new RecurringExpenseModel();
            // FIX: Instantiate the model for spending categories
            $spendingCategoryModel = new LearnedSpendingCategoryModel();

            $incomeSources = $incomeSourceModel->where('user_id', $userId)->where('is_active', 1)->findAll();
            $recurringExpenses = $recurringExpenseModel->where('user_id', $userId)->where('is_active', 1)->findAll();
            // FIX: Fetch the spending categories from the database
            $spendingCategories = $spendingCategoryModel->where('user_id', $userId)->findAll();

            if (empty($incomeSources)) {
                return $this->failValidationErrors('User must have at least one income source to generate suggestions.');
            }

            // --- Calculate Proposed Dates ---
            $frequencies = array_column($incomeSources, 'frequency');
            $counts = array_count_values($frequencies);
            arsort($counts);
            $dominantFrequency = key($counts);

            $startDate = new DateTime();
            $endDate = new DateTime();

            switch ($dominantFrequency) {
                case 'weekly':
                    $endDate->modify('+1 week');
                    break;
                case 'bi-weekly':
                    $endDate->modify('+2 weeks');
                    break;
                case 'semi-monthly':
                    $endDate->modify('+15 days');
                    break;
                default:
                    $endDate->modify('+1 month');
                    break;
            }
            
            return $this->respond([
                'proposedStartDate' => $startDate->format('Y-m-d'),
                'proposedEndDate' => $endDate->format('Y-m-d'),
                'suggestedIncome' => $incomeSources,
                'suggestedExpenses' => $recurringExpenses,
                // FIX: Add the learned_spending_categories to the JSON response
                'learned_spending_categories' => $spendingCategories,
            ]);

        } catch (\Throwable $e) {
            // If any error occurs, catch it and return it as a proper JSON response
            log_message('error', '[FATAL_ERROR] ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine());
            
            return $this->failServerError(
                'A server error occurred: ' . $e->getMessage(),
                500,
                'Error',
                ['file' => $e->getFile(), 'line' => $e->getLine()]
            );
        }
    }
    
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
    
    public function createFromTemplate()
    {
        $session = session();
        $userId = $session->get('userId');
        if (!$userId) { return $this->failUnauthorized('User not logged in.'); }

        $json = $this->request->getJSON();
        $startDate = $json->start_date ?? null;
        $endDate = $json->end_date ?? null;
        if (!$startDate || !$endDate) { return $this->failValidationErrors('Start and end dates are required.'); }

        $incomeModel = new IncomeSourceModel();
        $expenseModel = new RecurringExpenseModel();
        $spendingCategoryModel = new LearnedSpendingCategoryModel();
        $budgetModel = new BudgetCycleModel();

        $incomeSources = $incomeModel->where('user_id', $userId)->where('is_active', 1)->findAll();
        $allRecurringExpenses = $expenseModel->where('user_id', $userId)->where('is_active', 1)->findAll();
        $learnedCategories = $spendingCategoryModel->where('user_id', $userId)->findAll();

        $start = new \DateTime($startDate);
        $end = new \DateTime($endDate);

        $filteredRecurring = array_filter($allRecurringExpenses, function($exp) use ($start, $end) {
            if (empty($exp['due_date'])) return false;
            $dueDateDay = (int)$exp['due_date'];
            $current = clone $start;
            while ($current <= $end) {
                if ((int)$current->format('d') === $dueDateDay) return true;
                $current->modify('+1 day');
            }
            return false;
        });

        // This mapping step is what correctly formats the bills for the budget
        $formattedRecurring = array_map(function($expense) {
            return array_merge($expense, [
                'type' => 'recurring',
                'estimated_amount' => '', // Amount is blank for user input
                'is_paid' => false
            ]);
        }, $filteredRecurring);

        $variableExpenses = array_map(function($category) {
            return ['id' => 'var-' . $category['id'], 'label' => $category['name'], 'type' => 'variable', 'estimated_amount' => ''];
        }, $learnedCategories);
        
        $formattedIncome = array_map(function($income) {
            return array_merge($income, ['amount' => '']);
        }, $incomeSources);

        $newBudgetId = $budgetModel->insert([
            'user_id' => $userId, 'start_date' => $startDate, 'end_date' => $endDate, 'status' => 'active',
            'initial_income' => json_encode(array_values($formattedIncome)),
            'initial_expenses' => json_encode(array_merge(array_values($formattedRecurring), $variableExpenses)),
            'final_summary' => null
        ]);

        if (!$newBudgetId) { return $this->failServerError('Could not create budget from template.'); }
        return $this->respondCreated(['id' => $newBudgetId]);
    }

    // --- NEW: Method to update a planned income amount ---
    public function updateInitialIncomeAmount($budgetId)
    {
        $session = session();
        $userId = $session->get('userId');
        $budgetModel = new BudgetCycleModel();
        $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) { return $this->failNotFound('Budget cycle not found.'); }

        $idToUpdate = $this->request->getVar('id');
        $newAmount = $this->request->getVar('amount');
        if (!is_numeric($newAmount)) { return $this->failValidationErrors('Amount must be a number.'); }

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
    
    public function updateRecurringExpenseAmount($budgetId)
    {
        $session = session();
        $userId = $session->get('userId');
        $budgetModel = new BudgetCycleModel();
        $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
        if (!$budget) { return $this->failNotFound('Budget cycle not found.'); }

        $idToUpdate = $this->request->getVar('id');
        $newAmount = $this->request->getVar('amount');
        if (!is_numeric($newAmount)) { return $this->failValidationErrors('Amount must be a number.'); }

        $expenseItems = json_decode($budget['initial_expenses'], true);
        $updated = false;
        foreach ($expenseItems as &$item) {
            if (isset($item['id']) && $item['id'] == $idToUpdate && $item['type'] === 'recurring') {
                $item['estimated_amount'] = $newAmount;
                $updated = true;
                break;
            }
        }

        if ($updated) {
            $budgetModel->update($budgetId, ['initial_expenses' => json_encode($expenseItems)]);
            return $this->respondUpdated(['message' => 'Expense amount updated.']);
        }
        return $this->fail('Recurring expense not found in this budget.');
    }
    
    public function setInitialIncomeAmount($budgetId)
{
    $session = session();
    $userId = $session->get('userId');
    $budgetModel = new BudgetCycleModel();
    $transactionModel = new TransactionModel();

    $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
    if (!$budget) { return $this->failNotFound('Budget cycle not found.'); }

    $idToUpdate = $this->request->getVar('id');
    $newAmount = $this->request->getVar('amount');
    if (!is_numeric($newAmount) || $newAmount <= 0) { 
        return $this->failValidationErrors('Amount must be a positive number.'); 
    }

    $incomeItems = json_decode($budget['initial_income'], true);
    $itemFound = false;
    $itemLabel = '';

    // Step 1: Update the amount in the initial_income JSON array
    foreach ($incomeItems as &$item) {
        if ($item['id'] == $idToUpdate) {
            $item['amount'] = $newAmount;
            $itemLabel = $item['label'];
            $itemFound = true;
            break;
        }
    }

    if (!$itemFound) {
        return $this->fail('Income item not found in this budget.');
    }

    $budgetModel->update($budgetId, ['initial_income' => json_encode($incomeItems)]);

    // Step 2: Log the corresponding transaction
    $transactionModel->logTransaction(
        $userId,
        $budgetId,
        'income',
        'Initial Income', // Use a consistent category
        (float)$newAmount,
        $itemLabel // Use the item's label as the description
    );

    return $this->respondUpdated(['message' => 'Income amount set and transaction logged.']);
}


}