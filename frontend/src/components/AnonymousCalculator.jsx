// =================================================================
// FILE: /frontend/src/components/AnonymousCalculator.jsx
// =================================================================
import React, { useState } from 'react';

function AnonymousCalculator({ onShowAuth }) {
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState([{ name: '', amount: '' }]);

  const handleExpenseChange = (index, field, value) => {
    const newExpenses = [...expenses];
    newExpenses[index][field] = value;
    setExpenses(newExpenses);
  };

  const addExpense = () => {
    setExpenses([...expenses, { name: '', amount: '' }]);
  };

  const calculateTotalExpenses = () => {
    return expenses.reduce((total, exp) => total + Number(exp.amount || 0), 0);
  };

  const totalExpenses = calculateTotalExpenses();
  const remaining = Number(income || 0) - totalExpenses;

  return (
    <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
      <h1 className="text-3xl font-bold text-center mb-2 text-white">Check2Check</h1>
      <p className="text-center text-gray-400 mb-6">A simple budgeting tool for the paycheck-to-paycheck life.</p>

      <div className="mb-4">
        <label htmlFor="income" className="block text-sm font-medium text-gray-300 mb-1">Your Available Cash</label>
        <input
          type="number"
          id="income"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          placeholder="e.g., 1500"
          className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <h2 className="text-lg font-semibold mb-2 text-gray-300">Expected Expenses</h2>
      {expenses.map((expense, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <input
            type="text"
            value={expense.name}
            onChange={(e) => handleExpenseChange(index, 'name', e.target.value)}
            placeholder="e.g., Rent"
            className="w-2/3 bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <input
            type="number"
            value={expense.amount}
            onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
            placeholder="e.g., 800"
            className="w-1/3 bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      ))}

      <button onClick={addExpense} className="w-full text-sm text-indigo-400 hover:text-indigo-300 mb-6">+ Add Another Expense</button>

      <div className="bg-gray-900 rounded-lg p-4 text-center">
        <p className="text-gray-400 text-sm">Cash Remaining</p>
        <p className={`text-4xl font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-500'}`}>
          ${remaining.toFixed(2)}
        </p>
      </div>

      <div className="mt-6 text-center">
          <button
              onClick={onShowAuth}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg w-full transition-colors"
          >
              Create Free Account to Save & Track
          </button>
          <p className="text-xs text-gray-500 mt-2">No passwords, no bank connections, no ads.</p>
      </div>
    </div>
  );
}

export default AnonymousCalculator;