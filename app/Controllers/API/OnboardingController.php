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

    private function getUserId()
    {
        return session()->get('userId');
    }

    // In OnboardingController.php

    public function addIncomeSource()
    {
        $session = session();
        $userId = $session->get('userId');
        $incomeModel = new \App\Models\IncomeSourceModel();

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

    public function getOnboardingData()
    {
        $session = session();
        $userId = $session->get('userId');

        if (!$userId) {
            return $this->failUnauthorized('User not logged in.');
        }

        $incomeModel = new \App\Models\IncomeSourceModel();
        $expenseModel = new \App\Models\RecurringExpenseModel();
        // BUG FIX: Add the model for spending categories
        $spendingModel = new \App\Models\LearnedSpendingCategoryModel();

        $data = [
            'income_sources' => $incomeModel->where('user_id', $userId)->where('is_active', 1)->findAll(),
            'recurring_expenses' => $expenseModel->where('user_id', $userId)->where('is_active', 1)->findAll(),
            // BUG FIX: Fetch and return the learned_spending_categories
            'learned_spending_categories' => $spendingModel->where('user_id', $userId)->findAll(),
        ];

        return $this->respond($data);
    }
}
