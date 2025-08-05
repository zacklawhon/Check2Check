import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import ExpenseDetailModal from './ExpenseDetailModal';

function RecurringExpenseItem({ item, budgetId, onUpdate }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [amount, setAmount] = useState(item.estimated_amount || '');

    const handleSetAmount = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/budget/update-recurring-amount/${budgetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id: item.id, amount: parseFloat(amount) })
            });
            if (!response.ok) throw new Error('Failed to set amount.');
            onUpdate();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- FIX: Restored the logic for the handleMarkPaid function ---
    const handleMarkPaid = async (e) => {
        e.stopPropagation(); // Prevent the detail modal from opening
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/budget/mark-bill-paid/${budgetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ label: item.label, amount: item.estimated_amount })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to mark as paid.');
            }
            onUpdate(); // Refresh the budget data
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // --- FIX: Restored the logic for the handleDeleteConfirm function ---
    const handleDeleteConfirm = async () => {
        setIsConfirmModalOpen(false);
        try {
            const response = await fetch(`/api/budget/remove-expense/${budgetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ label: item.label })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to remove expense.');
            }
            onUpdate();
        } catch (err) {
            setError(err.message); 
        }
    };
    
    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setIsConfirmModalOpen(true);
    };

    if (!item.estimated_amount) {
        return (
            <li className="bg-gray-700 p-3 rounded-md">
                <form onSubmit={handleSetAmount} className="flex justify-between items-center gap-4">
                    <div className="flex-grow">
                        <span className="font-semibold">{item.label}</span>
                        <div className="text-xs text-gray-400 capitalize">{item.category} (Due: {item.due_date})</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400">$</span>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-24 bg-gray-800 text-white rounded-md p-1 border border-gray-600"
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading} className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg disabled:bg-gray-500">
                        {loading ? '...' : 'Set'}
                    </button>
                </form>
                {error && <p className="text-red-400 text-xs mt-1 text-right">{error}</p>}
            </li>
        );
    }

    return (
        <>
            <li 
                onClick={() => setIsDetailModalOpen(true)}
                className={`flex justify-between items-center bg-gray-700 p-3 rounded-md transition-all ${item.is_paid ? 'opacity-50' : 'hover:bg-gray-600 cursor-pointer'}`}
            >
                <div>
                    <span className={`${item.is_paid ? 'line-through' : ''}`}>{item.label}</span>
                    <span className="text-xs text-gray-400 block capitalize">
                        {item.category} {item.due_date ? `(Due: ${item.due_date})` : ''}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span>- ${parseFloat(item.estimated_amount).toFixed(2)}</span>
                    <button
                        onClick={handleMarkPaid}
                        disabled={loading || item.is_paid}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-sm rounded-lg disabled:bg-gray-500"
                    >
                        {item.is_paid ? 'Paid' : 'Pay'}
                    </button>
                    <button onClick={handleDeleteClick} className="text-gray-400 hover:text-white font-bold text-lg">&times;</button>
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
            
            <ExpenseDetailModal 
                item={item} 
                isOpen={isDetailModalOpen} 
                onClose={() => setIsDetailModalOpen(false)}
                budgetId={budgetId}
                onUpdate={onUpdate}
            />
        </>
    );
}

export default RecurringExpenseItem;