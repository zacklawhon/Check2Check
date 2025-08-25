import React, { useState, useEffect } from 'react';
import * as api from '../../../utils/api';

function AddItemModal({ type, budgetId, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        label: '',
        amount: '',
        frequency: 'one-time',
        due_date: '',
        category: 'other',
        save_recurring: true,
        transfer_to_account_id: ''
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

        try {
            if (type === 'income') {
                const body = {
                    label: formData.label,
                    amount: formData.amount,
                    frequency: formData.frequency,
                    save_recurring: formData.save_recurring
                };
                await api.addIncomeToCycle(budgetId, body);

            } else if (type === 'variable') {
                const body = {
                    label: formData.label,
                    amount: formData.amount
                };
                await api.addVariableExpense(budgetId, body);

            } else { // 'recurring'
                const body = {
                    label: formData.label,
                    due_date: formData.due_date,
                    estimated_amount: formData.amount,
                    category: formData.category,
                    transfer_to_account_id: formData.transfer_to_account_id,
                    save_recurring: formData.save_recurring
                };
                await api.addRecurringExpense(budgetId, body);
            }
            onSuccess();
        } catch (err) {
            setError(err.message); // The API client already shows a toast
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
                    <div>
                        <label htmlFor="label" className="block text-sm font-semibold mb-1 text-gray-400">Name</label>
                        <input
                            type="text"
                            name="label"
                            id="label"
                            value={formData.label}
                            onChange={handleChange}
                            placeholder="Name (e.g., Paycheck, Netflix, Groceries)"
                            required
                            className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                        />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-semibold mb-1 text-gray-400">Amount</label>
                        <input
                            type="number"
                            name="amount"
                            id="amount"
                            step="0.01"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="Amount"
                            required
                            className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                        />
                    </div>

                    {type === 'income' && (
                        <>
                            <div>
                                <label htmlFor="frequency" className="block text-sm font-semibold mb-1 text-gray-400">Frequency</label>
                                <select
                                    name="frequency"
                                    id="frequency"
                                    value={formData.frequency}
                                    onChange={handleChange}
                                    className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                                >
                                    <option value="one-time">One-Time</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="bi-weekly">Bi-Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            {formData.frequency !== 'one-time' && (
                                <label className="flex items-center gap-2 text-gray-400">
                                    <input
                                        type="checkbox"
                                        name="save_recurring"
                                        id="save_recurring_income"
                                        checked={formData.save_recurring}
                                        onChange={handleChange}
                                        className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600"
                                    />
                                    <span>Save for future budgets</span>
                                </label>
                            )}
                        </>
                    )}

                    {type === 'recurring' && (
                        <>
                            <div>
                                <label htmlFor="due_date" className="block text-sm font-semibold mb-1 text-gray-400">Due Day</label>
                                <input
                                    type="number"
                                    name="due_date"
                                    id="due_date"
                                    value={formData.due_date}
                                    onChange={handleChange}
                                    placeholder="Due Day (e.g., 15)"
                                    min="1"
                                    max="31"
                                    className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                                />
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-sm font-semibold mb-1 text-gray-400">Category</label>
                                <select
                                    name="category"
                                    id="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                                >
                                    <option value="other">Other</option>
                                    <option value="housing">Housing</option>
                                    <option value="utilities">Utilities</option>
                                    <option value="loan">Loan</option>
                                    <option value="credit-card">Credit Card</option>
                                    <option value="insurance">Insurance</option>
                                    <option value="subscription">Subscription</option>
                                    <option value="transfer">Transfer to Account</option>
                                </select>

                                {formData.category === 'transfer' && (
                                    <div>
                                        <label className="block text-sm font-semibold mb-1 text-gray-400">Destination Account</label>
                                        <select name="transfer_to_account_id" value={formData.transfer_to_account_id} onChange={handleChange} className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600">
                                            <option value="">Select an account...</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <label className="flex items-center gap-2 text-gray-400">
                                <input
                                    type="checkbox"
                                    name="save_recurring"
                                    id="save_recurring_recurring"
                                    checked={formData.save_recurring}
                                    onChange={handleChange}
                                    className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600"
                                />
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