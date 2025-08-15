import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import EmergencyFundStep from '../components/goals/EmergencyFundStep';
import StrategyStep from '../components/goals/StrategyStep';
import TargetStep from '../components/goals/TargetStep';
import GoalTypeStep from '../components/goals/GoalTypeStep';
import CustomSavingsStep from '../components/goals/CustomSavingsStep';

function GoalsPage() {
    const { user } = useOutletContext();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [accounts, setAccounts] = useState([]);
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [goals, setGoals] = useState([]);
    const [hasEmergencyFundGoal, setHasEmergencyFundGoal] = useState(false);
    const [goalPath, setGoalPath] = useState(null); // 'debt' or 'savings'

    const [goalSetup, setGoalSetup] = useState({
        emergencyFund: null,
        strategy: null,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accRes, itemsRes, goalsRes] = await Promise.all([
                    fetch('/api/user-accounts', { credentials: 'include' }),
                    fetch('/api/account/recurring-items', { credentials: 'include' }),
                    fetch('/api/goals', { credentials: 'include' })
                ]);

                if (!accRes.ok || !itemsRes.ok || !goalsRes.ok) {
                    throw new Error('Could not fetch required data.');
                }

                setAccounts(await accRes.json());
                const items = await itemsRes.json();
                const existingGoals = await goalsRes.json();

                // --- STEP 2: SAVE THE FETCHED GOALS TO STATE ---
                setGoals(existingGoals);

                const validDebts = items.recurring_expenses.filter(exp =>
                    (exp.category === 'loan' || exp.category === 'credit-card') &&
                    exp.outstanding_balance && exp.interest_rate
                );
                setDebts(validDebts);

                const hasEFGoal = existingGoals.some(goal => goal.goal_name === 'Build Emergency Fund');
                setHasEmergencyFundGoal(hasEFGoal);

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

    const handleEmergencyFundComplete = (result) => {
        setGoalSetup(prev => ({ ...prev, emergencyFund: result }));
        setGoalPath('debt'); // After creating an EF, the next logical step is debt
        nextStep(); // Go to step 2 (which will now be StrategyStep)
    };

    const handleGoalTypeSelect = (path) => {
        setGoalPath(path);
        nextStep(); // Go to step 2 (which will be StrategyStep or CustomSavingsStep)
    };

    const handleStrategyComplete = (strategy) => {
        setGoalSetup(prev => ({ ...prev, strategy }));
        nextStep(); // Go to step 3 (TargetStep)
    };

    const handleCustomSavingsComplete = async (savingsData) => {
        setLoading(true);
        setError('');
        try {
            const payload = {
                ...savingsData,
                goal_type: 'savings',
                strategy: 'savings',
            };

            const response = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to create savings goal.');

            navigate('/account');
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
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
                    goal_name: `Pay Off: ${selectedDebt.label}`,
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
                    goal_name: `Pay Off: ${selectedDebt.label}`,
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

    const renderStep = () => {
        switch (step) {
            case 1:
                return hasEmergencyFundGoal ? (
                    <GoalTypeStep onSelect={handleGoalTypeSelect} onBack={() => navigate('/account')} />
                ) : (
                    <EmergencyFundStep accounts={accounts} onComplete={handleEmergencyFundComplete} />
                );
            case 2:
                if (goalPath === 'debt') {
                    return <StrategyStep onBack={prevStep} onComplete={handleStrategyComplete} />;
                }
                if (goalPath === 'savings') {
                    return <CustomSavingsStep onBack={prevStep} onComplete={handleCustomSavingsComplete} />;
                }
                return null;
            case 3:
                return (
                    <TargetStep
                        debts={debts}
                        strategy={goalSetup.strategy}
                        goals={goals}
                        onBack={prevStep}
                        onComplete={handleTargetSelection}
                    />
                );
            default:
                return <p>Loading wizard...</p>;
        }
    };

    if (loading) return <div className="text-center p-8 text-white">Loading your account data...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            <h1 className="text-4xl font-bold text-center mb-8">Create a New Goal</h1>
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-4xl mx-auto">
                {renderStep()}
            </div>
        </div>
    );
}

export default GoalsPage;