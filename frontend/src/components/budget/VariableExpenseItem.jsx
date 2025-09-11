import React, { useState, useEffect } from 'react';
import LogTransactionModal from './modals/LogTransactionModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import * as api from '../../utils/api';
import { toast } from 'react-hot-toast';

function VariableExpenseItem({ item, budgetId, user, onStateUpdate, onRemove, itemTransactions, isPending, onItemRequest, onEdit }) {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [inputAmount, setInputAmount] = useState(item.estimated_amount || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setInputAmount(item.estimated_amount || '');
  }, [item.estimated_amount]);

  if (!itemTransactions) {
    return null;
  }

  const isReadOnly = user.is_partner && user.permission_level === 'read_only';
  const isUpdateByRequest = user.is_partner && user.permission_level === 'update_by_request';
  const isFullAccess = user.is_partner && user.permission_level === 'full_access';

  const totalSpent = itemTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const remainingBudget = Math.max(parseFloat(item.estimated_amount || 0) - totalSpent, 0);

  const handleBudgetSet = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.updateVariableExpenseAmount(budgetId, { label: item.label, amount: inputAmount });
      onStateUpdate(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsConfirmModalOpen(false);
    try {
      const response = await api.removeExpenseItem(budgetId, item.label);
      onStateUpdate(response);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApprove = async (action) => {
    setLoading(true);
    try {
      const response = await (action === 'approve' ? api.approveRequest(item.pending_request.id) : api.denyRequest(item.pending_request.id));
      onStateUpdate(response); // Trigger a full state update with the backend response
    } catch (err) {
      // API client shows toast
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: Handler for Canceling Request ---
  const handleCancelRequest = async () => {
    if (!item.pending_request) return;
    setLoading(true);
    try {
      const response = await api.cancelRequest(item.pending_request.id);
      onStateUpdate(response);
    } catch (err) {
      // API client shows toast
    } finally {
      setLoading(false);
    }
  };

  if (item.pending_request) {
    // Partner's View for a pending item
    if (isUpdateByRequest) {
      return (
        <li className="flex justify-between items-center p-3 rounded-md bg-yellow-900/50">
          <div>
            <p className="font-semibold text-gray-300">{item.label}</p>
            <p className="text-xs text-yellow-400 italic">
              {item.pending_request.description}
            </p>
          </div>
          <button
            onClick={handleCancelRequest}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded"
          >
            {loading ? '...' : 'Cancel'}
          </button>
        </li>
      );
    }

    // Owner's View for a pending item
    if (!user.owner_user_id) {
      return (
        <li className="p-3 rounded-md bg-yellow-900/50 border-2 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">{item.label}</p>
              <p className="text-sm text-yellow-300 italic">
                Pending: {item.pending_request.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleApprove('approve')} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-sm rounded-lg">Approve</button>
              <button onClick={() => handleApprove('deny')} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 text-sm rounded-lg">Deny</button>
            </div>
          </div>
        </li>
      );
    }
  }

  if (item.is_goal_payment) {
    return (
      <li className="bg-gray-700 p-3 rounded-md opacity-70">
        <div className="flex justify-between items-center">
          <span className="font-semibold line-through">{item.label}</span>
          <span className="font-semibold text-gray-400">-${parseFloat(item.estimated_amount).toFixed(2)}</span>
        </div>
      </li>
    );
  }

  if (isReadOnly) {
    return (
      <li className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
        <div>
          <span className="font-semibold">{item.label}</span>
          <div className="text-xs text-gray-400">
            <span>Spent: ${totalSpent.toFixed(2)}</span>
            <span className="mx-2">|</span>
            <span>Remaining: ${remainingBudget.toFixed(2)}</span>
          </div>
        </div>
        <span>- ${parseFloat(item.estimated_amount).toFixed(2)}</span>
      </li>
    );
  }

  return (
    <>
      <li
        className={`bg-gray-700 p-3 rounded-md ${typeof onEdit === 'function' && !isReadOnly ? 'hover:bg-gray-600 cursor-pointer' : ''}`}
        onClick={() => (typeof onEdit === 'function' && !isReadOnly) ? onEdit(item) : undefined}
      >
        {/* 1. This is the main container. We make it a column on mobile and a row on desktop. */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
          <div className="flex-grow">
            <span className="font-semibold">{item.label}</span>
            <div className="text-xs text-gray-400">
              <span>Spent: ${totalSpent.toFixed(2)}</span>
              <span className="mx-2">|</span>
              <span>Remaining: ${remainingBudget.toFixed(2)}</span>
            </div>
          </div>
          {/* 2. This container for the buttons now takes up the full width and stacks its content on mobile. */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <form onSubmit={isReadOnly ? undefined : handleBudgetSet} className="flex items-center gap-2">
              <span className="text-gray-400">$</span>
              <div className="flex-grow">
                {/* The label is hidden visually but available for screen readers. */}
                <label htmlFor={`budget-amount-${item.label}`} className="sr-only">Budgeted Amount</label>
                {/* 3. The input now grows to fill the space and has responsive width. */}
                <input
                  type="number"
                  step="0.01"
                  id={`budget-amount-${item.label}`}
                  value={inputAmount}
                  onChange={isReadOnly ? undefined : (e) => setInputAmount(e.target.value)}
                  placeholder="Budget"
                  className="bg-gray-600 w-full sm:w-24 text-white rounded-lg p-1 border border-gray-500 text-right focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                  disabled={isReadOnly}
                />
              </div>
              <button type="submit" disabled={loading || isReadOnly} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-sm rounded-lg disabled:bg-gray-500">
                {loading ? '...' : 'Set'}
              </button>
            </form>
            <button onClick={isReadOnly ? undefined : () => setIsLogModalOpen(true)} disabled={isReadOnly} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 text-sm rounded-lg disabled:bg-gray-500">Log</button>
            <button onClick={isReadOnly ? undefined : () => setIsConfirmModalOpen(true)} disabled={isReadOnly} className="absolute top-2 right-2 md:static text-gray-400 hover:text-white font-bold text-lg">&times;</button>
          </div>
        </div>
        {error && <p className="text-red-500 text-xs mt-1 text-right">{error}</p>}
        {isLogModalOpen && (
          <LogTransactionModal
            budgetId={budgetId}
            user={user}
            categoryName={item.label}
            spent={totalSpent}
            remaining={remainingBudget}
            onClose={() => setIsLogModalOpen(false)}
            onSuccess={(response) => {
              setIsLogModalOpen(false);
              onStateUpdate(response);
            }}
          />
        )}
      </li>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        message={`Are you sure you want to remove "${item.label}" from this budget?`}
        user={user}
      />
    </>
  );
}

export default VariableExpenseItem;