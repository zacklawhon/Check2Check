import React, { useState, useEffect } from 'react'; // 1. Correctly import useState and useEffect
import { useNavigate, useOutletContext } from 'react-router-dom';
import BudgetList from '../components/BudgetList';
import AccountsCard from '../components/budget/AccountsCard'; // 2. Import the new AccountsCard

function DashboardPage() {
    const navigate = useNavigate();
    // 3. Get the new 'accounts' list from the context
    const { user, activeBudget, accounts, refreshData } = useOutletContext();
    const [budgetCycles, setBudgetCycles] = useState([]);
    const [loadingCycles, setLoadingCycles] = useState(true);

    useEffect(() => {
        const fetchCycles = async () => {
            try {
                const cyclesRes = await fetch('/api/budget/cycles', { credentials: 'include' });
                if (!cyclesRes.ok) throw new Error('Failed to load budgets.');
                setBudgetCycles(await cyclesRes.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingCycles(false);
            }
        };
        fetchCycles();
    }, []);


    if (!user) {
        return <div className="text-red-500 p-8 text-center">Could not find user profile.</div>;
    }
    
    if (loadingCycles) {
        return <div className="text-white p-8 text-center">Loading Budgets...</div>;
    }

    // This logic is now handled by the redirect in ProtectedRoute
    // if (budgetCycles.length === 0) {
    //     return <GuidedWizard user={user} />;
    // }
  
    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            {/* 4. Update the condition to check for accounts and render the new card */}
            {accounts && accounts.length > 0 && (
                <div className="max-w-2xl mx-auto mb-12">
                    <AccountsCard
                        accounts={accounts}
                        budgetId={activeBudget?.id}
                        onUpdate={refreshData}
                    />
                </div>
            )}

            <div>
                <h1 className="text-3xl font-bold mb-6 text-center">Your Budgets</h1>
                <BudgetList budgetCycles={budgetCycles} onRefresh={refreshData} />
            </div>
        </div>
    );
}

export default DashboardPage;