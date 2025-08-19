import React, { useState, useEffect } from 'react';
import AccountModal from './modals/AccountModal';
import AdjustBalanceModal from './modals/AdjustBalanceModal'; // 1. Import new modal
import ConfirmationModal from '../common/ConfirmationModal';

function AccountManager() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false); // 2. Add state for adjust modal
    const [activeAccount, setActiveAccount] = useState(null); // 3. Use one state for the active account
    const [deletingAccount, setDeletingAccount] = useState(null);

    const fetchAccounts = async () => {
        try {
            const response = await fetch('/api/user-accounts', { credentials: 'include' });
            if (!response.ok) throw new Error('Could not fetch accounts.');
            setAccounts(await response.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAccounts(); }, []);

    const handleSuccess = () => {
        setIsEditModalOpen(false);
        setIsAdjustModalOpen(false);
        setActiveAccount(null);
        fetchAccounts();
    };

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/user-accounts/${deletingAccount.id}`, { method: 'DELETE', credentials: 'include' });
            if (!response.ok) throw new Error('Could not delete account.');
            setDeletingAccount(null);
            fetchAccounts();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div>Loading accounts...</div>;

    return (
        <>
            <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-teal-400">Your Accounts</h2>
                    <button onClick={() => { setActiveAccount(null); setIsEditModalOpen(true); }} className="bg-indigo-600 py-2 px-4 rounded">Add New</button>
                </div>
                {error && <p className="text-red-400 mb-2">{error}</p>}

                {/* --- START: ADDED LOGIC --- */}
                {accounts.length === 0 ? (
                    <p className="text-gray-400 text-center py-4">
                        Add and Manage Savings and Checking accounts here. Click "Add New" to get started.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {accounts.map(acc => (
                            <li key={acc.id} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-200">{acc.account_name}</p>
                                    <p className="text-sm text-gray-400 capitalize">{acc.account_type}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-semibold text-gray-200">${parseFloat(acc.current_balance).toFixed(2)}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setActiveAccount(acc); setIsAdjustModalOpen(true); }} className="text-xs text-yellow-400 hover:text-yellow-300">Adjust</button>
                                        <button onClick={() => { setActiveAccount(acc); setIsEditModalOpen(true); }} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                                        <button onClick={() => setDeletingAccount(acc)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                {/* --- END: ADDED LOGIC --- */}
            </div>
            {/* --- 5. Render the new modals --- */}
            <AccountModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSuccess={handleSuccess} account={activeAccount} />
            <AdjustBalanceModal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} onSuccess={handleSuccess} account={activeAccount} />
            <ConfirmationModal isOpen={!!deletingAccount} onClose={() => setDeletingAccount(null)} onConfirm={handleDelete} title="Delete Account" message={`Are you sure you want to delete "${deletingAccount?.account_name}"? This action cannot be undone.`} />
        </>
    );
}
export default AccountManager;