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

        // Onboarding Routes
        $routes->group('onboarding', static function ($routes) {
            $routes->post('add-income', 'OnboardingController::addIncomeSource');
            $routes->post('add-expense', 'OnboardingController::addRecurringExpense');
            $routes->post('add-spending-category', 'OnboardingController::addSpendingCategory');
            $routes->post('update-financial-tools', 'OnboardingController::updateFinancialTools');
            $routes->get('data', 'OnboardingController::getOnboardingData');
        });

        // User Profile Routes
        $routes->group('user', static function ($routes) {
            $routes->get('profile', 'UserController::getProfile');
            $routes->post('update-demographics', 'UserController::updateDemographics');
            $routes->post('update-financial-profile', 'UserController::updateFinancialProfile');
        });

        // Budget Routes
        $routes->group('budget', static function ($routes) {
            $routes->get('expense-history', 'BudgetController::getExpenseHistory');
            $routes->get('wizard-suggestions', 'BudgetController::getWizardSuggestions');
            $routes->post('create', 'BudgetController::createCycle');
            $routes->post('add-transaction', 'BudgetController::addTransaction');
            $routes->post('add-income-adjustment', 'BudgetController::addIncomeAdjustment');
            $routes->post('add-expense-adjustment', 'BudgetController::addExpenseAdjustment');
            $routes->get('cycles', 'BudgetController::getCycles');
            $routes->get('(:num)', 'BudgetController::getCycleDetails/$1');
            $routes->get('transactions/(:num)', 'BudgetController::getTransactionsForCycle/$1');
            $routes->post('update-variable-amount/(:num)', 'BudgetController::updateVariableExpenseAmount/$1');
            $routes->post('mark-bill-paid/(:num)', 'BudgetController::markBillPaid/$1');
            $routes->post('add-expense/(:num)', 'BudgetController::addExpenseToCycle/$1');
            $routes->post('add-income/(:num)', 'BudgetController::addIncomeToCycle/$1');
            $routes->post('remove-expense/(:num)', 'BudgetController::removeExpenseFromCycle/$1');
            $routes->post('adjust-income/(:num)', 'BudgetController::adjustIncomeInCycle/$1');
            $routes->post('remove-income/(:num)', 'BudgetController::removeIncomeFromCycle/$1');
            $routes->post('update-dates/(:num)', 'BudgetController::updateBudgetDates/$1');
            $routes->post('force-close/(:num)', 'BudgetController::forceCloseCycle/$1');
            $routes->post('close/(:num)', 'BudgetController::closeCycle/$1');
            $routes->post('initialize-savings', 'BudgetController::initializeSavings');
            $routes->post('log-savings', 'BudgetController::logSavings');
            $routes->post('update-income-amount/(:num)', 'BudgetController::updateInitialIncomeAmount/$1');
        });
        
        $routes->group('expenses', static function ($routes) {
            $routes->post('update-details/(:num)', 'BudgetController::updateExpenseDetails/$1');
        });

        // Transaction Routes
        $routes->group('transaction', static function ($routes) {
            $routes->post('add', 'TransactionController::addTransaction');
        });
        
        $routes->group('account', static function ($routes) {
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
        });
    });
});

// --- SPA Catch-all Routes ---
// These must be last to ensure they don't override API routes.
$routes->get('/', 'Home::index');
$routes->get('{segment}', 'Home::index');
$routes->get('(:any)', 'Home::index');
