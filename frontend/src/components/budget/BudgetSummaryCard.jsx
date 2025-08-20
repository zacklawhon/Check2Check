import React from 'react';

function BudgetSummaryCard({ budget, transactions, goals, onOpenAccelerateModal, onCloseBudget, isClosing }) {
  // --- All calculation logic is now contained within this component ---
  const totalExpectedIncome = budget.initial_income.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const totalExpectedExpenses = budget.initial_expenses.reduce((sum, item) => sum + parseFloat(item.estimated_amount || 0), 0);
  const expectedSurplus = totalExpectedIncome - totalExpectedExpenses;

  const totalReceivedIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpensesPaid = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const currentCash = totalReceivedIncome - totalExpensesPaid;
  
  const activeGoal = goals.find(g => g.status === 'active');
  const isClosable = budget.status === 'active' && new Date(`${budget.end_date}T00:00:00`) < new Date();

  return (
    <div className="flex flex-col gap-8">
      {expectedSurplus > 0 && activeGoal && (
        <div className="bg-indigo-800 p-6 rounded-lg shadow-xl border border-indigo-500">
          <h2 className="text-2xl font-bold mb-3 text-center">Accelerate Your Goal!</h2>
          <p className="text-indigo-200 text-center mb-4">
            You have an expected surplus of <strong className="text-white">${expectedSurplus.toFixed(2)}</strong>.
          </p>
          <button
            onClick={onOpenAccelerateModal}
            className="w-full bg-white text-indigo-800 font-bold py-2 px-4 rounded-lg hover:bg-indigo-100"
          >
            Apply Surplus
          </button>
        </div>
      )}
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Summary</h2>
        <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-400">Expected Income:</span><span className="font-semibold">${totalExpectedIncome.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Received Income:</span><span className="font-semibold text-green-500">${totalReceivedIncome.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Planned Expenses:</span><span className="font-semibold text-red-400">${totalExpectedExpenses.toFixed(2)}</span></div>
            <div className="flex justify-between pt-4 border-t border-gray-600"><span className="text-gray-300 font-bold">Current Cash:</span><span className={`font-bold text-lg ${currentCash >= 0 ? 'text-green-400' : 'text-red-400'}`}>${currentCash.toFixed(2)}</span></div>
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