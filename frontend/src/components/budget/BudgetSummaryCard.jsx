import React from 'react';

function BudgetSummaryCard({ budget, transactions, goals, onOpenAccelerateModal, onCloseBudget, isClosing, user }) {
  if (!budget) {
    return null; 
  }
  const activeGoal = goals && Array.isArray(goals) ? goals.find(g => g.status === 'active') : null;

  const totalExpectedIncome = budget.initial_income.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const totalExpectedExpenses = budget.initial_expenses.reduce((sum, item) => sum + parseFloat(item.estimated_amount || 0), 0);
  const expectedSurplus = totalExpectedIncome - totalExpectedExpenses;

  const totalReceivedIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpensesPaid = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const currentCash = totalReceivedIncome - totalExpensesPaid;

  // Calculate total paid recurring expenses
  const totalPaidExpenses = budget.initial_expenses
    .filter(item => item.type === 'recurring' && item.is_paid)
    .reduce((sum, item) => sum + parseFloat(item.estimated_amount || 0), 0);

  // Unpaid recurring expenses
  const unpaidRecurring = budget.initial_expenses.filter(item => item.type === 'recurring' && !item.is_paid);
  const totalUnpaidExpenses = unpaidRecurring.reduce((sum, item) => sum + parseFloat(item.estimated_amount || 0), 0);

  // Variable expenses
  const variableExpenses = budget.initial_expenses.filter(item => item.type === 'variable');
  const variableSpent = variableExpenses.reduce((sum, item) => {
    const spent = transactions.filter(t => t.type === 'expense' && t.category_name === item.label).reduce((s, t) => s + parseFloat(t.amount), 0);
    return sum + spent;
  }, 0);
  const variableBudgeted = variableExpenses.reduce((sum, item) => sum + parseFloat(item.estimated_amount || 0), 0);
  const variableRemaining = Math.max(variableBudgeted - variableSpent, 0);

  // Surplus/Deficit (Actual)
  const actualSurplus = totalReceivedIncome - totalExpensesPaid;

  // Bills paid progress
  const totalBills = budget.initial_expenses.filter(item => item.type === 'recurring').length;
  const billsPaid = budget.initial_expenses.filter(item => item.type === 'recurring' && item.is_paid).length;

  // Goal progress (if active)
  let goalProgress = null;
  if (activeGoal) {
    const goalPaid = transactions.filter(t => t.type === 'goal' && t.category_name === activeGoal.name).reduce((sum, t) => sum + parseFloat(t.amount), 0);
    goalProgress = Math.min(100, (goalPaid / parseFloat(activeGoal.target_amount || 1)) * 100);
  }

  // Largest expense
  const largestExpense = transactions.filter(t => t.type === 'expense').reduce((max, t) => parseFloat(t.amount) > max ? parseFloat(t.amount) : max, 0);

  // Average daily spending
  const start = new Date(budget.start_date);
  const end = new Date(budget.end_date);
  const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  const avgDailySpending = totalExpensesPaid / days;

  // Upcoming unpaid bills (sorted by due date)
  const upcomingBills = unpaidRecurring
    .filter(item => item.due_date)
    .sort((a, b) => parseInt(a.due_date) - parseInt(b.due_date))
    .slice(0, 3);

  const isClosable = budget.status === 'active' && new Date(`${budget.end_date}T00:00:00`) < new Date();

  const canAccelerateGoal = !user.owner_user_id || user.permission_level === 'full_access';

  return (
    <div className="flex flex-col gap-8">
      
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Summary</h2>
        <div className="space-y-3">
          <div className="pl-2 border-l-4 border-green-700 bg-green-900/10 rounded mb-2">
            <div className="flex justify-between"><span className="text-gray-400">Expected Income:</span><span className="font-semibold">${totalExpectedIncome.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Received Income:</span><span className="font-semibold text-green-500">${totalReceivedIncome.toFixed(2)}</span></div>
          </div>
          <div className="pl-2 border-l-4 border-red-700 bg-red-900/10 rounded mb-2">
            <div className="flex justify-between"><span className="text-gray-400">Planned Expenses:</span><span className="font-semibold text-red-400">${totalExpectedExpenses.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Paid Expenses:</span><span className="font-semibold text-yellow-400">${totalPaidExpenses.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Unpaid Expenses:</span><span className="font-semibold text-orange-400">${totalUnpaidExpenses.toFixed(2)}</span></div>
          </div>
          <div className="flex justify-between pt-4 border-t border-gray-600"><span className="text-gray-300 font-bold">Current Cash:</span><span className={`font-bold text-lg ${currentCash >= 0 ? 'text-green-400' : 'text-red-400'}`}>${currentCash.toFixed(2)}</span></div>
          <div className="flex justify-between">
            <span className="text-gray-400 font-bold">{expectedSurplus >= 0 ? 'Expected Surplus' : 'Expected Deficit'}:</span>
            <span className={`font-bold ${expectedSurplus >= 0 ? 'text-green-400' : 'text-red-400'}`}>${expectedSurplus.toFixed(2)}</span>
          </div>
        </div>
        {isClosable && (
          <div className="mt-6">
            <button
              onClick={onCloseBudget}
              disabled={isClosing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500"
            >
              {isClosing ? 'Closing...' : 'Close & Review Budget'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BudgetSummaryCard;