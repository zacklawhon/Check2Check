import React from 'react';

// This is a helper component to render styled buttons in the tutorials.
const ExampleButton = ({ children, color }) => (
  <span className={`px-2 py-1 text-xs font-bold text-white rounded ${color === 'green' ? 'bg-green-600' : 'bg-indigo-600'}`}>
    {children}
  </span>
);

export const helpContent = {
  // New entry for the Guided Wizard
  wizard: {
    title: "Guided Budget Setup",
    content: [
      <p key="p1">Welcome to the Guided Setup! This wizard will walk you through creating a detailed and accurate budget, step-by-step.</p>,

      <h4 key="h1" className="text-lg font-bold text-gray-200 mt-3 mb-1">Step 1: Define Budget Cycle</h4>,
      <p key="p2">First, set the timeframe for your budget. Choose a start date and a duration (like 'One Month' or 'Two Weeks'), and the system will calculate the end date for you.</p>,

      <h4 key="h2" className="text-lg font-bold text-gray-200 mt-3 mb-1">Step 2: Add Income</h4>,
      <p key="p3">Select your expected income for this period from the suggested list. You must enter an amount for each selected source. If an income source is missing its frequency details, a small form will appear asking you to update the rule.</p>,

      <h4 key="h3" className="text-lg font-bold text-gray-200 mt-3 mb-1">Step 3: Review Projection</h4>,
      <p key="p4">Based on the dates and income rules you provided, we project a timeline of when your income will arrive within the budget cycle. This gives you a clear picture of your cash flow.</p>,
      
      <h4 key="h4" className="text-lg font-bold text-gray-200 mt-3 mb-1">Step 4: Confirm Expenses</h4>,
      <p key="p5">Select the recurring bills you expect to pay during this budget period. If a bill's due date falls outside the budget cycle, it will be filtered out automatically. Don't forget to enter the estimated amount for each bill you select.</p>,

      <h4 key="h5" className="text-lg font-bold text-gray-200 mt-3 mb-1">Step 5: Variable Spending</h4>,
      <p key="p6">Finally, select or add any categories for day-to-day spending you want to track, like 'Groceries' or 'Gas'. These will be added to your budget with an initial amount of $0. When you're done, click <ExampleButton color="green">Finish Setup</ExampleButton> to create your budget!</p>
    ]
  },

  budget: {
    title: "The Budget Page",
    content: [
      <p key="p1">This is your command center for an active budget. Here you can track your cash flow, log transactions, and see how your spending aligns with your plan in real-time.</p>,

      <h4 key="h1" className="text-lg font-bold text-gray-200 mt-3 mb-1">Editing Your Budget Dates</h4>,
      <p key="p2">The date range for your budget is displayed at the top of the page. If you need to extend or shorten your budget period, simply click on the dates to open a modal and adjust them.</p>,

      <h4 key="h2" className="text-lg font-bold text-gray-200 mt-3 mb-1">Summary Card</h4>,
      <p key="p3">The card on the left gives you a snapshot of your budget's health, including your planned surplus or deficit. The most important number here is <strong>Current Cash</strong>, which shows the actual money you have on hand based on what you've received versus what you've paid.</p>,
      
      <h4 key="h3" className="text-lg font-bold text-gray-200 mt-3 mb-1">Planned Income</h4>,
      <p key="p4">This section lists all projected income for the budget period. When you receive money, click the <ExampleButton color="green">Receive</ExampleButton> button to confirm the amount. This will move the money into your "Current Cash" balance.</p>,
      
      <h4 key="h4" className="text-lg font-bold text-gray-200 mt-3 mb-1">Recurring Bills</h4>,
      <p key="p5">These are your regular bills like rent or subscriptions. Click the <ExampleButton color="green">Pay</ExampleButton> button to log a payment. To edit the amount or due date for just this month, click anywhere on the item to open the editor.</p>,

      <h4 key="h5" className="text-lg font-bold text-gray-200 mt-3 mb-1">Variable Spending</h4>,
      <p key="p6">This is for day-to-day expenses like groceries and gas. First, set a budget for each category using the input field and click <ExampleButton color="green">Set</ExampleButton>. Then, use the <ExampleButton color="blue">Log</ExampleButton> button to record transactions as you spend money throughout the month.</p>,
      
      <h4 key="h6" className="text-lg font-bold text-gray-200 mt-3 mb-1">Accounts Card</h4>,
      <p key="p7">If you've set up savings or checking accounts, you can transfer money to and from your budget. Use <ExampleButton color="green">Take Funds</ExampleButton> to pull money from an account into your budget (as income), or <ExampleButton color="yellow">Add Funds</ExampleButton> to move money from your budget into an account (as a savings transaction).</p>
    ]
  },

  dashboard: {
    title: "Dashboard Guide",
    content: [
      <p key="p1">The Dashboard is your financial home base. It provides a quick overview of your accounts and a history of all your past, present, and future budgets.</p>,
      
      <h4 key="h2" className="text-lg font-bold text-gray-200 mt-3 mb-1">Accounts Card</h4>,
      <p key="p2">If you have linked any savings or checking accounts, their balances will be displayed at the top. The transfer buttons (<ExampleButton color="green">Take Funds</ExampleButton> / <ExampleButton color="yellow">Add Funds</ExampleButton>) will be enabled if you have a budget currently active.</p>,
      
      <h4 key="h3" className="text-lg font-bold text-gray-200 mt-3 mb-1">Budget List</h4>,
      <p key="p3">This area shows all of your budget cycles. From here you can:</p>,
      <ul key="ul1" className="list-disc list-inside text-gray-300 mt-2 space-y-1">
        <li>Click <ExampleButton color="indigo">View</ExampleButton> to jump into your active budget.</li>
        <li>Click <ExampleButton color="yellow">Close & Review</ExampleButton> on an active budget once its end date has passed.</li>
        <li>Click <ExampleButton color="gray">Review</ExampleButton> to see the summary of a completed budget.</li>
        <li>If you don't have an active budget, a <ExampleButton color="green">Create New Budget</ExampleButton> button will appear.</li>
      </ul>
    ]
  },
  settings: {
    title: "Settings & Account Management",
    content: [
      <p key="p1">This is your central hub for managing your profile and the reusable templates for your income and bills. <strong>Changes made here affect future budgets</strong>, not your currently active one.</p>,
      
      <h4 key="h2" className="text-lg font-bold text-gray-200 mt-3 mb-1">Goals & Plans</h4>,
      <p key="p2">Here you can create, edit, or delete your savings or debt reduction goals. Having an active goal enables features like the "Accelerate Your Goal" prompt on the Budget Page.</p>,
      
      <h4 key="h3" className="text-lg font-bold text-gray-200 mt-3 mb-1">Your Accounts</h4>,
      <p key="p3">Connect your real-world checking and savings accounts here. Adding an account allows you to track its balance and transfer funds to and from your budget.</p>,

      <h4 key="h4" className="text-lg font-bold text-gray-200 mt-3 mb-1">Saved Income & Bills</h4>,
      <p key="p4">This is a list of all the income sources and recurring expenses you have saved. When you start a new budget, the items on this list will be offered as suggestions. Editing an item here updates the 'master rule' that will be used for all future budgets.</p>,

      <h4 key="h5" className="text-lg font-bold text-gray-200 mt-3 mb-1">Account Actions</h4>,
      <p key="p5">This section contains sensitive, one-time actions for your user account. You can request to change your email, start a "Fresh Start" to wipe all your data, or permanently delete your account.</p>,
    ]
  },
  
  // Placeholder for the next page
  default: {
    title: "General Help",
    content: [
      <p key="1">This is the default help text. More specific tutorials will appear depending on the page you are on.</p>
    ]
  }
};