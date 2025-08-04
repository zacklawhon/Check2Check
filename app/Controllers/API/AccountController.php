<?php
namespace App\Controllers\API;

use App\Controllers\BaseController;
use CodeIgniter\API\ResponseTrait;
use App\Models\IncomeSourceModel;
use App\Models\RecurringExpenseModel;
use App\Models\UserModel;
use App\Models\UserFinancialToolsModel;
use Config\Services;

class AccountController extends BaseController
{
    use ResponseTrait;

    /**
     * Fetches all saved recurring income and expense templates for the user.
     */
    public function getRecurringItems()
    {
        $session = session();
        $userId = $session->get('userId');

        $incomeModel = new IncomeSourceModel();
        $expenseModel = new RecurringExpenseModel();

        $data = [
            'income_sources' => $incomeModel->where('user_id', $userId)->where('is_active', 1)->findAll(),
            'recurring_expenses' => $expenseModel->where('user_id', $userId)->where('is_active', 1)->findAll(),
        ];
        
        return $this->respond($data);
    }
    
    public function deleteIncomeSource($id)
    {
        $session = session();
        $userId = $session->get('userId');
        $model = new IncomeSourceModel();

        $item = $model->where('id', $id)->where('user_id', $userId)->first();
        if (!$item) {
            return $this->failNotFound('Income source not found.');
        }

        // FIX: Instead of deleting, we update the is_active flag to 0
        if ($model->update($id, ['is_active' => 0])) {
            return $this->respondDeleted(['message' => 'Income source deactivated successfully.']);
        }
        
        return $this->failServerError('Could not deactivate income source.');
    }
    
    public function deleteRecurringExpense($id)
    {
        $session = session();
        $userId = $session->get('userId');
        $model = new RecurringExpenseModel();

        $item = $model->where('id', $id)->where('user_id', $userId)->first();
        if (!$item) {
            return $this->failNotFound('Recurring expense not found.');
        }

        // FIX: Instead of deleting, we update the is_active flag to 0
        if ($model->update($id, ['is_active' => 0])) {
            return $this->respondDeleted(['message' => 'Recurring expense deactivated successfully.']);
        }

        return $this->failServerError('Could not deactivate recurring expense.');
    }
    
    public function updateIncomeSource($id)
    {
        $session = session();
        $userId = $session->get('userId');
        $model = new IncomeSourceModel();

        $item = $model->where('id', $id)->where('user_id', $userId)->first();
        if (!$item) {
            return $this->failNotFound('Income source not found.');
        }

        $json = $this->request->getJSON(true);
        $data = [
            'label' => $json['label'],
            'frequency' => $json['frequency'],
        ];

        if ($model->update($id, $data)) {
            return $this->respondUpdated(['message' => 'Income source updated successfully.']);
        }
        return $this->fail($model->errors());
    }

    /**
     * Updates a recurring expense.
     */
    public function updateRecurringExpense($id)
    {
        $session = session();
        $userId = $session->get('userId');
        $model = new RecurringExpenseModel();

        $item = $model->where('id', $id)->where('user_id', $userId)->first();
        if (!$item) {
            return $this->failNotFound('Recurring expense not found.');
        }

        $json = $this->request->getJSON(true);
        $data = [
            'label' => $json['label'],
            'due_date' => $json['due_date'] ?? null,
            'category' => $json['category'] ?? 'other',
            'principal_balance' => $json['principal_balance'] ?? null,
            'interest_rate' => $json['interest_rate'] ?? null,
            'outstanding_balance' => $json['outstanding_balance'] ?? null,
            'maturity_date' => $json['maturity_date'] ?? null,
        ];

        if ($model->update($id, $data)) {
            return $this->respondUpdated(['message' => 'Recurring expense updated successfully.']);
        }
        return $this->fail($model->errors());
    }
    
    public function updateProfile()
    {
        $session = session();
        $userId = $session->get('userId');
        $userModel = new UserModel();

        $rules = [
            'demographic_zip_code' => 'permit_empty|string|max_length[10]',
            'demographic_age_range' => 'permit_empty|string',
            'demographic_sex' => 'permit_empty|string',
            'demographic_household_size' => 'permit_empty|integer',
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $dataToSave = [
            'demographic_zip_code' => $this->request->getVar('demographic_zip_code'),
            'demographic_age_range' => $this->request->getVar('demographic_age_range'),
            'demographic_sex' => $this->request->getVar('demographic_sex'),
            'demographic_household_size' => $this->request->getVar('demographic_household_size'),
        ];

        try {
            if ($userModel->update($userId, $dataToSave) === false) {
                return $this->fail($userModel->errors());
            }
            return $this->respondUpdated(['message' => 'Profile updated successfully.']);
        } catch (\Exception $e) {
            log_message('error', '[ERROR_UPDATE_PROFILE] {exception}', ['exception' => $e]);
            return $this->failServerError('Could not update profile.');
        }
    }
    
    public function setExperienceMode()
{
    $userId = session()->get('userId');
    $mode = $this->request->getJsonVar('mode');

    // FIX: Add 'power' to the list of valid modes and reject any invalid value.
    if (!in_array($mode, ['guided', 'power'])) {
        return $this->failValidationErrors('Invalid experience mode provided.');
    }

    $userModel = new \App\Models\UserModel();
    
    try {
        if ($userModel->update($userId, ['experience_mode' => $mode]) === false) {
            return $this->fail($userModel->errors());
        }
        return $this->respond(['status' => 'success', 'message' => 'Experience mode updated.']);
    } catch (\Exception $e) {
        log_message('error', 'Error in setExperienceMode: ' . $e->getMessage());
        return $this->failServerError('An unexpected error occurred while updating your settings.');
    }
}
    
    public function updateFinancialTools()
    {
        $userId = session()->get('userId');
        $json = $this->request->getJSON(true);
        $toolsModel = new UserFinancialToolsModel();

        $data = [
            'has_checking_account' => $json['has_checking_account'] ?? false,
            'has_savings_account' => $json['has_savings_account'] ?? false,
            'has_credit_card' => $json['has_credit_card'] ?? false,
            'savings_goal' => $json['savings_goal'] ?? 2000.00,
        ];

        $record = $toolsModel->where('user_id', $userId)->first();
        if (!$record) {
            return $this->failNotFound('User financial tools profile not found.');
        }

        if ($toolsModel->update($record['id'], $data)) {
            return $this->respondUpdated(['message' => 'Financial tools updated successfully.']);
        }
        
        return $this->fail($toolsModel->errors());
    }
    
    public function getFinancialTools()
    {
        $userId = session()->get('userId');
        $toolsModel = new UserFinancialToolsModel();
        $tools = $toolsModel->where('user_id', $userId)->first();
        if (!$tools) {
            // Create a default record if one doesn't exist
            $toolsModel->insert(['user_id' => $userId]);
            $tools = $toolsModel->where('user_id', $userId)->first();
        }
        return $this->respond($tools);
    }
    
    public function requestEmailChange()
    {
    $session = Services::session();
    $userId = $session->get('userId');
    $userModel = new UserModel();

    $rules = [
        'new_email' => 'required|valid_email|is_unique[users.email,id,'.$userId.']'
    ];
    $messages = [
        'new_email' => [
            'is_unique' => 'This email address is already in use by another account.',
            'valid_email' => 'Please provide a valid email address.'
        ]
    ];

    if (!$this->validate($rules, $messages)) {
        return $this->failValidationErrors($this->validator->getErrors());
    }

    $user = $userModel->find($userId);
    if (!$user) { return $this->failNotFound('User not found.'); }

    $newEmail = $this->request->getVar('new_email');
    $token = bin2hex(random_bytes(32));

    $session->setTempdata('email_change_token', $token, 900);
    $session->setTempdata('new_email_for_change', $newEmail, 900);

    $verificationLink = 'https://check2check.org/verify-email-change/' . $token;

    try {
        $email = Services::email();
        $email->setTo($user['email']);
        $email->setSubject('Confirm Your Email Change for Check2Check.org');
        
        // --- FIX: Pass the new email address to the template ---
        $emailData = [
            'verificationLink' => $verificationLink,
            'newEmail' => $newEmail // <-- Add this line
        ];
        $message = view('emails/email_change_request', $emailData);
        $email->setMessage($message);

        if (!$email->send()) {
            log_message('error', '[EMAIL_SEND_FAIL] ' . $email->printDebugger(['headers']));
            return $this->failServerError('Could not send verification email.');
        }

        return $this->respond(['message' => 'Verification email sent to your original email address.']);
    } catch (\Exception $e) {
        log_message('error', '[ERROR_EMAIL_REQ] {exception}', ['exception' => $e]);
        return $this->failServerError('An unexpected error occurred.');
    }
    }
    
    public function verifyEmailChange($token = null)
{
    $session = Services::session();
    $userId = $session->get('userId');
    $userModel = new UserModel();

    $storedToken = $session->getTempdata('email_change_token');
    // FIX: Changed 'new_email' to the correct 'new_email_for_change'
    $newEmail = $session->getTempdata('new_email_for_change');

    if ($token === null || $token !== $storedToken || !$newEmail) {
        return $this->fail('Invalid or expired token.');
    }

    try {
        $userModel->update($userId, ['email' => $newEmail]);
        $session->removeTempdata('email_change_token');
        // FIX: Also changed the key here for consistency
        $session->removeTempdata('new_email_for_change');
        
        return $this->respondUpdated(['message' => 'Email updated successfully.']);
    } catch (\Exception $e) {
        log_message('error', '[ERROR_EMAIL_CHANGE] {exception}', ['exception' => $e]);
        return $this->failServerError('Could not update email.');
    }
}

    public function deleteAccount()
    {
        $session = session();
        $userId = $session->get('userId');
        $userModel = new UserModel();
        
        $userModel->update($userId, [
            'email' => 'anonymized_' . uniqid() . '@example.com',
            'status' => 'anonymized',
        ]);

        $session->destroy();
        return $this->respondDeleted(['message' => 'Account deleted successfully.']);
    }

}