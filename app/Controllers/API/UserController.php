<?php
// =================================================================
// app/Controllers/API/UserController.php
// =================================================================
namespace App\Controllers\API;

use App\Controllers\BaseController;
use App\Models\UserModel;
use App\Models\UserFinancialToolsModel;
use CodeIgniter\API\ResponseTrait;

class UserController extends BaseController
{
    use ResponseTrait;

    protected $session;

    public function __construct()
    {
        $this->session = session();
    }

    private function getUserId()
    {
        return $this->session->get('userId');
    }

    // This method gets the logged-in user's profile data
    public function getProfile()
    {
        $session = session();
        $userId = $session->get('userId');

        $userModel = new \App\Models\UserModel();
        $user = $userModel->find($userId);

        if (!$user) {
            return $this->failNotFound('User not found.');
        }
    
        // --- FIX: Add logic to count completed budgets ---
        $budgetModel = new \App\Models\BudgetCycleModel();
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
}
