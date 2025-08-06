import React, { useState, useEffect } from 'react';

function EditIncomeModal({ item, budgetId, onClose, onSuccess }) {
    const [label, setLabel] = useState('');
    const [amount, setAmount] = useState('');
    const [originalAmount, setOriginalAmount] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setLabel(item.label || '');
            setAmount(item.amount || '');
            setOriginalAmount(item.amount || '');
        }
    }, [item]);

    const handleSave = async () => {
        if (!label || !amount) {
            setError('All fields are required.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/budget/update-income/${budgetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    original_label: item.label,
                    new_label: label,
                    new_amount: amount,
                    original_amount: originalAmount
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to update income.');
            }
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!item) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-white">Edit Income Source</h2>
                
                {/* --- FIX: Added Labels --- */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="income-label" className="block text-sm font-semibold mb-1 text-gray-300">
                            Source Name
                        </label>
                        <input
                            id="income-label"
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            className="w-full bg-gray-900/50 text-white rounded-lg p-3 border border-gray-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
                        />
                    </div>
                    <div>
                        <label htmlFor="income-amount" className="block text-sm font-semibold mb-1 text-gray-300">
                            Amount
                        </label>
                        <input
                            id="income-amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-gray-900/50 text-white rounded-lg p-3 border border-gray-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
                        />
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
                
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="text-gray-400 hover:text-white font-semibold py-2 px-5 rounded-lg transition">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg disabled:bg-gray-500 transition"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditIncomeModal;