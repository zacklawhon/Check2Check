<?php
// =================================================================
// File: /app/Controllers/API/OnboardingController.php
// =================================================================
namespace App\Controllers\API;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;
use App\Models\IncomeSourceModel;
use App\Models\RecurringExpenseModel;
use App\Models\LearnedSpendingCategoryModel;
use App\Models\UserFinancialToolModel;
use App\Models\SavingsHistoryModel;

class OnboardingController extends BaseController
{
    use ResponseTrait;

    /**
     * Retrieves the authenticated user’s ID from the session.
     *
     * A helper method to centralize session access for user ID retrieval, used by multiple
     * methods to avoid repetitive session calls. No redundancy, as it’s a simple utility.
     *
     * @return int|null The user’s ID or null if not authenticated.
     */
    private function getUserId()
    {
        return session()->get('userId');
    }

    /**
     * Adds or finds an income source for the user during onboarding.
     *
     * Saves an income source (label, frequency) to IncomeSourceModel using a custom findOrCreate
     * method. Similar to BudgetController::addIncomeToCycle, which also saves to IncomeSourceModel
     * but is budget-specific. The findOrCreate method likely centralizes duplicate checking, reducing
     * redundancy. No internal redundancy within the controller.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a 201 response with the income source ID if saved,
     * or a 500 error if insertion fails.
     */
    public function addIncomeSource()
    {
        $session = session();
        $userId = $session->get('userId');
        $incomeModel = new IncomeSourceModel();

        $data = [
            'label' => $this->request->getVar('label'),
            'frequency' => $this->request->getVar('frequency')
        ];

        $newId = $incomeModel->findOrCreate($userId, $data);

        if (!$newId) {
            return $this->failServerError('Could not save income source.');
        }

        return $this->respondCreated(['id' => $newId, 'message' => 'Income source saved.']);
    }

    /**
     * Adds a recurring expense for the user during onboarding.
     *
     * Saves a recurring expense (label, due date, category) to RecurringExpenseModel, with additional
     * fields for loan or credit card categories (e.g., principal_balance, interest_rate). Similar to
     * BudgetController::addExpenseToCycle, which also saves to RecurringExpenseModel but is budget-specific
     * and updates initial_expenses JSON. The distinct onboarding context and category-specific fields
     * justify separation. No internal redundancy within the controller.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a 201 response with the expense ID if saved,
     * or a validation error if insertion fails.
     */
    public function addRecurringExpense()
    {
        $session = session();
        $userId = $session->get('userId');
        $json = $this->request->getJSON(true);

        // Basic data common to all expense types
        $data = [
            'user_id' => $userId,
            'label' => $json['label'],
            'due_date' => $json['dueDate'] ?? null,
            'category' => $json['category'] ?? 'other'
        ];

        // FIX: Add category-specific fields based on the request
        if ($data['category'] === 'loan') {
            $data['principal_balance'] = $json['principal_balance'] ?? null;
            $data['interest_rate'] = $json['interest_rate'] ?? null;
            $data['maturity_date'] = $json['maturity_date'] ?? null;
        } elseif ($data['category'] === 'credit-card') {
            $data['outstanding_balance'] = $json['outstanding_balance'] ?? null;
            $data['interest_rate'] = $json['interest_rate'] ?? null;
        }

        $model = new RecurringExpenseModel();

        if ($model->insert($data)) {
            $id = $model->getInsertID();
            return $this->respondCreated(['id' => $id, 'message' => 'Expense added.']);
        } else {
            return $this->fail($model->errors());
        }
    }

    /**
     * Adds a spending category for the user during onboarding.
     *
     * Saves a spending category to LearnedSpendingCategoryModel, checking for duplicates to avoid redundancy.
     * Similar to BudgetController::addVariableExpense, which also saves to LearnedSpendingCategoryModel
     * but is budget-specific and updates initial_expenses JSON. A shared duplicate-checking helper could
     * streamline both methods, but the onboarding context justifies separation. No internal redundancy.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a 201 response with the category ID if saved,
     * a success response if the category already exists, or a validation error if insertion fails.
     */
    public function addSpendingCategory()
    {
        $data = $this->request->getJSON(true);
        $model = new LearnedSpendingCategoryModel();
        $data['user_id'] = $this->getUserId();

        // Avoid duplicates
        $exists = $model->where('user_id', $data['user_id'])->where('name', $data['name'])->first();
        if ($exists) {
            return $this->respond(['status' => 'success', 'message' => 'Category already exists.']);
        }

        if ($model->save($data)) {
            return $this->respondCreated(['status' => 'success', 'id' => $model->getInsertID()]);
        }
        return $this->fail($model->errors());
    }

    /**
     * Updates or creates the user’s financial tools profile during onboarding.
     *
     * Updates UserFinancialToolModel with checking, savings, and credit card status, and logs savings balance
     * to SavingsHistoryModel if provided, using a transaction for consistency. Similar to BudgetController::logSavings
     * and BudgetController::addSavings, which also update savings balance and log to SavingsHistoryModel or
     * TransactionModel. A shared savings logging helper could reduce duplication, but the onboarding context
     * (broader financial tool setup) justifies separation. No internal redundancy.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if updated, or a 500 error if the transaction fails.
     */
    public function updateFinancialTools()
    {
        $data = $this->request->getJSON(true);
        $userId = $this->getUserId();

        $toolsModel = new UserFinancialToolModel();
        $savingsModel = new SavingsHistoryModel();

        // Use transaction to ensure both operations succeed or fail together
        $toolsModel->db->transStart();

        $toolsData = [
            'has_checking_account' => $data['has_checking_account'] ?? false,
            'has_savings_account' => $data['has_savings_account'] ?? false,
            'has_credit_card' => $data['has_credit_card'] ?? false,
        ];

        // Find existing record or create new
        $existing = $toolsModel->where('user_id', $userId)->first();
        if ($existing) {
            $toolsModel->update($existing['id'], $toolsData);
        } else {
            $toolsData['user_id'] = $userId;
            $toolsModel->insert($toolsData);
        }

        // If savings balance is provided, log it
        if (isset($data['savings_balance']) && is_numeric($data['savings_balance'])) {
            $savingsModel->insert([
                'user_id' => $userId,
                'balance' => $data['savings_balance']
            ]);
        }

        $toolsModel->db->transComplete();

        if ($toolsModel->db->transStatus() === false) {
            return $this->failServerError('Could not update financial tools.');
        }

        return $this->respond(['status' => 'success', 'message' => 'Financial tools updated.']);
    }

    /**
     * Retrieves onboarding data for the authenticated user.
     *
     * Fetches active income sources, recurring expenses, and learned spending categories from their respective
     * models. Similar to BudgetController::getWizardSuggestions, which also queries these models but includes
     * date calculations for budget setup. The onboarding-specific focus (data display vs. budget suggestions)
     * justifies separation. No internal redundancy within the controller.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a JSON response with onboarding data or a 401 error if the user is not logged in.
     */
    public function getOnboardingData()
    {
        $session = session();
        $userId = $session->get('userId');

        if (!$userId) {
            return $this->failUnauthorized('User not logged in.');
        }

        $incomeModel = new IncomeSourceModel();
        $expenseModel = new RecurringExpenseModel();
        // BUG FIX: Add the model for spending categories
        $spendingModel = new LearnedSpendingCategoryModel();

        $data = [
            'income_sources' => $incomeModel->where('user_id', $userId)->where('is_active', 1)->findAll(),
            'recurring_expenses' => $expenseModel->where('user_id', $userId)->where('is_active', 1)->findAll(),
            // BUG FIX: Fetch and return the learned_spending_categories
            'learned_spending_categories' => $spendingModel->where('user_id', $userId)->findAll(),
        ];

        return $this->respond($data);
    }
}