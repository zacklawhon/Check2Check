import React, { useState, useEffect } from 'react';

function TransferModal({ isOpen, onClose, onConfirm, accounts, budgetId, action }) {
    const [amount, setAmount] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [transferType, setTransferType] = useState('income');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (accounts && accounts.length > 0) {
            setSelectedAccountId(accounts[0].id);
        }
    }, [accounts]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const url = action === 'from' 
                ? `/api/budget/${budgetId}/transfer-from-account` 
                : `/api/budget/${budgetId}/transfer-to-account`;
            
            const body = {
                account_id: selectedAccountId,
                amount: parseFloat(amount),
                transfer_type: transferType
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'credentials': 'include' },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Transfer failed.');
            onConfirm();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    {action === 'from' ? 'Transfer from Account' : 'Transfer to Account'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1">Account</label>
                        <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-white">
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">Amount</label>
                        <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-700 p-2 rounded text-white" required />
                    </div>

                    {action === 'from' && (
                        <div>
                            <label className="block text-sm font-semibold mb-3">How should this be treated?</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg">
                                    <input type="radio" value="income" checked={transferType === 'income'} onChange={e => setTransferType(e.target.value)} className="form-radio" />
                                    <span>Add to Budget as Income</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-lg">
                                    <input type="radio" value="external" checked={transferType === 'external'} onChange={e => setTransferType(e.target.value)} className="form-radio" />
                                    <span>Record as External Transfer (doesn't affect budget)</span>
                                </label>
                            </div>
                        </div>
                    )}
                    {error && <p className="text-red-400 mt-2">{error}</p>}
                    <div className="flex justify-end gap-4 pt-2">
                        <button type="button" onClick={onClose} className="bg-gray-600 py-2 px-4 rounded">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-indigo-600 py-2 px-4 rounded">{loading ? 'Processing...' : 'Confirm'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default TransferModal;