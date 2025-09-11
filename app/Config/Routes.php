<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */

// --- SPA Home Route ---
$routes->get('/', 'Home::index');

// =========================
//      API ROUTES
// =========================
$routes->group('api', ['namespace' => 'App\Controllers\API'], static function ($routes) {
    // --- Unauthenticated API Routes ---
    $routes->post('auth/request-link', 'AuthController::requestLink');
    $routes->post('auth/verify-link', 'AuthController::verifyLink');
    $routes->post('auth/logout', 'AuthController::logout');
    $routes->post('sharing/accept', 'SharingController::acceptInvite');
    $routes->post('sharing/transform-account', 'SharingController::transformAccount');

    // --- Authenticated API Routes ---
    $routes->group('', ['filter' => 'sessionauth'], static function ($routes) {

        // ===== USER PROFILE =====
        $routes->group('user', static function ($routes) {
            $routes->get('profile', 'UserController::getProfile');
            $routes->post('update-demographics', 'UserController::updateDemographics');
            $routes->get('active-budget', 'UserController::getActiveBudget');
            $routes->post('dismiss-accounts-prompt', 'UserController::dismissAccountsPrompt');
            $routes->delete('fresh-start', 'UserController::freshStart');
        });

        // ===== SHARING =====
        $routes->group('sharing', static function ($routes) {
            $routes->post('invite', 'SharingController::sendInvite');
            $routes->get('invites', 'SharingController::getInvites');
            $routes->get('partners-and-invites', 'SharingController::getPartnersAndInvites');
            $routes->post('approve/(:num)', 'SharingController::approveActionRequest/$1');
            $routes->get('requests/(:num)', 'SharingController::getActionRequests/$1');
            $routes->put('update-permission/(:num)', 'SharingController::updatePermission/$1');
            $routes->delete('invites/(:num)', 'SharingController::revokeAccess/$1');
            $routes->post('deny/(:num)', 'SharingController::denyActionRequest/$1');
            $routes->delete('request/(:num)', 'SharingController::cancelActionRequest/$1');
            $routes->delete('cancel-invite/(:num)', 'SharingController::cancelInvite/$1');
        });

        // ===== BUDGET CYCLES =====
        $routes->group('budget', static function ($routes) {
            $routes->post('create', 'BudgetController::createCycle');
            $routes->get('cycles', 'BudgetController::getCycles');
            $routes->get('wizard-suggestions', 'BudgetController::getWizardSuggestions');
            $routes->get('(:num)', 'BudgetController::getCycleDetails/$1');
            $routes->post('update-dates/(:num)', 'BudgetController::updateBudgetDates/$1');
            $routes->post('close/(:num)', 'BudgetController::closeCycle/$1');
            $routes->post('project-income', 'BudgetController::projectIncome');
        });

        // ===== BUDGET ITEMS =====
        $routes->group('budget-items', static function ($routes) {
            $routes->get('transactions/(:num)', 'BudgetItemController::getTransactionsForCycle/$1');
            $routes->get('expense-history', 'BudgetItemController::getExpenseHistory');
            $routes->post('update-variable-amount/(:num)', 'BudgetItemController::updateVariableExpenseAmount/$1');
            $routes->post('mark-bill-paid/(:num)', 'BudgetItemController::markBillPaid/$1');
            $routes->post('mark-bill-unpaid/(:num)', 'BudgetItemController::markBillUnpaid/$1');
            $routes->post('add-expense/(:num)', 'BudgetItemController::addExpenseToCycle/$1');
            $routes->post('(:num)/update-income', 'BudgetItemController::updateIncomeInCycle/$1');
            $routes->post('add-income/(:num)', 'BudgetItemController::addIncomeToCycle/$1');
            $routes->post('add-variable-expense/(:num)', 'BudgetItemController::addVariableExpense/$1');
            $routes->post('remove-expense/(:num)', 'BudgetItemController::removeExpenseFromCycle/$1');
            $routes->post('remove-income/(:num)', 'BudgetItemController::removeIncomeFromCycle/$1');
            $routes->post('(:num)/receive-income', 'BudgetItemController::markIncomeReceived/$1');
            $routes->put('recurring-expense/(:num)', 'BudgetItemController::updateRecurringExpenseInCycle/$1');
            $routes->post('update-income-amount/(:num)', 'BudgetItemController::updateInitialIncomeAmount/$1');
            $routes->post('spending-categories', 'BudgetItemController::createSpendingCategory');
            $routes->post('log-variable-expense/(:num)', 'BudgetItemController::logVariableExpense/$1');
        });

        // ===== ACCOUNT TRANSFERS =====
        $routes->group('transfers', static function ($routes) {
            $routes->post('(:num)/to-account', 'AccountTransferController::transferToAccount/$1');
            $routes->post('(:num)/from-account', 'AccountTransferController::transferFromAccount/$1');
        });

        // ===== TRANSACTIONS =====
        $routes->group('transaction', static function ($routes) {
            $routes->post('add', 'TransactionController::addTransaction');
        });

        // ===== USER ACCOUNTS =====
        $routes->resource('user-accounts', [
            'controller' => 'UserAccountController',
            'only' => ['index', 'create', 'update', 'delete']
        ]);
        $routes->post('user-accounts/update-balance/(:num)', 'UserAccountController::updateBalance/$1');
        $routes->get('user-accounts', 'SettingsController::getUserAccounts');

        // ===== GOALS =====
        $routes->group('goals', static function ($routes) {
            $routes->get('/', 'GoalController::index');
            $routes->post('/', 'GoalController::create');
            $routes->put('(:num)', 'GoalController::update/$1');
            $routes->delete('(:num)', 'GoalController::delete/$1');
            $routes->post('(:num)/log-payment', 'GoalController::logPayment/$1');
        });

        // ===== SETTINGS =====
        $routes->group('settings', static function ($routes) {
            // --- Creation ---
            $routes->post('income-sources', 'SettingsController::createIncomeSource');
            $routes->post('recurring-expenses', 'SettingsController::createRecurringExpense');
            // --- Update ---
            $routes->put('expenses/update-details/(:num)', 'SettingsController::updateExpenseDetails/$1');
            $routes->post('income-sources/(:num)', 'SettingsController::updateIncomeSource/$1');
            $routes->post('request-email-change', 'SettingsController::requestEmailChange');
            $routes->post('recurring-expenses/(:num)', 'SettingsController::updateRecurringExpense/$1');
            $routes->post('profile', 'SettingsController::updateProfile');
            $routes->put('income-sources/(:num)', 'SettingsController::updateIncomeSource/$1');
            $routes->post('recurring-expenses/(:num)', 'SettingsController::updateRecurringExpense/$1');
            // --- Getters ---
            $routes->get('recurring-items', 'SettingsController::getRecurringItems');
            $routes->get('verify-email-change/(:segment)', 'SettingsController::verifyEmailChange/$1');
            // --- Deleters ---
            $routes->delete('income-sources/(:num)', 'SettingsController::deleteIncomeSource/$1');
            $routes->delete('recurring-expenses/(:num)', 'SettingsController::deleteRecurringExpense/$1');
            $routes->delete('delete', 'SettingsController::deleteAccount');
        });

        // ===== FEEDBACK =====
        $routes->group('feedback', static function ($routes) {
            $routes->post('submit', 'FeedbackController::submit');
        });

        // ===== INVITATIONS =====
        $routes->group('invitations', static function ($routes) {
            $routes->post('send', 'InvitationController::sendInvite');
            $routes->get('', 'InvitationController::getUserInvitations');
        });

        // ===== CONTENT =====
        $routes->group('content', static function ($routes) {
            $routes->get('all', 'ContentController::getAllContent');
            $routes->get('latest-announcement', 'ContentController::getLatestAnnouncement');
            $routes->post('mark-as-seen', 'ContentController::markAsSeen');
        });
    });
});

// --- SPA Catch-all Routes ---
$routes->get('/', 'Home::index');
$routes->get('{segment}', 'Home::index');
$routes->get('(:any)', 'Home::index');

