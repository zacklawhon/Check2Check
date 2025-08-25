import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import * as api from '../../../utils/api'

function EditBudgetItemModal({ isOpen, onClose, onSuccess, item, budgetId }) {
    const navigate = useNavigate(); 
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    

    useEffect(() => {
        if (item) {
            setAmount(item.estimated_amount || '');
            setDueDate(item.due_date || '');
            setError(''); 
        }
    }, [item]);

    const handleSave = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const payload = {
                label: item.label,
                estimated_amount: amount,
                due_date: dueDate
            };
            await api.updateRecurringExpenseInCycle(budgetId, payload);
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Edit Budget Expense</h2>
                <p className="text-gray-400 mb-4">Editing for "{item.label}" for this budget cycle only.</p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Due Day of Month</label>
                        <input
                            type="number"
                            min="1"
                            max="31"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600"
                        />
                    </div>
                </div>

                {/* 3. Add the link to the Account page */}
                <div className="text-center mt-4">
                    <button 
                        onClick={() => navigate('/account')} 
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                    >
                        Need to edit future budgets? Go to Account Management.
                    </button>
                </div>

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                <div className="flex justify-end gap-4 mt-6 border-t border-gray-700 pt-4">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditBudgetItemModal;