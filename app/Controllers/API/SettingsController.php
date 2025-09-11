<?php
namespace App\Controllers\API;

use App\Controllers\API\BaseAPIController;
use CodeIgniter\API\ResponseTrait;
use App\Models\IncomeSourceModel;
use App\Models\RecurringExpenseModel;
use App\Models\UserModel;
use App\Models\BudgetCycleModel;
use App\Models\UserAccountModel;
use App\Services\ProjectionService;
use App\Models\TransactionModel;
use Config\Services;

class SettingsController extends BaseAPIController
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
        // Allow all authenticated users (including partners) to view recurring items
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

        $accountModel = new UserAccountModel();
        $accounts = $accountModel->where('user_id', $userId)->findAll();

        return $this->respond($accounts);
    }

    public function deleteIncomeSource($id)
    {
        if ($response = $this->blockPartners()) return $response;
        $userId = $this->getEffectiveUserId();
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
        $userId = $this->getEffectiveUserId();
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
        $userId = $this->getEffectiveUserId();
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

            // Return the updated income source
            $updatedItem = $model->find($id);
            return $this->respondUpdated($updatedItem);
        } catch (\Exception $e) {
            log_message('error', '[ERROR_UPDATE_INCOME_SOURCE] ' . $e->getMessage());
            return $this->failServerError('Could not update income source.');
        }
    }

    public function updateRecurringExpense($id)
    {
        if ($response = $this->blockPartners()) return $response;
        $userId = $this->getEffectiveUserId();
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
            'manage_url' => $json['manage_url'] ?? null,
        ];
        if (($json['category'] ?? null) === 'credit-card') {
            $data['spending_limit'] = $json['spending_limit'] ?? null;
        }

        if ($model->update($id, $data)) {
            $updatedItem = $model->find($id);
            return $this->respondUpdated($updatedItem);
        }
        return $this->fail($model->errors());
    }

    public function updateProfile()
    {
        if ($response = $this->blockPartners()) return $response;
        $userId = $this->getEffectiveUserId();
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

    public function requestEmailChange()
    {
        if ($response = $this->blockPartners()) return $response;
        $session = Services::session();
        $userId = $this->getEffectiveUserId();
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
        $userId = $this->getEffectiveUserId();
        $userModel = new UserModel();

        $storedToken = $session->getTempdata('email_change_token');

        $newEmail = $session->getTempdata('new_email_for_change');

        if ($token === null || $token !== $storedToken || !$newEmail) {
            return $this->fail('Invalid or expired token.');
        }

        try {
            $userModel->update($userId, ['email' => $newEmail]);
            $session->removeTempdata('email_change_token');
            
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
        $userId = $this->getEffectiveUserId();
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
        $userId = $this->getEffectiveUserId();
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
        $userId = $this->getEffectiveUserId();
        $json = $this->request->getJSON(true);

        // Basic data common to all expense types
        $data = [
            'user_id' => $userId,
            'label' => $json['label'],
            'due_date' => $json['dueDate'] ?? null,
            'category' => $json['category'] ?? 'other',
            'manage_url' => $json['manage_url'] ?? null
        ];

        // FIX: Add category-specific fields based on the request
        if ($data['category'] === 'loan') {
            $data['principal_balance'] = $json['principal_balance'] ?? null;
            $data['interest_rate'] = $json['interest_rate'] ?? null;
            $data['maturity_date'] = $json['maturity_date'] ?? null;
        } elseif ($data['category'] === 'credit-card') {
            $data['outstanding_balance'] = $json['outstanding_balance'] ?? null;
            $data['interest_rate'] = $json['interest_rate'] ?? null;
            $data['spending_limit'] = $json['spending_limit'] ?? null;
        }

        $model = new RecurringExpenseModel();

        if ($model->insert($data)) {
            $id = $model->getInsertID();
            return $this->respondCreated(['id' => $id, 'message' => 'Expense added.']);
        } else {
            return $this->fail($model->errors());
        }
    }

    public function updateExpenseDetails($expenseId)
    {
        // 1. Check permissions first
        $permission = $this->getPermissionLevel();
        if ($permission === 'read_only') {
            return $this->failForbidden('You do not have permission to perform this action.');
        }

        // 2. Use the effective (owner's) ID for all data operations
        $userId = $this->getEffectiveUserId();
        $recurringExpenseModel = new RecurringExpenseModel();
        $budgetCycleModel = new BudgetCycleModel();

        // 3. Ensure the expense belongs to the user (owner)
        $expense = $recurringExpenseModel->where('id', '=>', $expenseId)->where('user_id', $userId)->first();
        if (!$expense) {
            return $this->failNotFound('Expense not found.');
        }

        // 4. Sanitize the incoming JSON data
        $json = $this->request->getJSON(true);
        $allowedData = [];
        $fields = ['principal_balance', 'interest_rate', 'outstanding_balance', 'maturity_date', 'spending_limit'];
        foreach ($fields as $field) {
            if (isset($json[$field])) {
                $allowedData[$field] = $json[$field] === '' ? null : $json[$field];
            }
        }

        if (empty($allowedData)) {
            return $this->failValidationErrors('No valid fields to update.');
        }

        // 5. Handle the "update by request" case
        if ($permission === 'update_by_request') {
            // A request must be associated with a budget cycle
            $activeCycle = $budgetCycleModel->where('user_id', $userId)->where('status', 'active')->first();
            if (!$activeCycle) {
                return $this->fail('An active budget cycle is required to request this change.');
            }

            $payload = ['expenseId' => $expenseId, 'updates' => $allowedData];
            $description = "Update details for expense: '{$expense['label']}'";
            return $this->handlePartnerAction('update_expense_details', $description, $activeCycle['id'], $payload);
        }

        // --- 6. Original logic for Owners or full_access Partners ---
        try {
            // Update the permanent recurring_expenses table
            if ($recurringExpenseModel->update($expenseId, $allowedData) === false) {
                return $this->fail($recurringExpenseModel->errors());
            }

            // Find the active budget cycle to update its JSON data
            $activeCycle = $budgetCycleModel->where('user_id', $userId)->where('status', 'active')->first();
            if ($activeCycle) {
                $initialExpenses = json_decode($activeCycle['initial_expenses'], true);

                // Find and update the matching expense within the JSON
                foreach ($initialExpenses as &$exp) {
                    if (isset($exp['id']) && $exp['id'] == $expenseId) {
                        $exp = array_merge($exp, $allowedData);
                        break;
                    }
                }

                $budgetCycleModel->update($activeCycle['id'], ['initial_expenses' => json_encode($initialExpenses)]);
            }

            return $this->respondUpdated(['message' => 'Expense details updated successfully.']);
        } catch (\Exception $e) {
            log_message('error', '[ERROR] {exception}', ['exception' => $e]);
            return $this->failServerError('Could not update expense details.');
        }
    }

}