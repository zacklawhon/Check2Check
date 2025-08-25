import React, { useState } from 'react';
import * as api from '../../utils/api';

function AddVariableForm({ budgetId, onSuccess }) {
    const [label, setLabel] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // This endpoint can handle both recurring and variable expenses
            const payload = { label, amount: 0, category: 'variable' };
            await api.addRecurringExpense(budgetId, payload);
            onSuccess();
        } catch (err) {
            setError(err.message); // The API client already shows a toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Category Name" required className="w-full bg-gray-700 text-white rounded-lg p-3 mb-4 border border-gray-600"/>
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg mt-4 disabled:bg-gray-500">
                {loading ? 'Saving...' : 'Save Item'}
            </button>
            {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
        </form>
    );
}
export default AddVariableForm;
