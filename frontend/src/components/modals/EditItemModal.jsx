import React, { useState, useEffect } from 'react';

function EditItemModal({ item, isOpen, onClose, onSuccess }) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // When the item to edit changes, update the form data
        setFormData(item || {});
    }, [item]);

    if (!isOpen) return null;

    const isIncome = !!item.frequency; // A simple check to see if it's an income item

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const url = isIncome 
            ? `/api/account/income-sources/${item.id}` 
            : `/api/account/recurring-expenses/${item.id}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to update item.');
            }
            onSuccess(); // Triggers refresh and closes modal
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white text-2xl">&times;</button>
                <h2 className="text-2xl font-bold text-center mb-6 text-white">Edit {isIncome ? 'Income' : 'Bill'}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="label" value={formData.label || ''} onChange={handleFormChange} placeholder="Name" required className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"/>
                    
                    {isIncome ? (
                        <select name="frequency" value={formData.frequency || 'one-time'} onChange={handleFormChange} className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600">
                            <option value="one-time">One-Time</option>
                            <option value="weekly">Weekly</option>
                            <option value="bi-weekly">Bi-Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    ) : (
                        <>
                            <input type="number" name="due_date" value={formData.due_date || ''} onChange={handleFormChange} placeholder="Due Day (e.g., 15)" min="1" max="31" className="w-full bg-gray-700 ..."/>
                            <select name="category" value={formData.category || 'other'} onChange={handleFormChange} className="w-full bg-gray-700 ...">
                                <option value="other">Other</option>
                                <option value="loan">Loan</option>
                                <option value="credit-card">Credit Card</option>
                                {/* Add other categories as needed */}
                            </select>

                            {formData.category === 'loan' && (
                                <div className="space-y-2 p-2 border border-gray-700 rounded">
                                    <input type="number" step="0.01" name="principal_balance" value={formData.principal_balance || ''} onChange={handleFormChange} placeholder="Principal Balance" className="w-full bg-gray-600 p-2 rounded"/>
                                    <input type="number" step="0.01" name="interest_rate" value={formData.interest_rate || ''} onChange={handleFormChange} placeholder="Interest Rate (%)" className="w-full bg-gray-600 p-2 rounded"/>
                                    <input type="date" name="maturity_date" value={formData.maturity_date || ''} onChange={handleFormChange} className="w-full bg-gray-600 p-2 rounded"/>
                                </div>
                            )}
                            {formData.category === 'credit-card' && (
                                <div className="space-y-2 p-2 border border-gray-700 rounded">
                                    <input type="number" step="0.01" name="outstanding_balance" value={formData.outstanding_balance || ''} onChange={handleFormChange} placeholder="Outstanding Balance" className="w-full bg-gray-600 p-2 rounded"/>
                                    <input type="number" step="0.01" name="interest_rate" value={formData.interest_rate || ''} onChange={handleFormChange} placeholder="Interest Rate (%)" className="w-full bg-gray-600 p-2 rounded"/>
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