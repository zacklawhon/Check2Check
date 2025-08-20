import React, { useState } from 'react';

function AddIncomeForm({ budgetId, onSuccess }) {
    const [label, setLabel] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState('one-time');
    const [saveRecurring, setSaveRecurring] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/budget-items/add-income/${budgetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ label, amount, frequency, save_recurring: saveRecurring })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to add income.');
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Income Source" required className="w-full bg-gray-700 text-white rounded-lg p-3 mb-4 border border-gray-600"/>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" required className="w-full bg-gray-700 text-white rounded-lg p-3 mb-4 border border-gray-600"/>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 mb-4 border border-gray-600">
                <option value="one-time">One-Time</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-Weekly</option>
                <option value="semi-monthly">Semi-Monthly</option>
                <option value="monthly">Monthly</option>
            </select>
            <label className="flex items-center gap-2 text-gray-400">
                <input type="checkbox" checked={saveRecurring} onChange={(e) => setSaveRecurring(e.target.checked)} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 rounded"/>
                <span>Save as a recurring income source</span>
            </label>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg mt-4 disabled:bg-gray-500">
                {loading ? 'Saving...' : 'Save Item'}
            </button>
            {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
        </form>
    );
}
export default AddIncomeForm;
