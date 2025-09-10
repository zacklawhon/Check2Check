import React, { useState } from 'react';
import * as api from '../../utils/api';

function GoalPaymentModal({ goal, budgetId, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const paymentType = goal.goal_type === 'debt_reduction' ? 'debt' : 'savings';
      const response = await api.logGoalPayment(goal.id, {
        amount,
        budgetId,
        paymentType
      });
      if (onSuccess) onSuccess(response);
    } catch (err) {
      setError(err.message || 'Could not log payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl">&times;</button>
        <h2 className="text-xl font-bold text-white mb-4">{goal.goal_type === 'debt_reduction' ? 'Pay Down Debt' : 'Contribute to Goal'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-400">Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
              required
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
              {loading ? 'Saving...' : goal.goal_type === 'debt_reduction' ? 'Pay Down' : 'Contribute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GoalPaymentModal;
