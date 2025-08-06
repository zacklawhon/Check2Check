import React, { useState, useEffect } from 'react';

function AddItemModal({ type, budgetId, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        label: '',
        amount: '',
        frequency: 'one-time',
        due_date: '',
        category: 'other',
        save_recurring: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Reset form when the modal type changes
        setFormData({
            label: '',
            amount: '',
            frequency: 'one-time',
            due_date: '',
            category: 'other',
            save_recurring: true
        });
    }, [type]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // --- FIX: This is the corrected handleSubmit function for your file ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        let url = '';
        let body = {};

        // This logic now correctly handles all three item types
        if (type === 'income') {
            url = `/api/budget/add-income/${budgetId}`;
            body = {
                label: formData.label,
                amount: formData.amount,
                frequency: formData.frequency,
                save_recurring: formData.save_recurring ? 1 : 0
            };
        } else if (type === 'variable') {
            url = `/api/budget/add-variable-expense/${budgetId}`;
            body = {
                label: formData.label,
                amount: formData.amount
            };
        } else { // Default to 'recurring'
            url = `/api/budget/add-expense/${budgetId}`;
            body = {
                label: formData.label,
                due_date: formData.due_date,
                estimated_amount: formData.amount,
                category: formData.category,
                save_recurring: formData.save_recurring ? 1 : 0
            };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `Failed to add ${type}.`);
            }
            onSuccess(); // This will close the modal and refresh the budget data
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderTitle = () => {
        if (type === 'income') return 'Add Income';
        if (type === 'recurring') return 'Add Recurring Bill';
        if (type === 'variable') return 'Add Variable Spending';
        return 'Add Item';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white text-2xl">&times;</button>
                <h2 className="text-2xl font-bold text-center mb-6 text-white">{renderTitle()}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        name="label"
                        value={formData.label}
                        onChange={handleChange}
                        placeholder="Name (e.g., Paycheck, Netflix, Groceries)"
                        required
                        className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                    />
                    <input
                        type="number"
                        name="amount"
                        step="0.01"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="Amount"
                        required
                        className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                    />

                    {type === 'income' && (
                        <>
                            <select name="frequency" value={formData.frequency} onChange={handleChange} className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600">
                                <option value="one-time">One-Time</option>
                                <option value="weekly">Weekly</option>
                                <option value="bi-weekly">Bi-Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                            {formData.frequency !== 'one-time' && (
                                <label className="flex items-center gap-2 text-gray-400">
                                    <input type="checkbox" name="save_recurring" checked={formData.save_recurring} onChange={handleChange} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600"/>
                                    <span>Save for future budgets</span>
                                </label>
                            )}
                        </>
                    )}

                    {type === 'recurring' && (
                        <>
                            <input type="number" name="due_date" value={formData.due_date} onChange={handleChange} placeholder="Due Day (e.g., 15)" min="1" max="31" className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"/>
                            <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600">
                                <option value="other">Other</option>
                                <option value="housing">Housing</option>
                                <option value="utilities">Utilities</option>
                                <option value="loan">Loan</option>
                                <option value="credit-card">Credit Card</option>
                                <option value="insurance">Insurance</option>
                                <option value="subscription">Subscription</option>
                            </select>
                            <label className="flex items-center gap-2 text-gray-400">
                                <input type="checkbox" name="save_recurring" checked={formData.save_recurring} onChange={handleChange} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600"/>
                                <span>Save for future budgets</span>
                            </label>
                        </>
                    )}
                    
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500">
                            {loading ? 'Adding...' : 'Add Item'}
                        </button>
                    </div>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </form>
            </div>
        </div>
    );
}

export default AddItemModal;