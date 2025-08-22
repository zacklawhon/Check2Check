import React, { useState, useEffect } from 'react'; 
import { useNavigate, useOutletContext } from 'react-router-dom';
import BudgetList from '../components/BudgetList';
import AccountsCard from '../components/budget/AccountsCard'; 
import * as api from '../utils/api';

function DashboardPage() {
    const navigate = useNavigate();
    // 3. Get the new 'accounts' list from the context
    const { user, activeBudget, accounts, refreshData } = useOutletContext();
    const [budgetCycles, setBudgetCycles] = useState([]);
    const [loadingCycles, setLoadingCycles] = useState(true);

    useEffect(() => {
        // 2. The fetch function is now cleaner and uses the API client
        const fetchCycles = async () => {
            try {
                const cyclesData = await api.getCycles();
                setBudgetCycles(cyclesData);
            } catch (err) {
                console.error(err);
                // The api client already shows a toast, so no extra error handling is needed here
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