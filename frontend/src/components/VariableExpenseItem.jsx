import React, { useState } from 'react';
import LogTransactionModal from './modals/LogTransactionModal';
import ConfirmationModal from './modals/ConfirmationModal'; // Import the new component

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

    return (
        <>
            <li className="bg-gray-700 p-3 rounded-md">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex-grow">
                        <span className="font-semibold">{item.label}</span>
                        <div className="text-xs text-gray-400">
                            <span>Spent: ${totalSpent.toFixed(2)}</span>
                            <span className="mx-2">|</span>
                            <span>Remaining: ${remainingBudget.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <form onSubmit={handleBudgetSet} className="flex items-center gap-2">
                            <span className="text-gray-400">$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={budgetedAmount}
                                onChange={(e) => setBudgetedAmount(e.target.value)}
                                placeholder="0.00"
                                className="bg-gray-600 w-24 text-white rounded-lg p-1 border border-gray-500 text-right focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                required
                            />
                            <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-sm rounded-lg disabled:bg-gray-500">
                                {loading ? '...' : 'Set'}
                            </button>
                        </form>
                        <button onClick={() => setIsLogModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 text-sm rounded-lg">Log</button>
                        <button onClick={() => setIsConfirmModalOpen(true)} className="text-gray-400 hover:text-white font-bold text-lg">&times;</button>
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
