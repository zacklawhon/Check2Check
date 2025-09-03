<?php

namespace App\Controllers\API;

use App\Controllers\API\BaseAPIController;
use App\Models\BudgetCycleModel;
use App\Services\BudgetService;
use CodeIgniter\API\ResponseTrait;

class BudgetItemController extends BaseAPIController
{
    use ResponseTrait;



    /***********************************************************
     *  
     * Item Getters
     * 
     ***********************************************************/
    public function getTransactionsForCycle($cycleId)
    {
        // This is a read operation, so no special partner permissions are needed.
        try {
            // 1. Controller calls the service to do the work.
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $transactions = $budgetService->getTransactionsForCycle($userId, (int)$cycleId);

            // 2. Controller returns the response.
            return $this->respond($transactions);

        } catch (\Exception $e) {
            // If the service throws an error (e.g., access denied), format the HTTP response.
            return $this->failNotFound($e->getMessage());
        }
    }

    public function getExpenseHistory()
    {
        // 1. Controller handles validation.
        $label = $this->request->getGet('label');
        if (!$label) {
            return $this->failValidationErrors('The "label" query parameter is required.');
        }

        try {
            // 2. Controller calls the service to fetch the data.
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $history = $budgetService->getExpenseHistory($userId, $label);

            // 3. Controller returns the response.
            return $this->respond($history);

        } catch (\Exception $e) {
            log_message('error', '[GET_EXPENSE_HISTORY_ERROR] ' . $e->getMessage());
            return $this->failServerError('Could not retrieve expense history.');
        }
    }

    /***********************************************************
     *  
     * Add/Remove Items to Active Budget Cycles
     * 
     ***********************************************************/

    public function addIncomeToCycle($cycleId)
    {
        // 1. Controller handles permissions and validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $rules = [
            'label'          => 'required|string',
            'amount'         => 'required|decimal',
            'date'           => 'required|valid_date[Y-m-d]',
            'frequency'      => 'permit_empty|string',
            'save_recurring' => 'permit_empty|in_list[1,0,true,false]'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $newIncome = [
            'label'     => $this->request->getVar('label'),
            'amount'    => $this->request->getVar('amount'),
            'date'      => $this->request->getVar('date'),
            'frequency' => $this->request->getVar('frequency') ?: 'one-time'
        ];
        $saveAsRecurring = filter_var($this->request->getVar('save_recurring'), FILTER_VALIDATE_BOOLEAN);

        // Handle partner requests.
        if ($permission === 'update_by_request') {
            $payload = array_merge($newIncome, ['save_recurring' => $saveAsRecurring]);
            $description = "Add income: '{$newIncome['label']}' for $" . number_format($newIncome['amount'], 2);
            return $this->handlePartnerAction('add_income', $description, $cycleId, $payload);
        }

        // 2. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $updatedBudget = $budgetService->addIncomeToCycle($userId, $cycleId, $newIncome, $saveAsRecurring);
            
            // 3. Controller returns the response.
            return $this->respondUpdated($updatedBudget);

        } catch (\Exception $e) {
            return $this->fail($e->getMessage());
        }
    }

    public function removeIncomeFromCycle($budgetId)
    {
        // 1. Controller handles permissions and validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $label = $this->request->getVar('label');
        if (empty($label)) {
            return $this->failValidationErrors('Label is required.');
        }

        // Handle partner requests.
        if ($permission === 'update_by_request') {
            $payload = ['label' => $label];
            $description = "Remove income source: '{$label}'";
            return $this->handlePartnerAction('remove_income', $description, $budgetId, $payload);
        }

        // 2. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $updatedBudget = $budgetService->removeIncomeFromCycle($userId, $budgetId, $label);

            // 3. Controller returns the response.
            return $this->respondDeleted($updatedBudget);
            
        } catch (\Exception $e) {
            return $this->fail($e->getMessage());
        }
    }


    public function addExpenseToCycle($cycleId)
    {
        // 1. Controller handles permissions and validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $rules = [
            'label'            => 'required|string',
            'estimated_amount' => 'required|decimal',
            'type'             => 'required|in_list[recurring,one-time]',
            'due_date'         => 'permit_empty|integer',
            'category'         => 'permit_empty|string',
            'save_recurring'   => 'permit_empty|in_list[1,0,true,false]'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        // 2. Controller gathers and prepares data.
        $expenseType = $this->request->getVar('type');
        $newExpense = [
            'label'            => $this->request->getVar('label'),
            'estimated_amount' => $this->request->getVar('estimated_amount'),
            'category'         => $this->request->getVar('category') ?? 'other',
            'type'             => $expenseType,
            'is_paid'          => false
        ];
        if ($expenseType === 'recurring') {
            $newExpense['due_date'] = $this->request->getVar('due_date');
        }
        $saveAsRecurring = filter_var($this->request->getVar('save_recurring'), FILTER_VALIDATE_BOOLEAN);

        // Handle partner requests.
        if ($permission === 'update_by_request') {
            $payload = array_merge($newExpense, ['save_recurring' => $saveAsRecurring]);
            $description = "Add bill: '{$newExpense['label']}' for $" . number_format($newExpense['estimated_amount'], 2);
            return $this->handlePartnerAction('add_expense', $description, $cycleId, $payload);
        }

        // 3. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $updatedBudget = $budgetService->addExpenseToCycle($userId, $cycleId, $newExpense, $saveAsRecurring);

            // 4. Controller returns the response.
            return $this->respondUpdated($updatedBudget);

        } catch (\Exception $e) {
            return $this->fail($e->getMessage());
        }
    }

    public function removeExpenseFromCycle($cycleId)
    {
        // 1. Controller handles permissions and validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $labelToRemove = $this->request->getVar('label');
        if (empty($labelToRemove)) {
            return $this->fail('Label is required.');
        }

        // Handle partner requests.
        if ($permission === 'update_by_request') {
            $payload = ['label' => $labelToRemove];
            $description = "Remove expense: '{$labelToRemove}'";
            return $this->handlePartnerAction('remove_expense', $description, $cycleId, $payload);
        }

        // 2. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $updatedBudget = $budgetService->removeExpenseFromCycle($userId, $cycleId, $labelToRemove);

            // 3. Controller returns the response.
            return $this->respondDeleted($updatedBudget);

        } catch (\Exception $e) {
            return $this->fail($e->getMessage());
        }
    }

    public function addVariableExpense($budgetId)
    {
        // 1. Controller handles permissions and validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $label = $this->request->getVar('label');
        $amount = $this->request->getVar('amount');
        if (!$label || !is_numeric($amount)) {
            return $this->failValidationErrors('Label and amount are required.');
        }

        // Handle partner requests.
        if ($permission === 'update_by_request') {
            $payload = ['label' => $label, 'amount' => $amount];
            $description = "Add variable expense '{$label}' for $" . number_format($amount, 2);
            return $this->handlePartnerAction('add_variable_expense', $description, $budgetId, $payload);
        }

        // 2. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $updatedBudget = $budgetService->addVariableExpense($userId, $budgetId, $label, (float)$amount);

            // 3. Controller returns the response.
            return $this->respondCreated($updatedBudget);

        } catch (\Exception $e) {
            return $this->fail($e->getMessage());
        }
    }

    public function createSpendingCategory()
    {
        // 1. Controller handles permissions and validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $data = $this->request->getJSON(true);
        $name = $data['name'] ?? null;
        if (empty($name)) {
            return $this->failValidationErrors('Category name is required.');
        }

        // 2. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $categoryId = $budgetService->createSpendingCategory($userId, $name);

            // 3. Controller returns the response.
            return $this->respondCreated(['id' => $categoryId, 'message' => 'Spending category saved.']);

        } catch (\Exception $e) {
            return $this->failServerError('Could not save spending category.');
        }
    }


    /***********************************************************
     * 
     *  Update Items in an Active Budget
     * 
     ***********************************************************/
    public function updateVariableExpenseAmount($cycleId)
    {
        // 1. Controller handles permissions and validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $rules = [
            'label' => 'required|string',
            'amount' => 'required|numeric'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $labelToUpdate = $this->request->getVar('label');
        $newAmount = (float) $this->request->getVar('amount');

        // Handle partner requests.
        if ($permission === 'update_by_request') {
            $payload = ['label' => $labelToUpdate, 'amount' => $newAmount];
            $description = "Update '{$labelToUpdate}' variable expense to $" . number_format($newAmount, 2);
            return $this->handlePartnerAction('update_variable_expense', $description, $cycleId, $payload);
        }

        // 2. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $updatedBudget = $budgetService->updateVariableExpenseAmount($userId, $cycleId, $labelToUpdate, $newAmount);

            // 3. Controller returns the response.
            return $this->respondUpdated($updatedBudget);

        } catch (\Exception $e) {
            return $this->fail($e->getMessage());
        }
    }

    public function adjustIncomeInCycle($budgetId)
    {
        // 1. Controller handles permissions and validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }
        
        $rules = [
            'label'      => 'required|string',
            'new_amount' => 'required|decimal'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $label = $this->request->getVar('label');
        $newAmount = (float) $this->request->getVar('new_amount');

        // Handle partner requests.
        if ($permission === 'update_by_request') {
            $payload = ['label' => $label, 'new_amount' => $newAmount];
            $description = "Adjust income '{$label}' to $" . number_format($newAmount, 2);
            return $this->handlePartnerAction('adjust_income', $description, $budgetId, $payload);
        }

        // 2. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $updatedBudget = $budgetService->adjustIncomeInCycle($userId, $budgetId, $label, $newAmount);

            // 3. Controller returns the response.
            return $this->respondUpdated($updatedBudget);

        } catch (\Exception $e) {
            return $this->fail($e->getMessage());
        }
    }

    public function updateInitialIncomeAmount($budgetId)
    {
        // 1. Controller handles permissions and validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $rules = [
            'id' => 'required|integer',
            'amount' => 'required|numeric'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $idToUpdate = (int)$this->request->getVar('id');
        $newAmount = (float)$this->request->getVar('amount');

        // Handle partner requests.
        if ($permission === 'update_by_request') {
            // This part needs to find the item's label for a user-friendly description.
            $userId = $this->getEffectiveUserId();
            $budgetModel = new BudgetCycleModel();
            $budget = $budgetModel->where('id', $budgetId)->where('user_id', $userId)->first();
            if (!$budget) {
                return $this->failNotFound('Budget cycle not found.');
            }

            $incomeItems = json_decode($budget['initial_income'], true);
            $itemLabel = '';
            foreach ($incomeItems as $item) {
                if (isset($item['id']) && $item['id'] == $idToUpdate) {
                    $itemLabel = $item['label'];
                    break;
                }
            }
            if (empty($itemLabel)) {
                 return $this->fail('Income item not found in this budget.');
            }

            $payload = ['id' => $idToUpdate, 'amount' => $newAmount];
            $description = "Update income '{$itemLabel}' to $" . number_format($newAmount, 2);
            return $this->handlePartnerAction('update_initial_income', $description, $budgetId, $payload);
        }

        // 2. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $budgetService->updateInitialIncomeAmount($userId, $budgetId, $idToUpdate, $newAmount);

            // 3. Controller returns the response.
            return $this->respondUpdated(['message' => 'Income amount updated.']);

        } catch (\Exception $e) {
            return $this->fail($e->getMessage());
        }
    }

    public function updateIncomeInCycle($budgetId)
    {
        // 1. Controller handles permissions and validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $rules = [
            'original_label' => 'required|string',
            'label'          => 'required|string',
            'amount'         => 'required|decimal'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $originalLabel = $this->request->getVar('original_label');
        $newLabel = $this->request->getVar('label');
        $newAmount = (float) $this->request->getVar('amount');

        // Handle partner requests.
        if ($permission === 'update_by_request') {
            $payload = [
                'original_label' => $originalLabel,
                'label'          => $newLabel,
                'amount'         => $newAmount
            ];
            $description = "Update income '{$originalLabel}' to '{$newLabel}' for $" . number_format($newAmount, 2);
            return $this->handlePartnerAction('update_income_in_cycle', $description, $budgetId, $payload);
        }

        // 2. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $updatedBudget = $budgetService->updateIncomeInCycle($userId, $budgetId, $originalLabel, $newLabel, $newAmount);
            
            // 3. Controller returns the response.
            return $this->respondUpdated($updatedBudget);

        } catch (\Exception $e) {
            return $this->fail($e->getMessage());
        }
    }

    public function updateRecurringExpenseInCycle($budgetId)
    {
        // 1. Controller handles permissions and validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $rules = [
            'label'            => 'required|string',
            'estimated_amount' => 'required|decimal',
            'due_date'         => 'permit_empty|integer|max_length[2]',
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $labelToUpdate = $this->request->getVar('label');
        $newAmount = (float) $this->request->getVar('estimated_amount');
        $newDueDate = $this->request->getVar('due_date');

        // Handle partner requests.
        if ($permission === 'update_by_request') {
            $payload = [
                'label'            => $labelToUpdate,
                'estimated_amount' => $newAmount,
                'due_date'         => $newDueDate
            ];
            $description = "Update '{$labelToUpdate}': set amount to $" . number_format($newAmount, 2);
            return $this->handlePartnerAction('update_recurring_expense', $description, $budgetId, $payload);
        }

        // 2. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $updatedBudget = $budgetService->updateRecurringExpenseInCycle($userId, $budgetId, $labelToUpdate, $newAmount, $newDueDate);

            // 3. Controller returns the response.
            return $this->respondUpdated($updatedBudget);

        } catch (\Exception $e) {
            return $this->fail($e->getMessage());
        }
    }


    /***********************************************************
     * 
     *  Item State Modifiers for an Active Budget
     * 
     ***********************************************************/

    public function markBillPaid($cycleId)
    {
        // 1. Controller handles permissions and web request validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $rules = [
            'label' => 'required|string',
            'amount' => 'required|decimal'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $labelToPay = $this->request->getVar('label');
        $amount = (float) $this->request->getVar('amount');

        // Handle partner requests before calling the service
        if ($permission === 'update_by_request') {
            $payload = ['label' => $labelToPay, 'amount' => $amount];
            $description = "Pay bill: '{$labelToPay}' for $" . number_format($amount, 2);
            return $this->handlePartnerAction('mark_bill_paid', $description, $cycleId, $payload);
        }

        // 2. Controller calls the service to do the actual work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $updatedBudget = $budgetService->markBillPaid($userId, $cycleId, $labelToPay, $amount);

            // 3. Controller returns the web response.
            return $this->respondUpdated($updatedBudget);

        } catch (\Exception $e) {
            // If the service throws an error, the controller formats the HTTP error response.
            return $this->fail($e->getMessage());
        }
    }

    public function markBillUnpaid($cycleId)
    {
        // 1. Controller handles permissions and validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $rules = ['label' => 'required|string'];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $labelToUnpay = $this->request->getVar('label');

        // Handle partner requests before calling the service.
        if ($permission === 'update_by_request') {
            $payload = ['label' => $labelToUnpay];
            $description = "Mark bill as unpaid: '{$labelToUnpay}'.";
            return $this->handlePartnerAction('mark_bill_unpaid', $description, $cycleId, $payload);
        }

        // 2. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $updatedBudget = $budgetService->markBillUnpaid($userId, $cycleId, $labelToUnpay);

            // 3. Controller returns the response.
            return $this->respondUpdated($updatedBudget);

        } catch (\Exception $e) {
            return $this->fail($e->getMessage());
        }
    }

    public function markIncomeReceived($budgetId)
    {
        // 1. Controller handles permissions and validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $rules = [
            'label'  => 'required|string',
            'amount' => 'required|decimal',
            'date'   => 'required|valid_date[Y-m-d]'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $label = $this->request->getVar('label');
        $actualAmount = (float) $this->request->getVar('amount');
        $date = $this->request->getVar('date');

        // Handle partner requests.
        if ($permission === 'update_by_request') {
            $payload = ['label' => $label, 'amount' => $actualAmount, 'date' => $date]; 
            $description = "Mark income '{$label}' as received for $" . number_format($actualAmount, 2);
            return $this->handlePartnerAction('mark_income_received', $description, $budgetId, $payload);
        }

        // 2. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $updatedBudget = $budgetService->markIncomeReceived($userId, $budgetId, $label, $actualAmount, $date);

            // 3. Controller returns the response.
            return $this->respondUpdated($updatedBudget);

        } catch (\Exception $e) {
            return $this->fail($e->getMessage());
        }
    }

    /**
     * Logs a transaction for a variable expense and returns the updated budget state.
     */
    public function logVariableExpense($cycleId)
    {
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }
        $rules = [
            'label' => 'required|string',
            'amount' => 'required|numeric',
            'description' => 'permit_empty|string'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }
        $label = $this->request->getVar('label');
        $amount = (float) $this->request->getVar('amount');
        $description = $this->request->getVar('description');
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $updatedState = $budgetService->logVariableExpenseTransaction($userId, $cycleId, $label, $amount, $description);
            return $this->respondUpdated($updatedState);
        } catch (\Exception $e) {
            return $this->failServerError($e->getMessage());
        }
    }


} //End of BudgetItemController