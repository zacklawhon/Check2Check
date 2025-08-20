<?php
// =================================================================
// FILE: /app/Controllers/API/BudgetController.php
// =================================================================

namespace App\Controllers\API;

use App\Controllers\API\BaseAPIController;
use App\Services\BudgetService;
use App\Services\UserService;
use CodeIgniter\API\ResponseTrait;
use DateTime;
use Exception;

class BudgetController extends BaseAPIController
{
    use ResponseTrait;

    public function createCycle()
    {
        // 1. Controller handles permissions and validation.
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('Partners are not allowed to create new budgets.');
        }

        $rules = [
            'start_date'          => 'required|valid_date[Y-m-d]',
            'end_date'            => 'required|valid_date[Y-m-d]',
            'income_sources'      => 'required|string',
            'recurring_expenses'  => 'required|string',
            'spending_categories' => 'required|string'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        // 2. Controller gathers and prepares data.
        try {
            $cycleData = [
                'start_date' => $this->request->getVar('start_date'),
                'end_date'   => $this->request->getVar('end_date'),
            ];
            $incomeSources = json_decode($this->request->getVar('income_sources'), true);
            $recurringExpenses = json_decode($this->request->getVar('recurring_expenses'), true);
            $spendingCategories = json_decode($this->request->getVar('spending_categories'), true);
            
            // 3. Controller calls the service to do the work.
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $budgetId = $budgetService->createCycle($userId, $cycleData, $incomeSources, $recurringExpenses, $spendingCategories);

            // 4. Controller returns the response.
            return $this->respondCreated(['id' => $budgetId, 'message' => 'Budget cycle created successfully.']);

        } catch (\Exception $e) {
            // If the service throws an error (e.g., "active budget exists"), format the HTTP response.
            // Using 409 for "Conflict" is appropriate here.
            if ($e->getMessage() === 'An active budget already exists.') {
                return $this->fail($e->getMessage(), 409);
            }
            log_message('error', '[CONTROLLER_ERROR_CREATE_CYCLE] ' . $e->getMessage());
            return $this->failServerError('Could not create budget cycle.');
        }
    }

    public function getCycles()
    {
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $cycles = $budgetService->getCycles($userId);

            return $this->respond($cycles);

        } catch (\Exception $e) {
            log_message('error', '[CONTROLLER_ERROR_GET_CYCLES] ' . $e->getMessage());
            return $this->failServerError('Could not retrieve budget cycles.');
        }
    }

    public function getCycleDetails($id)
    {
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $budgetCycle = $budgetService->getCycleDetails($userId, (int)$id);

            return $this->respond($budgetCycle);

        } catch (\Exception $e) {
            return $this->failNotFound($e->getMessage());
        }
    }

    public function getWizardSuggestions()
    {
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $suggestions = $budgetService->getWizardSuggestions($userId);

            return $this->respond($suggestions);

        } catch (\Exception $e) {
            log_message('error', '[CONTROLLER_ERROR_GET_WIZARD] ' . $e->getMessage());
            return $this->failServerError('Could not retrieve budget wizard suggestions.');
        }
    }

    public function closeCycle($id)
    {
        // 1. Controller handles permissions.
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('This action can only be performed by the budget owner.');
        }

        // 2. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $budgetService->closeCycle($userId, (int)$id);
            
            // 3. Controller returns the response.
            return $this->respond(['message' => 'Budget closed successfully.']);

        } catch (\Exception $e) {
            // Check for the specific "not found" error from the service.
            if ($e->getMessage() === 'Active budget cycle not found or access denied.') {
                return $this->failNotFound($e->getMessage());
            }
            return $this->failServerError('Could not close the budget cycle.');
        }
    }

    public function updateBudgetDates($budgetId)
    {
        // 1. Controller handles permissions and validation.
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        $rules = [
            'start_date' => 'required|valid_date[Y-m-d]',
            'end_date'   => 'required|valid_date[Y-m-d]',
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $startDate = $this->request->getVar('start_date');
        $endDate = $this->request->getVar('end_date');
        
        // Handle partner requests.
        if ($permission === 'update_by_request') {
            $payload = ['start_date' => $startDate, 'end_date' => $endDate];
            $description = "Change budget dates to {$startDate} through {$endDate}";
            return $this->handlePartnerAction('update_budget_dates', $description, $budgetId, $payload);
        }
        
        // 2. Controller calls the service to do the work.
        try {
            $userId = $this->getEffectiveUserId();
            $budgetService = new BudgetService();
            $budgetService->updateBudgetDates($userId, (int)$budgetId, $startDate, $endDate);

            // 3. Controller returns the response.
            return $this->respondUpdated(['message' => 'Budget dates updated successfully.']);

        } catch (\Exception $e) {
            // Check for the specific "not found" error from the service.
            if ($e->getMessage() === 'Budget cycle not found or access denied.') {
                return $this->failNotFound($e->getMessage());
            }
            return $this->failServerError('Could not update budget dates.');
        }
    }

    public function projectIncome()
    {
        // 1. Controller handles validation.
        $json = $this->request->getJSON(true);
        $rules = $json['income_rules'] ?? [];
        $startDate = $json['start_date'] ?? '';
        $endDate = $json['end_date'] ?? '';

        if (empty($startDate) || empty($endDate) || empty($rules)) {
            return $this->failValidationErrors('Start date, end date, and income rules are required.');
        }

        // 2. Controller calls the service to do the work.
        try {
            $budgetService = new BudgetService();
            $projectedIncome = $budgetService->projectIncome($startDate, $endDate, $rules);

            // 3. Controller returns the response.
            return $this->respond($projectedIncome);

        } catch (\Exception $e) {
            log_message('error', '[CONTROLLER_ERROR_PROJECT_INCOME] ' . $e->getMessage());
            return $this->failServerError('Could not project income.');
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
            $userService = new UserService();
            $categoryId = $userService->createSpendingCategory($userId, $name);
            
            // 3. Controller returns the response.
            return $this->respondCreated(['id' => $categoryId, 'message' => 'Spending category saved.']);

        } catch (\Exception $e) {
            return $this->failServerError('Could not save spending category.');
        }
    }



} // End of Budget Controller