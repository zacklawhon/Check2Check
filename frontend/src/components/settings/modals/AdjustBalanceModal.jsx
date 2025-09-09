import React, { useState, useEffect } from 'react';
import * as api from '../../../utils/api';

function AdjustBalanceModal({ isOpen, onClose, onSuccess, account }) {
    const [newBalance, setNewBalance] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (account) {
            setNewBalance(account.current_balance || '');
        }
    }, [account]);

    // 2. The handler is now much simpler
    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            await api.updateAccountBalance(account.id, newBalance);
            onSuccess();
            onUpdate();
        } catch (err) {
            setError(err.message); // The API client already shows a toast
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !account) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-1 text-white">Adjust Balance</h2>
                <p className="text-indigo-300 mb-4">{account.account_name}</p>
                <div className="space-y-4">
                    <input type="number" step="0.01" placeholder="New Balance" value={newBalance} onChange={e => setNewBalance(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-white"/>
                </div>
                {error && <p className="text-red-400 mt-2">{error}</p>}
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={onClose} className="bg-gray-600 py-2 px-4 rounded text-white">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 py-2 px-4 rounded text-white">{loading ? 'Saving...' : 'Save'}</button>
                </div>
            </div>
        </div>
    );
}
export default AdjustBalanceModal;