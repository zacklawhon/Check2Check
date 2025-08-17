<?php
// =================================================================
// app/Controllers/API/UserController.php
// =================================================================
namespace App\Controllers\API;

use App\Controllers\BaseController;
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

class UserController extends BaseController
{
    use ResponseTrait;

    /**
     * @var \CodeIgniter\Session\Session The session instance for accessing user data.
     */
    protected $session;

    /**
     * Initializes the controller with a session instance.
     *
     * Sets up the session for use in retrieving the authenticated user’s ID. No redundancy,
     * as it’s a standard constructor for session-based controllers.
     */
    public function __construct()
    {
        $this->session = session();
    }

    /**
     * Retrieves the authenticated user’s ID from the session.
     *
     * A helper method to centralize session access for user ID retrieval, used by updateDemographics.
     * Similar to OnboardingController::getUserId but too simple to be redundant.
     *
     * @return int|null The user’s ID or null if not authenticated.
     */
    private function getUserId()
    {
        return $this->session->get('userId');
    }

    /**
     * Retrieves the logged-in user’s profile data.
     *
     * Fetches user details from UserModel, counts completed budgets from BudgetCycleModel, and
     * excludes sensitive data (password hash). No redundancy within the controller or with other
     * controllers, as profile retrieval with budget stats is unique.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a JSON response with user data and completed
     * budget count, or a 404 error if the user is not found.
     */
    public function getProfile()
    {
        $session = session();
        $userId = $session->get('userId');

        $userModel = new UserModel();
        $user = $userModel->find($userId);

        if (!$user) {
            return $this->failNotFound('User not found.');
        }

        // --- FIX: Add logic to count completed budgets ---
        $budgetModel = new BudgetCycleModel();
        $completedCount = $budgetModel->where('user_id', $userId)
            ->where('status', 'completed')
            ->countAllResults();

        // Add the count to the user data we send back
        $user['completed_budget_count'] = $completedCount;
        // --- End of FIX ---

        // Don't send the password hash to the frontend
        unset($user['password_hash']);

        return $this->respond($user);
    }

    /**
     * Updates the user’s demographic data.
     *
     * Updates allowed demographic fields (zip code, age range, sex, household size) in UserModel.
     * Shares demographic_zip_code update with updateFinancialProfile and BudgetController::initializeSavingsProfile,
     * but distinct purpose (general demographics vs. financial/savings setup) prevents redundancy.
     * A shared helper for UserModel updates could streamline minor overlap.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if updated.
     */
    public function updateDemographics()
    {
        $userId = $this->getUserId();
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

    /**
     * Updates the user’s financial profile, including zip code and financial tools.
     *
     * Validates input, updates demographic_zip_code in UserModel, and updates or creates a
     * UserFinancialToolsModel record for checking, savings, and credit card accounts using a transaction.
     * Similar to OnboardingController::updateFinancialTools and BudgetController::initializeSavingsProfile,
     * which also update UserFinancialToolsModel and zip code (for the latter). Distinct context
     * (profile management vs. onboarding/savings setup) and input format justify separation. A shared
     * helper for UserFinancialToolsModel updates could reduce duplication across controllers.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if updated, a validation error
     * for invalid input, or a 500 error if the transaction fails.
     */
    public function updateFinancialProfile()
    {
        $session = session();
        $userId = $session->get('userId');

        $rules = [
            'zip_code' => 'permit_empty|string|max_length[10]',
            'financial_tools' => 'permit_empty|is_array'
        ];
        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $db = \Config\Database::connect();
        $db->transStart();

        try {
            $userModel = new UserModel();
            $zipCode = $this->request->getVar('zip_code');
            if ($zipCode !== null) {
                $userModel->update($userId, ['demographic_zip_code' => $zipCode]);
            }

            $toolsModel = new UserFinancialToolsModel();
            $tools = $this->request->getVar('financial_tools') ?? [];

            $toolsData = [
                'user_id' => $userId,
                'has_checking_account' => in_array('checking_account', $tools),
                'has_savings_account' => in_array('savings_account', $tools),
                'has_credit_card' => in_array('credit_card', $tools),
            ];

            // Check if a record already exists
            $existingTools = $toolsModel->where('user_id', $userId)->first();
            if ($existingTools) {
                $toolsModel->update($existingTools['id'], $toolsData);
            } else {
                $toolsModel->insert($toolsData);
            }

            $db->transComplete();

            if ($db->transStatus() === false) {
                return $this->failServerError('Database transaction failed.');
            }

            return $this->respondUpdated(['message' => 'Financial profile updated successfully.']);

        } catch (\Exception $e) {
            log_message('error', '[ERROR] {exception}', ['exception' => $e]);
            return $this->failServerError('Could not update financial profile.');
        }
    }

    /**
     * Retrieves the user’s active budget cycle.
     *
     * Fetches the active budget from BudgetCycleModel, returning null if none exists. Similar to
     * BudgetController::getCycles, which retrieves all budgets, but optimized for fetching a single
     * active budget, making it complementary rather than redundant. No internal redundancy within
     * the controller.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a JSON response with the active budget or null,
     * or a 401 error if the user is not logged in.
     */
    public function getActiveBudget()
    {
        $session = session();
        $userId = $session->get('userId');
        if (!$userId) {
            return $this->failUnauthorized('Not logged in.');
        }

        $budgetModel = new BudgetCycleModel();
        $activeBudget = $budgetModel->where('user_id', $userId)
            ->where('status', 'active')
            ->first();

        // This returns the budget data if found, or 'null' if not found,
        // both with a 200 OK status, which prevents the console error.
        return $this->respond($activeBudget);
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

    public function freshStart()
    {
        $userId = $this->getUserId(); // Uses the existing private helper method

        if (!$userId) {
            return $this->failUnauthorized('Authentication required.');
        }

        $db = \Config\Database::connect();
        $db->transStart();

        try {
            // Now also deleting transactions
            (new TransactionModel())->where('user_id', $userId)->delete();

            // Delete data from all other relevant tables
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


} //End of Controller