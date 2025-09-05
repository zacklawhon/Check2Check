<?php
// =================================================================
// app/Controllers/API/UserController.php
// =================================================================
namespace App\Controllers\API;

// 1. EXTEND THE NEW BASE API CONTROLLER
use App\Controllers\API\BaseAPIController;
use App\Models\TransactionModel;
use App\Models\BudgetCycleModel;
use App\Models\IncomeSourceModel;
use App\Models\RecurringExpenseModel;
use App\Models\LearnedSpendingCategoryModel;
use App\Models\UserAccountModel;
use App\Models\UserFinancialToolsModel;
use App\Models\UserGoalModel;
use App\Models\UserModel;

use CodeIgniter\API\ResponseTrait;

class UserController extends BaseAPIController
{
    use ResponseTrait;

    /**
     * Retrieves the logged-in user’s profile data, including owner's stats if they are a partner.
     */
    public function getProfile()
    {
        $session = session();
        $userId = $session->get('userId'); // Always get the currently logged-in user's ID here

        $userModel = new UserModel();
        $user = $userModel->find($userId);

        if (!$user) {
            return $this->failNotFound('User not found.');
        }

        // 2. USE THE EFFECTIVE USER ID FOR FETCHING SHARED DATA (like budget stats)
        $effectiveUserId = $this->getEffectiveUserId();

        $budgetModel = new BudgetCycleModel();
        $completedCount = $budgetModel->where('user_id', $effectiveUserId)
            ->where('status', 'completed')
            ->countAllResults();

        $user['completed_budget_count'] = $completedCount;
        
        // Add permission level to the user object for the frontend
        $user['permission_level'] = $this->getPermissionLevel();
        $user['is_partner'] = !empty($user['owner_user_id']);

        return $this->respond($user);
    }
    
    /**
     * Retrieves the user’s active budget cycle.
     */
    public function getActiveBudget()
{
    try {
        $userId = $this->getEffectiveUserId();
        
        // 1. Instantiate the BudgetService
        $budgetService = new \App\Services\BudgetService();

        // 2. Call the new service method to get the active budget
        $activeBudget = $budgetService->getActiveBudgetForUser($userId);

        // 3. This ensures a valid JSON response (the budget object or 'null') is always sent
        return $this->response->setJSON($activeBudget);

    } catch (\Exception $e) {
        log_message('error', '[CONTROLLER_ERROR_GET_ACTIVE_BUDGET] ' . $e->getMessage());
        return $this->failServerError('Could not retrieve active budget.');
    }
}

    public function freshStart()
    {
        // 4. ADD A SECURITY CHECK to ensure only owners can use this feature
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('Partners are not allowed to perform this action.');
        }

        $userId = session()->get('userId'); // This action applies to the actual logged-in user

        if (!$userId) {
            return $this->failUnauthorized('Authentication required.');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        try {
            (new TransactionModel())->where('user_id', $userId)->delete();
            (new BudgetCycleModel())->where('user_id', $userId)->delete();
            (new IncomeSourceModel())->where('user_id', $userId)->delete();
            (new RecurringExpenseModel())->where('user_id', $userId)->delete();
            (new LearnedSpendingCategoryModel())->where('user_id', $userId)->delete();
            (new UserAccountModel())->where('user_id', $userId)->delete();
            (new UserGoalModel())->where('user_id', $userId)->delete();
            (new UserFinancialToolsModel())->where('user_id', $userId)->delete();

            $db->transComplete();

            if ($db->transStatus() === false) {
                throw new \Exception('Database transaction failed during fresh start.');
            }

            return $this->respondDeleted(['message' => 'Your account has been reset.']);
        } catch (\Exception $e) {
            log_message('error', '[FRESH_START_ERROR] ' . $e->getMessage());
            return $this->failServerError('Could not reset your account at this time.');
        }
    }

    public function updateDemographics()
    {
        $userId = session()->get('userId');
        $data = $this->request->getJSON(true);

        $allowedFields = [
            'zip_code' => $data['zip_code'] ?? null,
            'age_range' => $data['age_range'] ?? null,
            'sex' => $data['sex'] ?? null,
            'household_size' => $data['household_size'] ?? null
        ];

        $userModel = new UserModel();
        $userModel->update($userId, $allowedFields);

        return $this->respond(['status' => 'success', 'message' => 'Demographics updated.']);
    }

    public function dismissAccountsPrompt()
    {
        $userId = session()->get('userId');
        $userModel = new UserModel();

        if ($userModel->update($userId, ['has_seen_accounts_prompt' => 1])) {
            return $this->respondUpdated(['message' => 'Prompt dismissed.']);
        }

        return $this->failServerError('Could not update user profile.');
    }
}
