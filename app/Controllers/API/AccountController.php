<?php
namespace App\Controllers\API;

use App\Controllers\API\BaseAPIController;
use CodeIgniter\API\ResponseTrait;
use App\Models\IncomeSourceModel;
use App\Models\RecurringExpenseModel;
use App\Models\UserModel;
use App\Models\UserFinancialToolsModel;
use App\Models\BudgetCycleModel;
use App\Services\ProjectionService;
use App\Models\TransactionModel;
use Config\Services;

class AccountController extends BaseAPIController
{
    use ResponseTrait;

    private function blockPartners()
    {
        if ($this->getPermissionLevel() !== null) {
            return $this->failForbidden('Partners are not allowed to access this resource.');
        }
        return null;
    }
    public function getRecurringItems()
    {
        if ($response = $this->blockPartners()) return $response;
        $userId = $this->getEffectiveUserId(); // Use effective ID for read operations

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
        if ($response = $this->blockPartners()) return $response;
        $userId = $this->getEffectiveUserId();

        $accountModel = new \App\Models\UserAccountModel();
        $accounts = $accountModel->where('user_id', $userId)->findAll();

        return $this->respond($accounts);
    }

    public function deleteIncomeSource($id)
    {
        if ($response = $this->blockPartners()) return $response;
        $userId = session()->get('userId');
        $model = new IncomeSourceModel();

        $item = $model->where('id', $id)->where('user_id', $userId)->first();
        if (!$item) {
            return $this->failNotFound('Income source not found.');
        }

        if ($model->update($id, ['is_active' => 0])) {
            return $this->respondDeleted(['message' => 'Income source deactivated successfully.']);
        }

        return $this->failServerError('Could not deactivate income source.');
    }

    public function deleteRecurringExpense($id)
    {
        if ($response = $this->blockPartners()) return $response;
        $userId = session()->get('userId');
        $model = new RecurringExpenseModel();

        $item = $model->where('id', $id)->where('user_id', $userId)->first();
        if (!$item) {
            return $this->failNotFound('Recurring expense not found.');
        }

        if ($model->update($id, ['is_active' => 0])) {
            return $this->respondDeleted(['message' => 'Recurring expense deactivated successfully.']);
        }

        return $this->failServerError('Could not deactivate recurring expense.');
    }

    public function updateIncomeSource($id)
    {
        if ($response = $this->blockPartners()) return $response;
        $userId = session()->get('userId');
        $model = new IncomeSourceModel();

        $item = $model->where('id', $id)->where('user_id', $userId)->first();
        if (!$item) {
            return $this->failNotFound('Income source not found.');
        }

        $json = $this->request->getJSON(true);
        $data = [
            'label' => $json['label'],
            'frequency' => $json['frequency'],
            'frequency_day' => $json['frequency_day'] ?? null,
            'frequency_date_1' => $json['frequency_date_1'] ?? null,
            'frequency_date_2' => $json['frequency_date_2'] ?? null,
        ];

        $db = \Config\Database::connect();
        $db->transStart();
        try {
            if ($model->update($id, $data) === false) {
                return $this->fail($model->errors());
            }

            $budgetCycleModel = new BudgetCycleModel();
            $activeBudget = $budgetCycleModel->where('user_id', $userId)->where('status', 'active')->first();

            if ($activeBudget) {
                $allIncomeRulesFromDB = $model->where('user_id', $userId)->where('is_active', 1)->findAll();
                $currentPlannedIncome = json_decode($activeBudget['initial_income'], true) ?: [];
                $transactionModel = new TransactionModel();
                $transactions = $transactionModel->where('budget_cycle_id', $activeBudget['id'])->where('type', 'income')->findAll();
                $amountMap = [];
                foreach ($currentPlannedIncome as $plannedItem) {
                    if (isset($plannedItem['id'])) {
                        $amountMap[$plannedItem['id']] = $plannedItem['amount'];
                    }
                }
                $transactionAmountMap = [];
                foreach ($transactions as $t) {
                    $bestMatchRuleId = null;
                    $longestMatchLength = 0;
                    foreach ($allIncomeRulesFromDB as $rule) {
                        if (strpos($t['description'], $rule['label']) !== false) {
                            $currentMatchLength = strlen($rule['label']);
                            if ($currentMatchLength > $longestMatchLength) {
                                $longestMatchLength = $currentMatchLength;
                                $bestMatchRuleId = $rule['id'];
                            }
                        }
                    }
                    if ($bestMatchRuleId !== null) {
                        $transactionAmountMap[$bestMatchRuleId] = $t['amount'];
                    }
                }
                $rulesWithAmounts = [];
                foreach ($allIncomeRulesFromDB as $rule) {
                    $rule['amount'] = $amountMap[$rule['id']] ?? $transactionAmountMap[$rule['id']] ?? null;
                    if ($rule['amount'] !== null) {
                        $rulesWithAmounts[] = $rule;
                    }
                }
                $projectionService = new ProjectionService();
                $newProjectedIncome = $projectionService->projectIncome($activeBudget['start_date'], $activeBudget['end_date'], $rulesWithAmounts);
                $receivedLabels = array_column($transactions, 'description');
                if (!empty($receivedLabels)) {
                    foreach ($newProjectedIncome as &$projItem) {
                        foreach ($receivedLabels as $label) {
                            if (strpos($label, $projItem['label']) !== false) {
                                $projItem['is_received'] = true;
                                break;
                            }
                        }
                    }
                }
                $budgetCycleModel->update($activeBudget['id'], ['initial_income' => json_encode($newProjectedIncome)]);
            }

            $db->transComplete();
            if ($db->transStatus() === false) {
                throw new \Exception('Database transaction failed.');
            }

            return $this->respondUpdated(['message' => 'Income source updated and budget synced.']);
        } catch (\Exception $e) {
            log_message('error', '[ERROR_UPDATE_INCOME_SOURCE] ' . $e->getMessage());
            return $this->failServerError('Could not update income source.');
        }
    }

    public function updateRecurringExpense($id)
    {
        if ($response = $this->blockPartners()) return $response;
        $userId = session()->get('userId');
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
        if ($response = $this->blockPartners()) return $response;
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

    public function updateFinancialTools()
    {
        if ($response = $this->blockPartners()) return $response;
        $userId = $this->getEffectiveUserId();
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
        if ($response = $this->blockPartners()) return $response;
        $userId = $this->getEffectiveUserId();
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
        if ($response = $this->blockPartners()) return $response;
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

    public function verifyEmailChange($token = null)
    {
        if ($response = $this->blockPartners()) return $response;
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
        if ($response = $this->blockPartners()) return $response;
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

    public function createIncomeSource()
    {
        if ($response = $this->blockPartners()) return $response;
        $session = session();
        $userId = $session->get('userId');
        $incomeModel = new IncomeSourceModel();

        $data = [
            'label' => $this->request->getVar('label'),
            'frequency' => $this->request->getVar('frequency'),
            'frequency_day' => $this->request->getVar('frequency_day') ?? null,
            'frequency_date_1' => $this->request->getVar('frequency_date_1') ?? null,
            'frequency_date_2' => $this->request->getVar('frequency_date_2') ?? null,
        ];

        // Assuming findOrCreate is a custom method on your model
        $newId = $incomeModel->findOrCreate($userId, $data);

        if (!$newId) {
            return $this->failServerError('Could not save income source.');
        }

        return $this->respondCreated(['id' => $newId, 'message' => 'Income source saved.']);
    }

    public function createRecurringExpense()
    {
        if ($response = $this->blockPartners()) return $response;
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

}