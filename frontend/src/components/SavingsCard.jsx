import React, { useState, useEffect } from 'react';

// --- The Modal Component ---
// We pass `budgetId` down to this component to control its options.
const SavingsActionModal = ({ isOpen, onClose, onConfirm, action, loading, budgetId }) => {
    const [amount, setAmount] = useState('');
    const [withdrawalType, setWithdrawalType] = useState('income');

    // --- 1. This new `useEffect` hook smartly changes the default selection ---
    // If the modal opens for a withdrawal and there's no active budget,
    // it automatically selects "External Withdrawal" for the user.
    useEffect(() => {
        if (isOpen && action === 'withdraw') {
            if (!budgetId) {
                setWithdrawalType('external');
            } else {
                setWithdrawalType('income');
            }
        }
    }, [isOpen, action, budgetId]);


    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm({ amount, withdrawalType });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 text-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h3 className="text-lg font-bold mb-4">{action === 'add' ? 'Add to Savings' : 'Withdraw from Savings'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="savings-amount" className="block text-sm font-semibold mb-2">Amount</label>
                        <input
                            id="savings-amount" type="number" step="0.01" value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00" autoFocus required
                            className="w-full bg-gray-900/50 text-white rounded-lg p-2 border border-gray-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                        />
                    </div>

                    {action === 'withdraw' && (
                        <div>
                            <label className="block text-sm font-semibold mb-3">How should this withdrawal be treated?</label>
                            <div className="space-y-3">
                                {/* --- 2. This radio button is now disabled if there's no budgetId --- */}
                                <label className={`flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border-2 border-transparent has-[:checked]:border-indigo-500 ${!budgetId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <input type="radio" name="withdrawalType" value="income"
                                        checked={withdrawalType === 'income'}
                                        onChange={(e) => setWithdrawalType(e.target.value)}
                                        disabled={!budgetId}
                                        className="h-4 w-4 text-indigo-500 bg-gray-600 border-gray-500 focus:ring-indigo-500 disabled:cursor-not-allowed"
                                    />
                                    <div>
                                        <p className="font-semibold">Transfer to Budget as Income</p>
                                        <p className="text-xs text-gray-400">Adds cash to your current budget to cover expenses.</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border-2 border-transparent has-[:checked]:border-indigo-500 cursor-pointer">
                                    <input type="radio" name="withdrawalType" value="external"
                                        checked={withdrawalType === 'external'}
                                        onChange={(e) => setWithdrawalType(e.target.value)}
                                        className="h-4 w-4 text-indigo-500 bg-gray-600 border-gray-500 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="font-semibold">Record as External Withdrawal</p>
                                        <p className="text-xs text-gray-400">Doesn't affect your budget's income or expenses.</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:bg-gray-500">
                            {loading ? 'Processing...' : `Confirm ${action === 'add' ? 'Deposit' : 'Withdrawal'}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- The Main SavingsCard Component ---
export default function SavingsCard({ balance, budgetId, onUpdate }) {
    const [modalAction, setModalAction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAction = async (payload) => {
        const { amount, withdrawalType } = payload;
        
        if (!amount || parseFloat(amount) <= 0) { setError('Please enter a valid amount.'); return; }

        setLoading(true);
        setError('');

        const url = `/api/budget/savings/${modalAction}/${budgetId}`;
        
        const body = { amount: parseFloat(amount) };
        if (modalAction === 'withdraw') {
            body.withdrawal_type = withdrawalType;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'An unknown error occurred.');
            }
            
            setModalAction(null);
            onUpdate();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // --- 3. This logic now clearly defines when each button is disabled ---
    const isAddDisabled = !budgetId;
    const isWithdrawDisabled = false; // The Withdraw button is now always enabled.

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Savings</h2>
            <div className="text-center mb-4">
                <p className="text-gray-400 text-sm">Current Balance</p>
                <p className="text-3xl font-bold text-teal-400">${parseFloat(balance || 0).toFixed(2)}</p>
            </div>

            {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
            
            <div className="flex gap-4">
                <button 
                    onClick={() => setModalAction('add')}
                    disabled={isAddDisabled}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Add
                </button>
                <button 
                    onClick={() => setModalAction('withdraw')}
                    disabled={isWithdrawDisabled}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    Withdraw
                </button>
            </div>

            {/* --- 4. Show this helper text only when the Add button is disabled --- */}
            {isAddDisabled && (
                <p className="text-xs text-center text-gray-400 mt-3">
                    An active budget is required to add to savings.
                </p>
            )}

            <SavingsActionModal 
                isOpen={!!modalAction}
                onClose={() => { setModalAction(null); setError(''); }}
                onConfirm={handleAction}
                action={modalAction}
                loading={loading}
                budgetId={budgetId} // Pass budgetId to the modal
            />
        </div>
    );
}