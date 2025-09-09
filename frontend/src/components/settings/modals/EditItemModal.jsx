import React, { useState, useEffect } from 'react';
import * as api from '../../../utils/api';

function EditItemModal({ isOpen, item, onClose, onSuccess }) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const itemType = item?.frequency ? 'income' : 'expense';

    useEffect(() => {
        if (item) {
            // Ensure all potential fields have a default value to prevent React warnings
            setFormData({
                label: item.label || '',
                frequency: item.frequency || 'one-time',
                due_date: item.due_date || '',
                category: item.category || 'other',
                principal_balance: item.principal_balance || '',
                interest_rate: item.interest_rate || '',
                outstanding_balance: item.outstanding_balance || '',
                maturity_date: item.maturity_date || '',
            });
        }
    }, [item]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const updatedItem = await api.updateRecurringExpense(item.id, formData);
            onSuccess(updatedItem);
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
                <h2 className="text-2xl font-bold text-center mb-6 text-white">
                    Edit: <span className="text-indigo-400">{item?.label}</span>
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="label" className="block text-sm text-gray-400 mb-1">Name</label>
                        <input
                            type="text"
                            name="label"
                            id="label"
                            value={formData.label || ''}
                            onChange={handleChange}
                            placeholder="Name"
                            required
                            className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                        />
                    </div>

                    {itemType === 'income' ? (
                        <div>
                            <label htmlFor="frequency" className="block text-sm text-gray-400 mb-1">Frequency</label>
                            <select 
                                name="frequency" 
                                id="frequency"
                                value={formData.frequency || 'one-time'} 
                                onChange={handleChange} 
                                className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                            >
                                <option value="one-time">One-Time</option>
                                <option value="weekly">Weekly</option>
                                <option value="semi-monthly">Twice a Month</option>
                                <option value="bi-weekly">Bi-Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label htmlFor="due_date" className="block text-sm text-gray-400 mb-1">Due Day</label>
                                <input 
                                    type="number" 
                                    name="due_date" 
                                    id="due_date"
                                    value={formData.due_date || ''} 
                                    onChange={handleChange} 
                                    placeholder="Due Day (e.g., 15)" 
                                    className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                                />
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-sm text-gray-400 mb-1">Category</label>
                                <select 
                                    name="category" 
                                    id="category"
                                    value={formData.category || 'other'} 
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
                                </select>
                            </div>

                            {/* --- FIX: Added the conditional inputs for optional data --- */}
                            {formData.category === 'loan' && (
                                <div className="space-y-4 p-4 border border-gray-600 rounded-lg">
                                    <h4 className="font-semibold text-gray-300">Loan Details (Optional)</h4>
                                    <div>
                                        <label htmlFor="principal_balance" className="block text-sm text-gray-400 mb-1">Principal Balance</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="principal_balance" 
                                            id="principal_balance"
                                            value={formData.principal_balance || ''} 
                                            onChange={handleChange} 
                                            placeholder="Principal Balance" 
                                            className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-700"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="interest_rate_loan" className="block text-sm text-gray-400 mb-1">Interest Rate (%)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="interest_rate" 
                                            id="interest_rate_loan"
                                            value={formData.interest_rate || ''} 
                                            onChange={handleChange} 
                                            placeholder="Interest Rate (%)" 
                                            className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-700"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="maturity_date" className="block text-sm text-gray-400 mb-1">Maturity Date</label>
                                        <input 
                                            type="date" 
                                            name="maturity_date" 
                                            id="maturity_date"
                                            value={formData.maturity_date || ''} 
                                            onChange={handleChange} 
                                            className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-700"
                                        />
                                    </div>
                                </div>
                            )}

                            {formData.category === 'credit-card' && (
                                <div className="space-y-4 p-4 border border-gray-600 rounded-lg">
                                    <h4 className="font-semibold text-gray-300">Credit Card Details (Optional)</h4>
                                    <div>
                                        <label htmlFor="outstanding_balance" className="block text-sm text-gray-400 mb-1">Outstanding Balance</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="outstanding_balance" 
                                            id="outstanding_balance"
                                            value={formData.outstanding_balance || ''} 
                                            onChange={handleChange} 
                                            placeholder="Outstanding Balance" 
                                            className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-700"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="interest_rate_credit" className="block text-sm text-gray-400 mb-1">Interest Rate (%)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            name="interest_rate" 
                                            id="interest_rate_credit"
                                            value={formData.interest_rate || ''} 
                                            onChange={handleChange} 
                                            placeholder="Interest Rate (%)" 
                                            className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-700"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </form>
            </div>
        </div>
    );
}

export default EditItemModal;