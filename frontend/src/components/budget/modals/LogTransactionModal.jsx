import React, { useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '../../../utils/api';

// 2. Accept the 'user' object as a prop
function LogTransactionModal({ budgetId, categoryName, onClose, onSuccess, user }) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const transactionData = {
            budget_cycle_id: budgetId,
            category_name: categoryName,
            type: 'expense',
            amount: amount,
            description: description
        };

        try {
            await api.logTransaction(transactionData);
            toast.success('Transaction logged!');
            onSuccess();
        } catch (err) {
            setError(err.message); // The API client already shows a toast
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-sm relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white">&times;</button>
                <h2 className="text-2xl font-bold text-center mb-4 text-white">Log Purchase for {categoryName}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="e.g., 45.50"
                            required
                            className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                    <div className="mb-6">
                         <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description (Optional)</label>
                        <input
                            type="text"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Weekly groceries"
                            className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-500"
                    >
                        {loading ? 'Logging...' : 'Log Transaction'}
                    </button>
                    {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
                </form>
            </div>
        </div>
    );
}
export default LogTransactionModal;
