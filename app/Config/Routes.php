<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

$routes->group('api', ['namespace' => 'App\Controllers\API'], static function ($routes) {
    // --- Unauthenticated Routes ---
    $routes->post('auth/request-link', 'AuthController::requestLink');
    $routes->post('auth/verify-link', 'AuthController::verifyLink');

    // --- All Authenticated Routes ---
    // All routes that require a user to be logged in are grouped here for clarity.
    $routes->group('', ['filter' => 'sessionauth'], static function ($routes) {

        // User Profile Routes
        $routes->group('user', static function ($routes) {
            $routes->get('profile', 'UserController::getProfile');
            $routes->post('update-demographics', 'UserController::updateDemographics');
            $routes->post('update-financial-profile', 'UserController::updateFinancialProfile');
            $routes->get('active-budget', 'UserController::getActiveBudget');
            $routes->post('dismiss-accounts-prompt', 'UserController::dismissAccountsPrompt');
            $routes->delete('fresh-start', 'UserController::freshStart');
        });

        // Budget Routes
        $routes->group('budget', static function ($routes) {
            $routes->post('spending-categories', 'BudgetController::createSpendingCategory');
            $routes->get('expense-history', 'BudgetController::getExpenseHistory');
            $routes->get('wizard-suggestions', 'BudgetController::getWizardSuggestions');
            $routes->post('create', 'BudgetController::createCycle');
            $routes->post('add-transaction', 'BudgetController::addTransaction');
            //$routes->post('add-income-adjustment', 'BudgetController::addIncomeAdjustment');
            //$routes->post('add-expense-adjustment', 'BudgetController::addExpenseAdjustment');
            $routes->get('cycles', 'BudgetController::getCycles');
            $routes->get('(:num)', 'BudgetController::getCycleDetails/$1');
            $routes->get('transactions/(:num)', 'BudgetController::getTransactionsForCycle/$1');
            $routes->post('update-variable-amount/(:num)', 'BudgetController::updateVariableExpenseAmount/$1');
            $routes->post('mark-bill-paid/(:num)', 'BudgetController::markBillPaid/$1');
            $routes->post('mark-bill-unpaid/(:num)', 'BudgetController::markBillUnpaid/$1');
            $routes->post('add-expense/(:num)', 'BudgetController::addExpenseToCycle/$1');
            $routes->post('(:num)/update-income', 'BudgetController::updateIncomeInCycle/$1');
            $routes->post('add-income/(:num)', 'BudgetController::addIncomeToCycle/$1');
            $routes->post('add-variable-expense/(:num)', 'BudgetController::addVariableExpense/$1');
            $routes->post('remove-expense/(:num)', 'BudgetController::removeExpenseFromCycle/$1');
            //$routes->post('adjust-income/(:num)', 'BudgetController::adjustIncomeInCycle/$1');
            $routes->post('remove-income/(:num)', 'BudgetController::removeIncomeFromCycle/$1');
            $routes->post('update-dates/(:num)', 'BudgetController::updateBudgetDates/$1');
            $routes->post('force-close/(:num)', 'BudgetController::forceCloseCycle/$1');
            $routes->post('close/(:num)', 'BudgetController::closeCycle/$1');
            $routes->post('initialize-savings', 'BudgetController::initializeSavings');
            $routes->post('log-savings', 'BudgetController::logSavings');
            $routes->post('update-income-amount/(:num)', 'BudgetController::updateInitialIncomeAmount/$1');
            $routes->post('(:num)/transfer-to-account', 'BudgetController::transferToAccount/$1');
            $routes->post('(:num)/transfer-from-account', 'BudgetController::transferFromAccount/$1');
            $routes->post('project-income', 'BudgetController::projectIncome');
            $routes->post('(:num)/receive-income', 'BudgetController::markIncomeReceived/$1');
        });

        $routes->group('expenses', static function ($routes) {
            $routes->post('update-details/(:num)', 'BudgetController::updateExpenseDetails/$1');
        });

        // Transaction Routes
        $routes->group('transaction', static function ($routes) {
            $routes->post('add', 'TransactionController::addTransaction');
        });

        $routes->resource('user-accounts', [
            'controller' => 'UserAccountController',
            'only' => ['index', 'create', 'update', 'delete']
        ]);

        $routes->post('user-accounts/update-balance/(:num)', 'UserAccountController::updateBalance/$1');
        $routes->get('user-accounts', 'AccountController::getUserAccounts');

        $routes->group('goals', static function ($routes) {
            $routes->get('/', 'GoalController::index');
            $routes->post('/', 'GoalController::create');
            $routes->put('(:num)', 'GoalController::update/$1');
            $routes->delete('(:num)', 'GoalController::delete/$1');
            $routes->post('(:num)/log-payment', 'GoalController::logPayment/$1');
        });

        $routes->group('account', static function ($routes) {
            $routes->post('income-sources', 'AccountController::createIncomeSource');
            $routes->post('recurring-expenses', 'AccountController::createRecurringExpense');
            $routes->get('recurring-items', 'AccountController::getRecurringItems');
            $routes->delete('income-sources/(:num)', 'AccountController::deleteIncomeSource/$1');
            $routes->delete('recurring-expenses/(:num)', 'AccountController::deleteRecurringExpense/$1');
            $routes->post('income-sources/(:num)', 'AccountController::updateIncomeSource/$1');
            $routes->post('recurring-expenses/(:num)', 'AccountController::updateRecurringExpense/$1');
            $routes->post('profile', 'AccountController::updateProfile');
            $routes->post('financial-tools', 'AccountController::updateFinancialTools');
            $routes->get('financial-tools', 'AccountController::getFinancialTools');
            $routes->post('request-email-change', 'AccountController::requestEmailChange');
            $routes->get('verify-email-change/(:segment)', 'AccountController::verifyEmailChange/$1');
            $routes->delete('delete', 'AccountController::deleteAccount');
            $routes->put('income-sources/(:num)', 'AccountController::updateIncomeSource/$1');
            $routes->post('recurring-expenses/(:num)', 'AccountController::updateRecurringExpense/$1');
        });

        $routes->group('feedback', static function ($routes) {
            $routes->post('submit', 'FeedbackController::submit');
        });

        $routes->group('invitations', static function ($routes) {
            $routes->post('send', 'InvitationController::sendInvite');
            $routes->get('', 'InvitationController::getUserInvitations');
        });

    });
});

// --- SPA Catch-all Routes ---
// These must be last to ensure they don't override API routes.
$routes->get('/', 'Home::index');
$routes->get('{segment}', 'Home::index');
$routes->get('(:any)', 'Home::index');
