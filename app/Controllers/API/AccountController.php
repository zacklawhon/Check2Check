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
     * Fetches all active recurring income sources and expense templates for the authenticated user.
     *
     * Retrieves the user's ID from the session, queries the IncomeSourceModel and RecurringExpenseModel
     * for active records (is_active = 1) associated with the user, and returns them in a JSON response.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a JSON response containing arrays of income sources and recurring expenses.
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

    public function getUserAccounts()
    {
        $session = session();
        $userId = $session->get('userId');

        $accountModel = new \App\Models\UserAccountModel(); // Using the provided UserAccountModel

        $accounts = $accountModel->where('user_id', $userId)->findAll();

        return $this->respond($accounts);
    }




    /**
     * Deactivates an income source by setting its is_active flag to 0.
     *
     * Verifies that the income source exists and belongs to the authenticated user before updating.
     * Instead of deleting the record, it marks it as inactive to preserve data integrity.
     * Note: This method is nearly identical to deleteRecurringExpense in logic, differing only in the model and entity name.
     * Consider refactoring into a generic deactivateItem method to reduce code duplication.
     *
     * @param int $id The ID of the income source to deactivate.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if deactivated, a 404 if not found, or a 500 error on failure.
     */
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

    /**
     * Deactivates a recurring expense by setting its is_active flag to 0.
     *
     * Checks if the recurring expense exists and is associated with the authenticated user.
     * Updates the is_active flag to 0 instead of deleting the record.
     * Note: This method is nearly identical to deleteIncomeSource in logic, differing only in the model and entity name.
     * Consider refactoring into a generic deactivateItem method to reduce code duplication.
     *
     * @param int $id The ID of the recurring expense to deactivate.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if deactivated, a 404 if not found, or a 500 error on failure.
     */
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

    /**
     * Updates an existing income source with new label and frequency data.
     *
     * Verifies the income source exists and belongs to the authenticated user.
     * Updates the record with data provided in the JSON request body.
     * Note: Shares similar validation and update logic with updateRecurringExpense, but fields differ significantly.
     * Refactoring into a generic update method may add complexity without substantial benefits.
     *
     * @param int $id The ID of the income source to update.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if updated, a 404 if not found, or a failure response with validation errors.
     */
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

        // --- THIS IS THE FIX ---
        // The data now includes all the new frequency fields from the frontend.
        $data = [
            'label' => $json['label'],
            'frequency' => $json['frequency'],
            'frequency_day' => $json['frequency_day'] ?? null,
            'frequency_date_1' => $json['frequency_date_1'] ?? null,
            'frequency_date_2' => $json['frequency_date_2'] ?? null,
        ];

        if ($model->update($id, $data)) {
            return $this->respondUpdated(['message' => 'Income source updated successfully.']);
        }
        return $this->fail($model->errors());
    }

    /**
     * Updates a recurring expense with new data provided in the JSON request.
     *
     * Verifies the expense exists and belongs to the authenticated user. Updates fields
     * such as label, due date, category, and financial details if provided.
     * Note: Shares similar validation and update logic with updateIncomeSource, but fields differ significantly.
     * Refactoring into a generic update method may add complexity without substantial benefits.
     *
     * @param int $id The ID of the recurring expense to update.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if updated, a 404 if not found, or a failure response with validation errors.
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

    /**
     * Updates the authenticated user's demographic profile information.
     *
     * Validates input data (zip code, age range, sex, household size) and updates the user's record.
     * Handles exceptions and logs errors if the update fails. No redundancy with other methods due to unique demographic fields.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if updated, a failure response with validation errors, or a 500 error on exception.
     */
    public function updateProfile()
    {
        $session = session();
        $userId = $session->get('userId');
        $userModel = new UserModel();

        $rules = [
            'PLIEDocument' => 'permit_empty|string|max_length[10]',
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

    /**
     * Updates the authenticated user's financial tools preferences.
     *
     * Updates fields like checking account status, savings account status, credit card usage,
     * and savings goal based on JSON input. Verifies the record exists before updating.
     * No redundancy with other methods due to unique financial tool fields.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if updated, a 404 if the record is not found, or a failure response with errors.
     */
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

    /**
     * Retrieves the authenticated user's financial tools preferences.
     *
     * Fetches the user's financial tools record. If none exists, creates a default record
     * with the user's ID and returns it. No redundancy with other methods due to its unique purpose.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a JSON response with the financial tools data.
     */
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

    /**
     * Initiates an email change request for the authenticated user.
     *
     * Validates the new email address, generates a verification token, and sends a confirmation
     * email to the user's current email address with a verification link. Stores the token and
     * new email in temporary session data. No redundancy with other methods due to its unique email handling logic.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if the email is sent, a validation error if the email is invalid or in use, or a 500 error on failure.
     */
    public function requestEmailChange()
    {
        $session = Services::session();
        $userId = $session->get('userId');
        $userModel = new UserModel();

        $rules = [
            'new_email' => 'required|valid_email|is_unique[users.email,id,' . $userId . ']'
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
        if (!$user) {
            return $this->failNotFound('User not found.');
        }

        $newEmail = $this->request->getVar('new_email');
        $token = bin2hex(random_bytes(32));

        $session->setTempdata('email_change_token', $token, 900);
        $session->setTempdata('new_email_for_change', $newEmail, 900);

        $verificationLink = site_url('verify-email-change/' . $token);

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

    /**
     * Verifies and completes an email change request.
     *
     * Checks the provided token against the session's stored token and updates the user's email
     * if valid. Removes temporary session data after successful update. No redundancy with other methods due to its unique verification logic.
     *
     * @param string|null $token The verification token from the email link.
     * @return \CodeIgniter\API\ResponseTrait Returns a success response if updated, a failure response for invalid/expired tokens, or a 500 error on exception.
     */
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

    /**
     * Anonymizes and deletes the authenticated user's account.
     *
     * Updates the user's email to a unique anonymized value and sets the account status to 'anonymized'.
     * Destroys the session to log the user out. No redundancy with other methods due to its unique anonymization and session destruction logic.
     *
     * @return \CodeIgniter\API\ResponseTrait Returns a success response indicating the account was deleted.
     */
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