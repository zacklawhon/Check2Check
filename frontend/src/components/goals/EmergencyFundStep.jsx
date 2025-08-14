import React, { useState, useEffect } from 'react';

// 1. The component now needs to know about the user's existing accounts
function EmergencyFundStep({ accounts = [], onComplete }) {
    const [selection, setSelection] = useState(null);
    const [selectedAccountId, setSelectedAccountId] = useState('');

    const savingsAccounts = accounts.filter(acc => acc.account_type === 'savings');
    const totalSavingsBalance = savingsAccounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0);
    const hasSufficientFunds = totalSavingsBalance >= 2000;

    useEffect(() => {
        if (selection === 'yes') {
            onComplete({ decision: 'proceed', linkedAccountId: null });
        }
    }, [selection, onComplete]);

    const handleComplete = () => {
        // Pass both the decision and any linked account ID to the parent
        onComplete({
            decision: 'create_savings',
            linkedAccountId: selectedAccountId || null
        });
    };

    const handleOverride = () => {
        onComplete({
            decision: 'override',
            linkedAccountId: null
        });
    };

    // Render logic for when the user has not made a choice yet
    const renderInitialQuestion = () => (
        <>
            <p className="text-lg text-gray-300 mb-6">
                Do you have at least $2,000 saved for emergencies?
            </p>
            <div className="bg-gray-700 p-4 rounded-lg mb-8">
                <p className="text-indigo-200">
                    Having an emergency fund is the #1 defense against future debt. It's a crucial safety net for unexpected expenses.
                </p>
            </div>
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => setSelection('no')}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
                >
                    No, I don't
                </button>
                <button
                    onClick={() => setSelection('yes')}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg"
                >
                    Yes, I do
                </button>
            </div>
        </>
    );

    // Render logic for after the user clicks "No"
    const renderNoSelection = () => {
        if (savingsAccounts.length > 0) {
            // If they have savings accounts, prompt them to use one
            return (
                <div className="text-left">
                    <p className="text-gray-300 mb-4">That's okay! We can set up a goal to build your savings. You can either use an existing savings account to track your progress or start fresh.</p>
                    <div className="space-y-4">
                        <label htmlFor="account-select" className="block font-semibold text-gray-200">
                            Designate an Emergency Fund Account:
                        </label>
                        <select
                            id="account-select"
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                        >
                            <option value="">-- Select a Savings Account --</option>
                            {savingsAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.account_name} (${parseFloat(acc.current_balance).toFixed(2)})
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleComplete}
                            disabled={!selectedAccountId}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500"
                        >
                            Use This Account for My Goal
                        </button>
                        <div className="text-center my-2 text-gray-400">OR</div>
                        <button
                            onClick={handleOverride}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-2 px-6 rounded-lg"
                        >
                            I understand the risk, focus on debt first
                        </button>
                    </div>
                </div>
            );
        } else {
            // If they have no savings accounts, show the original override message
            return (
                <div className="bg-gray-700 p-4 rounded-lg text-left">
                    <p className="text-gray-300 mb-4">
                        That's okay! We strongly recommend making a '$2,000 Savings' goal your top priority. This will create a virtual goal that you can track manually.
                    </p>
                    <div className="space-y-3">
                        <button
                            // This calls onComplete directly with the right signal and a null account ID.
                            onClick={() => onComplete({ decision: 'create_savings', linkedAccountId: null })}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
                        >
                            Create a $2,000 Savings Goal
                        </button>
                        <button
                            onClick={handleOverride}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-lg"
                        >
                            I understand the risk, focus on debt first
                        </button>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">First, A Quick Check-In</h2>

            {!selection && renderInitialQuestion()}
            {selection === 'no' && renderNoSelection()}
        </div>
    );
}

export default EmergencyFundStep;
