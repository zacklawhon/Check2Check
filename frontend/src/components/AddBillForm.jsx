import React, { useState } from 'react';

function AddBillForm({ budgetId, onSuccess }) {
    // State now includes all possible fields, plus the amount for this specific cycle
    const [formState, setFormState] = useState({
        label: '',
        amount: '', // This is the estimated_amount for this cycle only
        dueDate: '',
        category: 'other',
        principal_balance: '',
        interest_rate: '',
        maturity_date: '',
        outstanding_balance: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formState.label || !formState.amount) {
            setError('Please provide a name and amount.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            // The formState contains all the data the controller needs
            const response = await fetch(`/api/budget/add-expense/${budgetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formState)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to add bill.');
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="label" value={formState.label} onChange={handleFormChange} placeholder="Bill Name" required className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"/>
            <input type="number" step="0.01" name="amount" value={formState.amount} onChange={handleFormChange} placeholder="Amount for this budget" required className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"/>
            <input type="number" name="dueDate" value={formState.dueDate} onChange={handleFormChange} placeholder="Due Day (e.g., 15)" min="1" max="31" className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"/>
            <select name="category" value={formState.category} onChange={handleFormChange} className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600">
                <option value="other">Other</option>
                <option value="housing">Housing</option>
                <option value="utilities">Utilities</option>
                <option value="loan">Loan</option>
                <option value="credit-card">Credit Card</option>
                <option value="insurance">Insurance</option>
                <option value="subscription">Subscription</option>
            </select>

            {/* Conditional fields for Loans */}
            {formState.category === 'loan' && (
                <div className="space-y-4 p-4 border border-gray-600 rounded-lg">
                    <h4 className="font-semibold text-gray-300">Loan Details (Optional)</h4>
                    <input type="number" step="0.01" name="principal_balance" value={formState.principal_balance} onChange={handleFormChange} placeholder="Principal Balance" className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700"/>
                    <input type="number" step="0.01" name="interest_rate" value={formState.interest_rate} onChange={handleFormChange} placeholder="Interest Rate (%)" className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700"/>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Maturity Date (Optional)</label>
                        <input type="date" name="maturity_date" value={formState.maturity_date} onChange={handleFormChange} className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700"/>
                    </div>
                </div>
            )}

            {/* Conditional fields for Credit Cards */}
            {formState.category === 'credit-card' && (
                <div className="space-y-4 p-4 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-gray-300">Credit Card Details (Optional)</h4>
                    <input type="number" step="0.01" name="outstanding_balance" value={formState.outstanding_balance} onChange={handleFormChange} placeholder="Outstanding Balance" className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700"/>
                    <input type="number" step="0.01" name="interest_rate" value={formState.interest_rate} onChange={handleFormChange} placeholder="Interest Rate (%)" className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700"/>
                </div>
            )}
            
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg mt-4 disabled:bg-gray-500">
                {loading ? 'Saving...' : 'Save Item'}
            </button>
            {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
        </form>
    );
}
export default AddBillForm;