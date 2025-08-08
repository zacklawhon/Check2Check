import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom'; // Import useOutletContext
import BudgetList from '../components/BudgetList';
import GuidedWizard from '../components/wizard/GuidedWizard';
import SavingsCard from '../components/SavingsCard';

function DashboardPage() {
    const navigate = useNavigate();
    // --- 1. Get all data from the parent ProtectedRoute using the context hook ---
    const { user, activeBudget, financialTools, refreshData } = useOutletContext();
    const [budgetCycles, setBudgetCycles] = useState([]); // Keep state for budget cycles
    const [loadingCycles, setLoadingCycles] = useState(true);

    // --- 2. Create a separate, simpler fetch for just the budget cycles list ---
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
        // This case is handled by ProtectedRoute, but as a fallback:
        return <div className="text-red-500 p-8 text-center">Could not find user profile.</div>;
    }
    
    // --- 3. Show a wizard if the user exists but the budget list is still loading or empty ---
    if (loadingCycles) {
        return <div className="text-white p-8 text-center">Loading Budgets...</div>;
    }

    if (budgetCycles.length === 0) {
        return <GuidedWizard user={user} />;
    }
  
    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            {financialTools?.has_savings_account == 1 && (
                <div className="max-w-2xl mx-auto mb-12">
                    <SavingsCard
                        balance={financialTools.current_savings_balance}
                        budgetId={activeBudget?.id}
                        onUpdate={refreshData} // Use the refresh function from the context
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