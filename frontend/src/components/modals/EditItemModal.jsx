import React, { useState, useEffect } from 'react';

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

        const url = itemType === 'income' 
            ? `/api/account/income-sources/${item.id}` 
            : `/api/account/recurring-expenses/${item.id}`;

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update item.');
            onSuccess();
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
                <h2 className="text-2xl font-bold text-center mb-6 text-white">Edit Item</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        name="label"
                        value={formData.label || ''}
                        onChange={handleChange}
                        placeholder="Name"
                        required
                        className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                    />

                    {itemType === 'income' ? (
                        <select 
                            name="frequency" 
                            value={formData.frequency || 'one-time'} 
                            onChange={handleChange} 
                            className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                        >
                            <option value="one-time">One-Time</option>
                            <option value="weekly">Weekly</option>
                            <option value="bi-weekly">Bi-Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    ) : (
                        <>
                            <input 
                                type="number" 
                                name="due_date" 
                                value={formData.due_date || ''} 
                                onChange={handleChange} 
                                placeholder="Due Day (e.g., 15)" 
                                className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                            />
                            <select 
                                name="category" 
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

                            {/* --- FIX: Added the conditional inputs for optional data --- */}
                            {formData.category === 'loan' && (
                                <div className="space-y-4 p-4 border border-gray-600 rounded-lg">
                                    <h4 className="font-semibold text-gray-300">Loan Details (Optional)</h4>
                                    <input type="number" step="0.01" name="principal_balance" value={formData.principal_balance || ''} onChange={handleChange} placeholder="Principal Balance" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-700"/>
                                    <input type="number" step="0.01" name="interest_rate" value={formData.interest_rate || ''} onChange={handleChange} placeholder="Interest Rate (%)" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-700"/>
                                    <div>
                                    <label className="block text-sm text-gray-400 mb-1">Maturity Date</label>
                                    <input type="date" name="maturity_date" value={formData.maturity_date || ''} onChange={handleChange} className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-700"/>
                                    </div>
                                </div>
                            )}

                            {formData.category === 'credit-card' && (
                                <div className="space-y-4 p-4 border border-gray-600 rounded-lg">
                                    <h4 className="font-semibold text-gray-300">Credit Card Details (Optional)</h4>
                                    <input type="number" step="0.01" name="outstanding_balance" value={formData.outstanding_balance || ''} onChange={handleChange} placeholder="Outstanding Balance" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-700"/>
                                    <input type="number" step="0.01" name="interest_rate" value={formData.interest_rate || ''} onChange={handleChange} placeholder="Interest Rate (%)" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-700"/>
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