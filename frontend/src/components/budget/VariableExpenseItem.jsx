import React, { useState } from 'react';
import LogTransactionModal from './modals/LogTransactionModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';

function VariableExpenseItem({ item, budgetId, onUpdate, transactions }) {
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [budgetedAmount, setBudgetedAmount] = useState(item.estimated_amount || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const totalSpent = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const remainingBudget = parseFloat(budgetedAmount || 0) - totalSpent;

    const handleBudgetSet = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/budget/update-variable-amount/${budgetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ label: item.label, amount: budgetedAmount })
            });

            if(!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to update amount.');
            }
            
            onUpdate();

        } catch(err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <>
            <li className="bg-gray-700 p-3 rounded-md">
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
                        <form onSubmit={handleBudgetSet} className="flex items-center gap-2">
                            <span className="text-gray-400">$</span>
                            <div className="flex-grow">
                                {/* The label is hidden visually but available for screen readers. */}
                                <label htmlFor={`budget-amount-${item.label}`} className="sr-only">Budgeted Amount</label>
                                {/* 3. The input now grows to fill the space and has responsive width. */}
                                <input
                                    type="number"
                                    step="0.01"
                                    id={`budget-amount-${item.label}`}
                                    value={budgetedAmount}
                                    onChange={(e) => setBudgetedAmount(e.target.value)}
                                    placeholder="Budget"
                                    className="bg-gray-600 w-full sm:w-24 text-white rounded-lg p-1 border border-gray-500 text-right focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-sm rounded-lg disabled:bg-gray-500">
                                {loading ? '...' : 'Set'}
                            </button>
                        </form>
                        <button onClick={() => setIsLogModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 text-sm rounded-lg">Log</button>
                        <button onClick={() => setIsConfirmModalOpen(true)} className="absolute top-2 right-2 md:static text-gray-400 hover:text-white font-bold text-lg">&times;</button>
                    </div>
                </div>
                {error && <p className="text-red-500 text-xs mt-1 text-right">{error}</p>}
                {isLogModalOpen && (
                    <LogTransactionModal
                        budgetId={budgetId}
                        categoryName={item.label}
                        onClose={() => setIsLogModalOpen(false)}
                        onSuccess={() => {
                            setIsLogModalOpen(false);
                            onUpdate();
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
            />
        </>
    );
}

export default VariableExpenseItem;