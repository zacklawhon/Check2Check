import React, { useState, useEffect } from 'react';
import * as api from '../../../utils/api'

function AccountModal({ isOpen, onClose, onSuccess, account }) {
    const isEditing = !!account;
    const [formData, setFormData] = useState({
        account_name: '',
        account_type: 'savings',
        current_balance: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditing) {
            setFormData({
                account_name: account.account_name || '',
                account_type: account.account_type || 'savings',
                current_balance: account.current_balance || ''
            });
        } else {
            setFormData({ account_name: '', account_type: 'savings', current_balance: '' });
        }
    }, [account, isEditing]);

    // 2. The handler is now much simpler
    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            if (isEditing) {
                await api.updateAccount(account.id, formData);
            } else {
                await api.createAccount(formData);
            }
            onSuccess();
        } catch (err) {
            setError(err.message); // The API client already shows a toast
        } finally {
            setLoading(false);
            onUpdate();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-white">{isEditing ? 'Edit Account' : 'Add New Account'}</h2>
                <div className="space-y-4">
                    <input type="text" placeholder="Account Name (e.g., Chase Checking)" value={formData.account_name} onChange={e => setFormData({...formData, account_name: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white"/>
                    <select value={formData.account_type} onChange={e => setFormData({...formData, account_type: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white">
                        <option value="savings">Savings</option>
                        <option value="checking">Checking</option>
                        <option value="other">Other</option>
                    </select>
                    {!isEditing && <input type="number" placeholder="Current Balance" value={formData.current_balance} onChange={e => setFormData({...formData, current_balance: e.target.value})} className="w-full bg-gray-700 p-2 rounded text-white"/>}
                </div>
                {error && <p className="text-red-400 mt-2">{error}</p>}
                <div className="flex justify-end gap-4 mt-4">
                    <button onClick={onClose} className="bg-gray-600 py-2 px-4 rounded text-white">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 py-2 px-4 rounded">{loading ? 'Saving...' : 'Save'}</button>
                </div>
            </div>
        </div>
    );
}
export default AccountModal;