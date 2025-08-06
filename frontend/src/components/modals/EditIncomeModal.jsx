import React, { useState } from 'react';

function EditIncomeModal({ item, budgetId, onClose, onSuccess }) {
    const [newAmount, setNewAmount] = useState(item.amount);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/budget/adjust-income/${budgetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ label: item.label, new_amount: newAmount })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to adjust income.');
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-sm relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white">&times;</button>
                <h2 className="text-2xl font-bold text-center mb-2 text-white">Edit Income</h2>
                <p className="text-center text-gray-400 mb-6">{item.label}</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="newAmount" className="block text-sm font-medium text-gray-300 mb-1">New Amount</label>
                        <input
                            type="number"
                            id="newAmount"
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg disabled:bg-gray-500">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
                </form>
            </div>
        </div>
    );
}

export default EditIncomeModal;
