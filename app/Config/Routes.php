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
    $routes->post('auth/logout', 'AuthController::logout');
    $routes->post('sharing/accept', 'SharingController::acceptInvite');
    $routes->post('sharing/transform-account', 'SharingController::transformAccount');


    // --- All Authenticated Routes ---
    $routes->group('', ['filter' => 'sessionauth'], static function ($routes) {

        // User Profile Routes
        $routes->group('user', static function ($routes) {
            $routes->get('profile', 'UserController::getProfile');
            $routes->post('update-demographics', 'UserController::updateDemographics');
            $routes->get('active-budget', 'UserController::getActiveBudget');
            $routes->post('dismiss-accounts-prompt', 'UserController::dismissAccountsPrompt');
            $routes->delete('fresh-start', 'UserController::freshStart');
        });

        // ## START: NEW SHARING ROUTES ##
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

        });
        // ## END: NEW SHARING ROUTES ##

        // Budget Routes
        $routes->group('budget', static function ($routes) {
            $routes->post('create', 'BudgetController::createCycle');
            $routes->get('cycles', 'BudgetController::getCycles');
            $routes->get('wizard-suggestions', 'BudgetController::getWizardSuggestions');
            $routes->get('(:num)', 'BudgetController::getCycleDetails/$1');
            $routes->post('update-dates/(:num)', 'BudgetController::updateBudgetDates/$1');
            $routes->post('close/(:num)', 'BudgetController::closeCycle/$1');
            $routes->post('project-income', 'BudgetController::projectIncome');
        });

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

        $routes->group('transfers', static function ($routes) {
            $routes->post('(:num)/to-account', 'AccountTransferController::transferToAccount/$1');
            $routes->post('(:num)/from-account', 'AccountTransferController::transferFromAccount/$1');
        });

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
            //Creation Routes
            
            $routes->post('income-sources', 'AccountController::createIncomeSource');
            $routes->post('recurring-expenses', 'AccountController::createRecurringExpense');
            
            //Update Methods
            $routes->put('expenses/update-details/(:num)', 'AccountController::updateExpenseDetails/$1');
            $routes->post('income-sources/(:num)', 'AccountController::updateIncomeSource/$1');
            $routes->post('request-email-change', 'AccountController::requestEmailChange');
            $routes->post('recurring-expenses/(:num)', 'AccountController::updateRecurringExpense/$1');
            $routes->post('profile', 'AccountController::updateProfile');
            $routes->post('financial-tools', 'AccountController::updateFinancialTools');
            $routes->put('income-sources/(:num)', 'AccountController::updateIncomeSource/$1');
            $routes->post('recurring-expenses/(:num)', 'AccountController::updateRecurringExpense/$1');
            
            //Getters
            $routes->get('recurring-items', 'AccountController::getRecurringItems');
            $routes->get('financial-tools', 'AccountController::getFinancialTools');
            $routes->get('verify-email-change/(:segment)', 'AccountController::verifyEmailChange/$1');

            //Deleters
            $routes->delete('income-sources/(:num)', 'AccountController::deleteIncomeSource/$1');
            $routes->delete('recurring-expenses/(:num)', 'AccountController::deleteRecurringExpense/$1');
            $routes->delete('delete', 'AccountController::deleteAccount');
        });

        $routes->group('feedback', static function ($routes) {
            $routes->post('submit', 'FeedbackController::submit');
        });

        $routes->group('invitations', static function ($routes) {
            $routes->post('send', 'InvitationController::sendInvite');
            $routes->get('', 'InvitationController::getUserInvitations');
        });

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

