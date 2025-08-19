import React, { useState } from 'react';
import TransferModal from './modals/TransferModal';

function AccountsCard({ accounts, budgetId, onUpdate }) {
    const [modalAction, setModalAction] = useState(null); // 'from' or 'to'

    const handleSuccess = () => {
        setModalAction(null);
        onUpdate();
    };

    const actionsDisabled = !budgetId;

    return (
        <>
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Accounts</h2>
                <ul className="space-y-3 mb-4">
                    {accounts.map(acc => (
                        <li key={acc.id} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-md">
                            <div>
                                <p className="font-semibold text-gray-200">{acc.account_name}</p>
                                <p className="text-xs text-gray-400 capitalize">{acc.account_type}</p>
                            </div>
                            <span className="font-semibold text-teal-400">${parseFloat(acc.current_balance).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
                <div className="flex gap-4">
                    {/* --- 1. UPDATED BUTTON LABELS --- */}
                    <button onClick={() => setModalAction('from')} disabled={actionsDisabled} className="flex-1 bg-green-600 hover:bg-green-700 font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                        Take Funds
                    </button>
                    <button onClick={() => setModalAction('to')} disabled={actionsDisabled} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                        Add Funds
                    </button>
                </div>
                {actionsDisabled && <p className="text-xs text-center text-gray-400 mt-3">An active budget is required to make transfers.</p>}
            </div>
            <TransferModal isOpen={!!modalAction} onClose={() => setModalAction(null)} onConfirm={handleSuccess} accounts={accounts} budgetId={budgetId} action={modalAction} />
        </>
    );
}
export default AccountsCard;