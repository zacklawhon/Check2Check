import React, { useState } from 'react';

function InitialIncomeItem({ item, budgetId, onUpdate }) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSetAmount = async (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            // --- FIX: This now calls the correct endpoint we created ---
            const response = await fetch(`/api/budget/set-initial-income/${budgetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id: item.id, amount: parseFloat(amount) })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to set amount.');
            }
            onUpdate();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <li className="bg-gray-700 p-3 rounded-md">
            <form onSubmit={handleSetAmount} className="flex justify-between items-center gap-4">
                <span className="flex-grow">{item.label}</span>
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
                <button
                    type="submit"
                    disabled={loading}
                    className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg disabled:bg-gray-500"
                >
                    {loading ? '...' : 'Set'}
                </button>
            </form>
            {error && <p className="text-red-400 text-xs mt-1 text-right">{error}</p>}
        </li>
    );
}

export default InitialIncomeItem;