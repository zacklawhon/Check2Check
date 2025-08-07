import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BudgetList from '../components/BudgetList';
import GuidedWizard from '../components/wizard/GuidedWizard';
import SavingsCard from '../components/SavingsCard'; // 1. Import the SavingsCard component

function DashboardPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [budgetCycles, setBudgetCycles] = useState([]);
    // --- 2. Add new state for savings and active budget ---
    const [financialTools, setFinancialTools] = useState(null);
    const [activeBudget, setActiveBudget] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDashboardData = async () => {
        // We don't need to set loading to true on refresh, just on initial load
        // setLoading(true); 
        try {
            // --- 3. Fetch all necessary data in parallel ---
            const [profileRes, cyclesRes, toolsRes, activeBudgetRes] = await Promise.all([
                fetch('/api/user/profile', { credentials: 'include' }),
                fetch('/api/budget/cycles', { credentials: 'include' }),
                fetch('/api/account/financial-tools', { credentials: 'include' }),
                fetch('/api/user/active-budget', { credentials: 'include' })
            ]);

            if (profileRes.status === 401) { navigate('/'); return; }
            if (!profileRes.ok || !cyclesRes.ok || !toolsRes.ok) throw new Error('Failed to load dashboard data.');

            setUser(await profileRes.json());
            setBudgetCycles(await cyclesRes.json());
            setFinancialTools(await toolsRes.json());

            // The active budget might not exist, so we check if the response was ok
            if (activeBudgetRes.ok) {
                setActiveBudget(await activeBudgetRes.json());
            } else {
                setActiveBudget(null);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDashboardData(); }, []);

    if (loading) return <div className="text-white p-8 text-center">Loading...</div>;
    if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;
    if (!user) return <div className="text-red-500 p-8 text-center">Could not find user profile.</div>;

    if (budgetCycles.length === 0) {
        return <GuidedWizard user={user} />;
    }

    return (
        <div className="container mx-auto p-4 md:p-8 text-white">

            {/* --- 1. Savings Card Section (Now on top) --- */}
            {/* We display the card if the user has a savings account. */}
            {/* The 'mb-12' class adds a nice space between the card and the list below. */}
            {financialTools?.has_savings_account && (
                <div className="max-w-2xl mx-auto mb-12">
                    <SavingsCard
                        balance={financialTools.current_savings_balance}
                        budgetId={activeBudget?.id}
                        onUpdate={fetchDashboardData}
                    />
                </div>
            )}

            {/* --- 2. Budget List Section (Now below the card) --- */}
            <div>
                <h1 className="text-3xl font-bold mb-6 text-center">Your Budgets</h1>
                <BudgetList budgetCycles={budgetCycles} onRefresh={fetchDashboardData} />
            </div>

        </div>
    );
}

export default DashboardPage;