<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

class ContentSeeder extends Seeder
{
    public function run()
    {
        $contentData = [
            [
                'page_key' => 'wizard',
                'title' => 'Guided Budget Setup',
                'content' => '<p>Welcome to the Guided Setup! This wizard will walk you through creating a detailed and accurate budget, step-by-step.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Step 1: Define Budget Cycle</h4>' .
                             '<p>First, set the timeframe for your budget. Choose a start date and a duration (like \'One Month\' or \'Two Weeks\'), and the system will calculate the end date for you.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Step 2: Add Income</h4>' .
                             '<p>Select your expected income for this period from the suggested list. You must enter an amount for each selected source. If an income source is missing its frequency details, a small form will appear asking you to update the rule.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Step 3: Review Projection</h4>' .
                             '<p>Based on the dates and income rules you provided, we project a timeline of when your income will arrive within the budget cycle. This gives you a clear picture of your cash flow.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Step 4: Confirm Expenses</h4>' .
                             '<p>Select the recurring bills you expect to pay during this budget period. If a bill\'s due date falls outside the budget cycle, it will be filtered out automatically. Don\'t forget to enter the estimated amount for each bill you select.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Step 5: Variable Spending</h4>' .
                             '<p>Finally, select or add any categories for day-to-day spending you want to track, like \'Groceries\' or \'Gas\'. These will be added to your budget with an initial amount of $0. When you\'re done, click the "Finish Setup" button to create your budget!</p>',
                'is_announcement' => false,
                'is_active' => true,
            ],
            [
                'page_key' => 'budget',
                'title' => 'The Budget Page',
                'content' => '<p>This is your command center for an active budget. Here you can track your cash flow, log transactions, and see how your spending aligns with your plan in real-time.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Editing Your Budget Dates</h4>' .
                             '<p>The date range for your budget is displayed at the top of the page. If you need to extend or shorten your budget period, simply click on the dates to open a modal and adjust them.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Summary Card</h4>' .
                             '<p>The card on the left gives you a snapshot of your budget\'s health, including your planned surplus or deficit. The most important number here is <strong>Current Cash</strong>, which shows the actual money you have on hand based on what you\'ve received versus what you\'ve paid.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Planned Income</h4>' .
                             '<p>This section lists all projected income for the budget period. When you receive money, click the "Receive" button to confirm the amount. This will move the money into your "Current Cash" balance.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Recurring Bills</h4>' .
                             '<p>These are your regular bills like rent or subscriptions. Click the "Pay" button to log a payment. To edit the amount or due date for just this month, click anywhere on the item to open the editor.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Variable Spending</h4>' .
                             '<p>This is for day-to-day expenses like groceries and gas. First, set a budget for each category using the input field and click "Set". Then, use the "Log" button to record transactions as you spend money throughout the month.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Accounts Card</h4>' .
                             '<p>If you\'ve set up savings or checking accounts, you can transfer money to and from your budget. Use "Take Funds" to pull money from an account into your budget (as income), or "Add Funds" to move money from your budget into an account (as a savings transaction).</p>',
                'is_announcement' => false,
                'is_active' => true,
            ],
            [
                'page_key' => 'dashboard',
                'title' => 'Dashboard Guide',
                'content' => '<p>The Dashboard is your financial home base. It provides a quick overview of your accounts and a history of all your past, present, and future budgets.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Accounts Card</h4>' .
                             '<p>If you have linked any savings or checking accounts, their balances will be displayed at the top. The transfer buttons will be enabled if you have a budget currently active.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Budget List</h4>' .
                             '<p>This area shows all of your budget cycles. From here you can view your active budget, close a budget once its end date has passed, or review a completed budget.</p>',
                'is_announcement' => false,
                'is_active' => true,
            ],
            [
                'page_key' => 'account',
                'title' => 'Account Management',
                'content' => '<p>This is your central hub for managing your profile and the reusable templates for your income and bills. <strong>Changes made here affect future budgets</strong>, not your currently active one.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Goals & Plans</h4>' .
                             '<p>Here you can create, edit, or delete your savings or debt reduction goals. Having an active goal enables features like the "Accelerate Your Goal" prompt on the Budget Page.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Your Accounts</h4>' .
                             '<p>Connect your real-world checking and savings accounts here. Adding an account allows you to track its balance and transfer funds to and from your budget.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Saved Income & Bills</h4>' .
                             '<p>This is a list of all the income sources and recurring expenses you have saved. When you start a new budget, the items on this list will be offered as suggestions. Editing an item here updates the \'master rule\' that will be used for all future budgets.</p>' .
                             '<h4 class="text-lg font-bold text-gray-200 mt-3 mb-1">Account Actions</h4>' .
                             '<p>This section contains sensitive, one-time actions for your user account. You can request to change your email, start a "Fresh Start" to wipe all your data, or permanently delete your account.</p>',
                'is_announcement' => false,
                'is_active' => true,
            ],
            [
                'page_key' => 'default',
                'title' => 'General Help',
                'content' => '<p>This is the default help text. More specific tutorials will appear depending on the page you are on.</p>',
                'is_announcement' => false,
                'is_active' => true,
            ],
            [
                'page_key' => 'announcement-1', // Give announcements a unique key
                'title' => 'New Feature: Dynamic Help Tutorials!',
                'content' => '<p>Getting help is now easier than ever! Just click the "Help & Feedback" button in the header.</p><p>A new "Tutorial" tab will automatically show you helpful tips and guides relevant to the page you are currently viewing.</p>',
                'is_announcement' => true, // Flag this one as an announcement
                'is_active' => true,
            ],
        ];

        // Using Query Builder to insert data
        $this->db->table('content')->insertBatch($contentData);
    }
}