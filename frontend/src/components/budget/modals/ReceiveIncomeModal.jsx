import React, { useState, useEffect } from 'react';
import * as api from '../../../utils/api';

function ReceiveIncomeModal({ isOpen, item, budgetId, onClose, onSuccess }) {
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setAmount(item.amount || '');
        }
    }, [item]);

    const handleConfirm = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const payload = {
                label: item.label,
                amount: parseFloat(amount),
                date: item.date,
            };
            await api.markIncomeReceived(budgetId, payload);
            onSuccess();
        } catch (err) {
            setError(err.message); // The API client already shows a toast
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-4">Confirm Income</h2>
                <p className="text-gray-300 mb-4">
                    Confirm or adjust the amount you received for: <strong className="text-indigo-300">{item.label}</strong>
                </p>
                <div>
                    <label htmlFor="received-amount" className="block text-sm font-medium text-gray-400 mb-1">Amount Received</label>
                    <input
                        id="received-amount"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600"
                    />
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                <div className="flex items-center justify-end gap-3 pt-6">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
                    <button onClick={handleConfirm} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:bg-green-400">
                        {loading ? 'Confirming...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ReceiveIncomeModal;
