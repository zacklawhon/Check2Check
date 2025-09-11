import React, { useState, useEffect } from 'react'; 
import { useNavigate, useOutletContext } from 'react-router-dom';
import BudgetList from '../components/BudgetList';
import AccountsCard from '../components/budget/AccountsCard'; 
import GoalsCard from '../components/goals/GoalsCard';
import CreditCardOverviewCard from '../components/budget/CreditCardOverviewCard';
import TotalCreditAndDebtCard from '../components/budget/TotalCreditAndDebtCard';
import * as api from '../utils/api';

function DashboardPage() {
    const navigate = useNavigate();
    const { user, activeBudget, accounts, refreshData } = useOutletContext();
    const [budgetCycles, setBudgetCycles] = useState([]);
    const [goals, setGoals] = useState([]);
    const [creditCardStats, setCreditCardStats] = useState({
        totalSpendingLimit: 0,
        totalOutstanding: 0,
        totalCards: 0,
        avgInterestRate: 0
    });
    const [recurringExpenses, setRecurringExpenses] = useState([]);
    const [loadingCycles, setLoadingCycles] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCycles = async () => {
            try {
                const cyclesData = await api.getCycles();
                setBudgetCycles(cyclesData);
                // Fetch goals for dashboard
                const goalsData = await api.getGoals();
                setGoals(goalsData);
                // Fetch credit card stats and recurring expenses
                const recurringData = await api.getRecurringItems();
                setRecurringExpenses(recurringData.recurring_expenses || []);
                const cards = (recurringData.recurring_expenses || []).filter(e => e.category === 'credit-card');
                if (cards.length > 0) {
                    const totalSpendingLimit = cards.reduce((sum, c) => sum + (parseFloat(c.spending_limit) || 0), 0);
                    const totalOutstanding = cards.reduce((sum, c) => sum + (parseFloat(c.outstanding_balance) || 0), 0);
                    const interestRates = cards.map(c => parseFloat(c.interest_rate)).filter(v => !isNaN(v));
                    const avgInterestRate = interestRates.length > 0 ? (interestRates.reduce((a, b) => a + b, 0) / interestRates.length) : 0;
                    setCreditCardStats({
                        totalSpendingLimit,
                        totalOutstanding,
                        totalCards: cards.length,
                        avgInterestRate
                    });
                } else {
                    setCreditCardStats({ totalSpendingLimit: 0, totalOutstanding: 0, totalCards: 0, avgInterestRate: 0 });
                }
            } catch (err) {
                setError(err.message);
                // If it's an auth error, redirect to landing
                if (err.status === 401) {
                    navigate('/');
                }
            } finally {
                setLoadingCycles(false);
            }
        };
        fetchCycles();
    }, [navigate]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!user) {
        return <div className="text-red-500 p-8 text-center">Could not find user profile.</div>;
    }
    
    if (loadingCycles) {
        return <div className="text-white p-8 text-center">Loading Budgets...</div>;
    }
  
    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            <div className="max-w-2xl mx-auto mb-12">
                <BudgetList budgetCycles={budgetCycles} onRefresh={refreshData} />
            </div>
            {/* Total Credit & Debt Card - directly under BudgetList */}
            {(recurringExpenses.some(e => e.category === 'credit-card' || e.category === 'loan')) && (
                <div className="max-w-2xl mx-auto mb-12">
                    <TotalCreditAndDebtCard recurringExpenses={recurringExpenses} />
                </div>
            )}
            {goals && goals.length > 0 && (
                <div className="max-w-2xl mx-auto mb-12">
                    <GoalsCard goals={goals} disableActions />
                </div>
            )}
            {accounts && accounts.length > 0 && (
                <div className="max-w-2xl mx-auto mt-12">
                    <AccountsCard
                        accounts={accounts}
                        budgetId={activeBudget?.id}
                        onUpdate={refreshData}
                    />
                </div>
            )}
            {creditCardStats.totalCards > 0 && (
                <div className="max-w-2xl mx-auto mt-12">
                    <CreditCardOverviewCard creditCardStats={creditCardStats} />
                </div>
            )}
        </div>
    );
}

export default DashboardPage;