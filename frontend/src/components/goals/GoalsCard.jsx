import React, { useState } from 'react';
import GoalPaymentModal from './GoalPaymentModal';
import { useNavigate } from 'react-router-dom';

function GoalsCard({ goals, budgetId, onGoalUpdated, disableActions, surplus, onEdit, onDelete, onAddMore }) {
  const [selectedGoal, setSelectedGoal] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-green-400">Your Goals</h3>
        <button
          onClick={onAddMore || (() => navigate('/goals'))}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
        >
          + Add More Goals
        </button>
      </div>
      {typeof surplus === 'number' && (
        <div className="mb-4 text-center text-lg font-semibold text-blue-300">
          Expected Surplus: <span className={surplus >= 0 ? 'text-green-400' : 'text-red-400'}>${surplus.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
        </div>
      )}
      {goals.length === 0 && <div className="text-gray-400">No active goals.</div>}
      {goals.map(goal => {
        const progress = Math.max(0, Math.min(100, goal.goal_type === 'debt_reduction'
          ? 100 - (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100
          : (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100));
        const remaining = goal.goal_type === 'debt_reduction'
          ? parseFloat(goal.current_amount)
          : parseFloat(goal.target_amount) - parseFloat(goal.current_amount);
        return (
          <div key={goal.id} className="mb-6 last:mb-0 bg-gray-700 p-4 rounded-md">
            <div className="flex justify-between items-center mb-1">
              <div className="font-semibold text-white text-lg">{goal.goal_name}</div>
              <span className="text-xs px-2 py-1 rounded bg-gray-900 text-gray-300 uppercase">{goal.goal_type === 'debt_reduction' ? 'Debt' : 'Savings'}</span>
            </div>
            <div className="w-full bg-gray-900 rounded h-3 mb-2">
              <div
                className={`h-3 rounded ${goal.goal_type === 'debt_reduction' ? 'bg-red-400' : 'bg-green-400'}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>{goal.goal_type === 'debt_reduction' ? 'Remaining' : 'Saved'}: ${parseFloat(goal.current_amount).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
              <span>Target: ${parseFloat(goal.target_amount).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
            </div>
            <div className="flex gap-2 mb-2">
              {budgetId && (
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-4 rounded-lg text-sm disabled:bg-gray-500 disabled:opacity-60"
                  onClick={() => setSelectedGoal(goal)}
                >
                  {goal.goal_type === 'debt_reduction' ? 'Pay Down' : 'Contribute'}
                </button>
              )}
              {(onEdit || onDelete) && (
                <div className="flex gap-2 ml-6">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(goal)}
                      className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 py-1 px-3 rounded-md"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(goal)}
                      className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 py-1 px-3 rounded-md"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-400 capitalize">Strategy: {goal.strategy}</div>
          </div>
        );
      })}
      {selectedGoal && budgetId && (
        <GoalPaymentModal
          goal={selectedGoal}
          budgetId={budgetId}
          onClose={() => setSelectedGoal(null)}
          onSuccess={updatedGoal => {
            setSelectedGoal(null);
            if (onGoalUpdated) onGoalUpdated(updatedGoal);
          }}
        />
      )}
    </div>
  );
}

export default GoalsCard;
