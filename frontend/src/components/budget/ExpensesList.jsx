import React from 'react';
import RecurringExpenseItem from './RecurringExpenseItem';
import VariableExpenseItem from './VariableExpenseItem';

function ExpensesList({ expenseItems, transactions, budget, budgetId, user, onAddItem, onEditItem, onStateUpdate, onItemRequest, pendingRequests, onItemRequestCancel }) {
  if (!expenseItems || !transactions) {
    return null;
  }
  const canEdit = !user.is_partner || user.permission_level !== 'read_only';

  const recurringExpenses = expenseItems.filter(exp => exp.type === 'recurring');
  const variableExpenses = expenseItems.filter(exp => exp.type === 'variable');

  const groupedRecurring = recurringExpenses.reduce((acc, expense) => {
    const category = expense.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(expense);
    return acc;
  }, {});

  return (
    <div>
      <h3 className="text-xl font-bold mb-3 text-red-400">Expenses</h3>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-gray-300">Recurring Bills</h4>
          {canEdit && (
            <button
              onClick={() => onAddItem('recurring')}
              className="text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg"
            >
              + Add
            </button>
          )}
        </div>
        <div className="space-y-4">
          {Object.keys(groupedRecurring).sort().map(category => (
            <div key={category}>
              <h5 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{category}</h5>
              <ul className="space-y-2">
                {groupedRecurring[category].map((item, index) => (
                  <RecurringExpenseItem
                    key={`rec-exp-${item.id || index}`}
                    item={item}
                    budgetId={budgetId}
                    budget={budget}
                    onUpdate={onStateUpdate}
                    itemTransactions={transactions}
                    user={user}
                    onEditInBudget={() => onEditItem(item)}
                    onItemRequest={onItemRequest}
                    onItemRequestCancel={onItemRequestCancel}
                    isPending={pendingRequests.includes(item.label)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <hr className="border-gray-700 my-6" />
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-gray-300">Variable Spending</h4>
          {canEdit && (
            <button
              onClick={() => onAddItem('variable')}
              className="text-sm bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-1 px-3 rounded-lg"
            >
              + Add
            </button>
          )}
        </div>
        <ul className="space-y-2">
          {variableExpenses.map((item, index) => (
            <VariableExpenseItem
              key={`var-exp-${item.label}-${index}`}
              item={item}
              budgetId={budgetId}
              user={user}
              onUpdate={onStateUpdate} // Correctly passing the new handler
              itemTransactions={transactions.filter(t => t.type === 'expense' && t.category_name === item.label)}
              onItemRequest={onItemRequest}
              isPending={pendingRequests.includes(item.label)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ExpensesList;