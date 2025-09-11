import React, { useState } from 'react';
import * as api from '../../../utils/api';

function AddCreditCardModal({ isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        label: '',
        due_date: '',
        outstanding_balance: '',
        interest_rate: '',
        spending_limit: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const payload = {
                ...formData,
                category: 'credit-card',
                type: 'recurring',
            };
            await api.createRecurringExpense(payload);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white text-2xl">&times;</button>
                <h2 className="text-2xl font-bold text-center mb-6 text-white">Add Credit Card</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="label" className="block text-sm text-gray-400 mb-1">Name</label>
                        <input
                            type="text"
                            name="label"
                            id="label"
                            value={formData.label}
                            onChange={handleChange}
                            placeholder="Card Name"
                            required
                            className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                        />
                    </div>
                    <div>
                        <label htmlFor="due_date" className="block text-sm text-gray-400 mb-1">Due Day</label>
                        <input
                            type="number"
                            name="due_date"
                            id="due_date"
                            value={formData.due_date}
                            onChange={handleChange}
                            placeholder="Due Day (e.g., 15)"
                            className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                        />
                    </div>
                    <div className="space-y-4 p-4 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-gray-300">Credit Card Details (Optional)</h4>
                        <div>
                            <label htmlFor="outstanding_balance" className="block text-sm text-gray-400 mb-1">Outstanding Balance</label>
                            <input
                                type="number"
                                step="0.01"
                                name="outstanding_balance"
                                id="outstanding_balance"
                                value={formData.outstanding_balance}
                                onChange={handleChange}
                                placeholder="Outstanding Balance"
                                className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-700"
                            />
                        </div>
                        <div>
                            <label htmlFor="interest_rate" className="block text-sm text-gray-400 mb-1">Interest Rate (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                name="interest_rate"
                                id="interest_rate"
                                value={formData.interest_rate}
                                onChange={handleChange}
                                placeholder="Interest Rate (%)"
                                className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-700"
                            />
                        </div>
                        <div>
                            <label htmlFor="spending_limit" className="block text-sm text-gray-400 mb-1">Spending Limit</label>
                            <input
                                type="number"
                                step="0.01"
                                name="spending_limit"
                                id="spending_limit"
                                value={formData.spending_limit}
                                onChange={handleChange}
                                placeholder="Spending Limit"
                                className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-700"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500">
                            {loading ? 'Adding...' : 'Add Card'}
                        </button>
                    </div>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </form>
            </div>
        </div>
    );
}

export default AddCreditCardModal;
