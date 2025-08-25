import React, { useState } from 'react';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import ExpenseDetailModal from './modals/ExpenseDetailModal';
import { getDayWithOrdinal } from '../utils/formatters';
import toast from 'react-hot-toast';
import * as api from '../../utils/api';

function RecurringExpenseItem({ item, budgetId, onUpdate, onEditInBudget, user, isPending }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [amount, setAmount] = useState(item.estimated_amount || '');

    const isReadOnly = user.is_partner && user.permission_level === 'read_only';
    const isUpdateByRequest = user.is_partner && user.permission_level === 'update_by_request';
    const isOwner = !user.owner_user_id;

    const handleApprove = async (action) => {
        setLoading(true);
        try {
            if (action === 'approve') {
                await api.approveRequest(item.pending_request.id);
            } else {
                await api.denyRequest(item.pending_request.id);
            }
            toast.success(`Request ${action}d!`);
            onUpdate();
        } catch (err) {
            // API client shows toast
        } finally {
            setLoading(false);
        }
    };

    const handleSetAmount = async (e) => {
        e.preventDefault();
        const payload = { label: item.label, estimated_amount: parseFloat(amount), due_date: item.due_date };
        if (isUpdateByRequest) {
            const description = `Set amount for '${item.label}' to $${parseFloat(amount).toFixed(2)}`;
            const data = await api.handlePartnerAction('update_recurring_expense', description, budgetId, payload);
            toast.success(data.message);
            onItemRequest(item.label);
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.updateRecurringExpenseInCycle(budgetId, payload);
            onUpdate();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async (e) => {
        e.stopPropagation();
        const payload = { label: item.label, amount: item.estimated_amount };
        if (isUpdateByRequest) {
            const description = `Pay bill: '${item.label}' for $${item.estimated_amount}`;
            const data = await api.handlePartnerAction('mark_bill_paid', description, budgetId, payload);
            toast.success(data.message);
            onItemRequest(item.label);
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.markBillPaid(budgetId, payload);
            onUpdate();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkUnpaid = async (e) => {
        e.stopPropagation();
        const payload = { label: item.label };
        if (isUpdateByRequest) {
            const description = `Mark bill as unpaid: '${item.label}'.`;
            const data = await api.handlePartnerAction('mark_bill_unpaid', description, budgetId, payload);
            toast.success(data.message);
            onItemRequest(item.label);
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.markBillUnpaid(budgetId, payload);
            onUpdate();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setIsConfirmModalOpen(false);
        const payload = { label: item.label };
        if (isUpdateByRequest) {
            const description = `Remove expense: '${item.label}'`;
            const data = await api.handlePartnerAction('remove_expense', description, budgetId, payload);
            toast.success(data.message);
            onItemRequest(item.label);
            return;
        }
        try {
            await api.removeExpenseItem(budgetId, item.label);
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

    if (isPending) {
        return (
            <li className="flex justify-between items-center p-3 rounded-md bg-yellow-900/50">
                <div>
                    <p className="font-semibold text-gray-300">{item.label}</p>
                    <p className="text-xs text-yellow-400">A request has been sent for this item.</p>
                </div>
                <button disabled className="bg-yellow-600 text-white text-xs font-bold py-1 px-2 rounded cursor-not-allowed">
                    Requested
                </button>
            </li>
        );
    }

    // This section is for items that don't have an amount set yet.
    if (isOwner && item.pending_request) {
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
                        <button onClick={() => handleApprove('approve')} disabled={loading} className="bg-green-600 ...">Approve</button>
                        <button onClick={() => handleApprove('deny')} disabled={loading} className="bg-red-600 ...">Deny</button>
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
                className={`flex justify-between items-center bg-gray-700 p-3 rounded-md transition-all ${item.is_paid ? 'opacity-50' : isOwner ? 'hover:bg-gray-600 cursor-pointer' : ''}`}
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