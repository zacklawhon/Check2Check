import React, { useState } from 'react';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import ExpenseDetailModal from './modals/ExpenseDetailModal';
import { getDayWithOrdinal } from '../utils/formatters';
import toast from 'react-hot-toast';

function RecurringExpenseItem({ item, budgetId, onUpdate, onEditInBudget, user }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [amount, setAmount] = useState(item.estimated_amount || '');

    const isReadOnly = user.is_partner && user.permission_level === 'read_only';
    const isUpdateByRequest = user.is_partner && user.permission_level === 'update_by_request';
    const isOwner = !user.is_partner;

    const handleApprove = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/sharing/approve/${item.pending_request.id}`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Failed to approve request.');
            toast.success('Request approved!');
            onUpdate();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSetAmount = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/budget-items/recurring-expense/${budgetId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ label: item.label, estimated_amount: parseFloat(amount), due_date: item.due_date })
            });
            if (!response.ok) throw new Error('Failed to set amount.');
            onUpdate();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async (e) => {
        e.stopPropagation();

        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/budget-items/mark-bill-paid/${budgetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ label: item.label, amount: item.estimated_amount })
            });
            if (!response.ok) { const data = await response.json(); throw new Error(data.message || 'Failed to mark as paid.'); }
            onUpdate();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkUnpaid = async (e) => {
        e.stopPropagation();

        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/budget-items/mark-bill-unpaid/${budgetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ label: item.label })
            });
            if (!response.ok) { const data = await response.json(); throw new Error(data.message || 'Failed to undo payment.'); }
            onUpdate();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setIsConfirmModalOpen(false);
        try {
            const response = await fetch(`/api/budget-items/remove-expense/${budgetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ label: item.label })
            });
            if (!response.ok) { const data = await response.json(); throw new Error(data.message || 'Failed to remove expense.'); }
            onUpdate();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteClick = (e) => { e.stopPropagation(); setIsConfirmModalOpen(true); };

    const handleEditClick = (e) => {
        e.stopPropagation();
            onEditInBudget(item);
    }

    // This section is for items that don't have an amount set yet.
    if (item.pending_request) {
        return (
            <li className="p-3 rounded-md bg-yellow-900/50 border-2 border-yellow-500">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-sm text-yellow-300 italic">
                            Pending approval: {item.pending_request.description}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-sm rounded-lg">
                            Approve
                        </button>
                        {/* You would also add a handleDeny function and button here */}
                    </div>
                </div>
            </li>
        );
    }

    if (!item.estimated_amount) {
        return (
            <li className="bg-gray-700 p-3 rounded-md">
                <form onSubmit={handleSetAmount} className="flex justify-between items-center gap-4">
                    <div className="flex-grow">
                        <span className="font-semibold">{item.label}</span>
                        <div className="text-xs text-gray-400 capitalize">{item.category} (Due: {getDayWithOrdinal(parseInt(item.due_date, 10))})</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">$</span>
                        <div>
                            <label htmlFor={`expense-amount-${item.id}`} className="sr-only">Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                id={`expense-amount-${item.id}`}
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-24 bg-gray-800 text-white rounded-md p-1 border border-gray-600"
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={loading || isReadOnly} className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg disabled:bg-gray-500">
                        {loading ? '...' : 'Set'}
                    </button>
                </form>
                {error && <p className="text-red-400 text-xs mt-1 text-right">{error}</p>}
            </li>
        );
    }

    // This is for items that have an amount and can be paid or unpaid.
    return (
        <>
            {/* 1. Add the onClick and interactive styles back to the list item */}
            <li
                onClick={!item.is_paid && isOwner ? () => onEditInBudget(item) : undefined}
                className={`flex justify-between items-center bg-gray-700 p-3 rounded-md transition-all ${item.is_paid ? 'opacity-50' : 'hover:bg-gray-600 cursor-pointer'}`}
            >
                <div>
                    <span className={`${item.is_paid ? 'line-through' : ''}`}>{item.label}</span>
                    <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                        <span className="capitalize">{item.category}</span>
                        {item.due_date && <span>(Due: {getDayWithOrdinal(parseInt(item.due_date, 10))})</span>}
                        {item.principal_balance && <span className="hidden sm:inline">(Bal: ${item.principal_balance})</span>}
                        {item.interest_rate && <span className="hidden sm:inline">({item.interest_rate}%)</span>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span>- ${parseFloat(item.estimated_amount).toFixed(2)}</span>

                    {/* 2. The separate "Edit" button has been removed from here */}

                    {item.is_paid ? (
                        <button
                            onClick={handleMarkUnpaid}
                            disabled={loading || isReadOnly}
                            className="bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-1 px-3 text-sm rounded-lg disabled:bg-gray-500"
                        >
                            Undo
                        </button>
                    ) : (
                        <button
                            onClick={handleMarkPaid}
                            disabled={loading || isReadOnly}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-sm rounded-lg disabled:bg-gray-500"
                        >
                            Pay
                        </button>
                    )}

                    <button
                        onClick={handleDeleteClick}
                        className="text-gray-400 hover:text-white font-bold text-lg disabled:text-gray-600 disabled:cursor-not-allowed"
                        disabled={item.is_paid || loading || isReadOnly}
                    >
                        &times;
                    </button>
                </div>
                {error && <p className="text-red-500 text-xs w-full text-right mt-1">{error}</p>}
            </li>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Confirm Deletion"
                message={`Are you sure you want to remove "${item.label}" from this budget?`}
            />
        </>
    );
}

export default RecurringExpenseItem;