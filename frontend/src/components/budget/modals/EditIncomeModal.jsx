import React, { useState, useEffect } from 'react';

function EditIncomeModal({ item, budgetId, onClose, onSuccess }) {
    const [formData, setFormData] = useState({ label: '', amount: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setFormData({
                label: item.label || '',
                amount: item.amount || ''
            });
        }
    }, [item]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        if (!formData.label || !formData.amount) {
            setError('All fields are required.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            // --- 1. THIS IS THE CORRECTED URL ---
            const url = `/api/budget/${budgetId}/update-income`;

            // --- 2. THIS IS THE CORRECTED BODY PAYLOAD ---
            // The backend expects 'original_label', 'label', and 'amount'.
            const body = {
                original_label: item.label, // The original name to find the item
                label: formData.label,      // The new name
                amount: formData.amount       // The new amount
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.messages.error || 'Failed to update income.');
            }
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!item) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-white">
                    Edit: <span className="text-indigo-400">{item?.label}</span>
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="income-label" className="block text-sm font-semibold mb-1 text-gray-300">
                            Source Name
                        </label>
                        <input
                            id="income-label"
                            type="text"
                            name="label" // Name attribute for handleChange
                            value={formData.label}
                            onChange={handleChange}
                            className="w-full bg-gray-900/50 text-white rounded-lg p-3 border border-gray-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
                        />
                    </div>
                    <div>
                        <label htmlFor="income-amount" className="block text-sm font-semibold mb-1 text-gray-300">
                            Amount
                        </label>
                        <input
                            id="income-amount"
                            type="number"
                            name="amount" // Name attribute for handleChange
                            value={formData.amount}
                            onChange={handleChange}
                            className="w-full bg-gray-900/50 text-white rounded-lg p-3 border border-gray-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition"
                        />
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
                
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="text-gray-400 hover:text-white font-semibold py-2 px-5 rounded-lg transition">
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg disabled:bg-gray-500 transition"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditIncomeModal;