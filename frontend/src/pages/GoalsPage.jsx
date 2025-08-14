import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import EmergencyFundStep from '../components/goals/EmergencyFundStep';
import StrategyStep from '../components/goals/StrategyStep';
import TargetStep from '../components/goals/TargetStep';

function GoalsPage() {
    const { user } = useOutletContext();
    const navigate = useNavigate(); // For redirecting after success
    const [step, setStep] = useState(1);
    const [accounts, setAccounts] = useState([]);
    const [debts, setDebts] = useState([]); // State for user's debts
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 2. Add state to store the user's choices from each step
    const [goalSetup, setGoalSetup] = useState({
        emergencyFund: null,
        strategy: null,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 2. Fetch both accounts and recurring items at the same time
                const [accRes, itemsRes] = await Promise.all([
                    fetch('/api/user-accounts', { credentials: 'include' }),
                    fetch('/api/account/recurring-items', { credentials: 'include' })
                ]);
                if (!accRes.ok || !itemsRes.ok) throw new Error('Could not fetch required data.');

                setAccounts(await accRes.json());
                const items = await itemsRes.json();

                // Filter for debts that have the necessary info
                const validDebts = items.recurring_expenses.filter(exp =>
                    (exp.category === 'loan' || exp.category === 'credit-card') &&
                    exp.outstanding_balance && exp.interest_rate
                );
                setDebts(validDebts);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleSavingsGoalCreation = async (linkedAccountId) => {
        setLoading(true);
        setError('');
        try {
            const payload = {
                goal_name: 'Build Emergency Fund',
                goal_type: 'savings',
                strategy: 'savings', // A dedicated strategy for this goal type
                target_amount: 2000.00,
                linked_account_id: linkedAccountId || null,
            };

            const response = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create savings goal.');
            }

            // On success, redirect to the account page to see the new goal
            navigate('/account');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStep1Complete = (result) => {
        // 1. Save the user's choice about their emergency fund.
        setGoalSetup(prev => ({ ...prev, emergencyFund: result }));

        // 2. Always proceed to the next step.
        nextStep();
    };

    const handleStep2Complete = (strategy) => {
        setGoalSetup(prev => ({ ...prev, strategy: strategy }));
        nextStep();
    };

    // 3. Create the final handler that creates the goal
    const handleTargetSelection = async (selectedDebt) => {
        setLoading(true);
        setError('');

        try {
            // Check if the user chose the Hybrid strategy
            if (goalSetup.strategy === 'hybrid') {

                // --- Payload 1: The Debt Goal ---
                const debtPayload = {
                    goal_name: `Pay Off ${selectedDebt.label}`,
                    goal_type: 'debt_reduction',
                    strategy: 'hybrid',
                    target_amount: selectedDebt.outstanding_balance,
                    current_amount: selectedDebt.outstanding_balance,
                };

                // --- Payload 2: The Emergency Fund Savings Goal ---
                const savingsPayload = {
                    goal_name: 'Build Emergency Fund',
                    goal_type: 'savings',
                    strategy: 'hybrid', // Mark this as part of the hybrid plan
                    target_amount: 2000.00,
                    // Use the linked account ID saved from Step 1
                    linked_account_id: goalSetup.emergencyFund?.linkedAccountId || null,
                };

                // --- Send both requests to the backend in parallel ---
                const responses = await Promise.all([
                    fetch('/api/goals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(debtPayload)
                    }),
                    fetch('/api/goals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(savingsPayload)
                    })
                ]);

                // Check if either of the goal creations failed
                for (const response of responses) {
                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.message || 'Failed to create the hybrid plan.');
                    }
                }
            } else {
                // --- This is the original logic for Avalanche or Snowball goals ---
                const payload = {
                    goal_name: `Pay Off ${selectedDebt.label}`,
                    goal_type: 'debt_reduction',
                    strategy: goalSetup.strategy,
                    target_amount: selectedDebt.outstanding_balance,
                    current_amount: selectedDebt.outstanding_balance,
                };

                const response = await fetch('/api/goals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Failed to create goal.');
                }
            }

            // On success, navigate the user to their account page
            navigate('/account');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center p-8 text-white">Loading your account data...</div>;
    }
    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    // Calculate the user's total savings balance
    const savingsBalance = accounts
        .filter(acc => acc.account_type === 'savings')
        .reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0);

    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            <h1 className="text-4xl font-bold text-center mb-8">Your Debt-Free Plan</h1>

            <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-4xl mx-auto">
                {step === 1 && (
                    <EmergencyFundStep
                        accounts={accounts}
                        onComplete={handleStep1Complete}
                    />
                )}
                {step === 2 && (
                    <StrategyStep
                        onBack={prevStep}
                        onComplete={handleStep2Complete}
                    />
                )}
                {step === 3 && (
                    <TargetStep
                        debts={debts}
                        strategy={goalSetup.strategy}
                        onBack={prevStep}
                        // Ensure this prop points to the new, comprehensive function
                        onComplete={handleTargetSelection}
                    />
                )}
            </div>
        </div>
    );
}

export default GoalsPage;