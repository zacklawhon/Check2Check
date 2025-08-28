import React, { useState, useEffect } from 'react';
import * as api from '../utils/api';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import AddItemModal from '../components/budget/modals/AddItemModal';
import EditDatesModal from '../components/budget/modals/EditDatesModal';
import AccountsCard from '../components/budget/AccountsCard';
import NextStepsPrompt from '../components/budget/NextStepsPrompt';
import AccelerateGoalModal from '../components/budget/modals/AccelerateGoalModal';
import EditBudgetItemModal from '../components/budget/modals/EditBudgetItemModal';
import BudgetSummaryCard from '../components/budget/BudgetSummaryCard';
import IncomeList from '../components/budget/IncomeList';
import ExpensesList from '../components/budget/ExpensesList';

function BudgetPage() {
    const { budgetId } = useParams();
    const navigate = useNavigate();
    const { user, accounts, refreshData: refreshGlobalData } = useOutletContext();

    const [budget, setBudget] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalType, setModalType] = useState(null);
    const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [showNextSteps, setShowNextSteps] = useState(false);
    const [isAccelerateModalOpen, setIsAccelerateModalOpen] = useState(false);
    const [actionRequests, setActionRequests] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);


    const fetchPageData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const isOwner = user && !user.is_partner;

            // --- REFACTOR START ---
            // Use Promise.all for goals and the combined budget/transaction call
            const [budgetState, goalsData] = await Promise.all([
                api.getBudgetDetails(budgetId), // This API call now returns { budget, transactions }
                api.getGoals(),
            ]);

            const { budget: budgetData, transactions: transactionsData = [] } = budgetState;

            let requestsToMerge = [];
            // If the user is the owner, fetch their requests separately
            if (isOwner) {
                requestsToMerge = await api.getActionRequests(budgetId);
            }
            // If the user is a partner, use the requests already sent with the budget data
            else if (budgetData.action_requests) {
                requestsToMerge = budgetData.action_requests;
            }

            // This function merges the full request object into the corresponding item
            const mergeRequests = (items, requests) => {
                if (!requests || requests.length === 0) return items;
                return items.map(item => {
                    const pendingRequest = requests.find(req => {
                        try {
                            const payload = JSON.parse(req.payload);
                            // Check for original_label (for edits) or the standard label
                            return payload.label === item.label || payload.original_label === item.label;
                        } catch { return false; }
                    });
                    // If a match is found, attach the request object
                    return pendingRequest ? { ...item, pending_request: pendingRequest } : item;
                });
            };

            // Apply the merge logic to both income and expenses
            budgetData.initial_expenses = mergeRequests(budgetData.initial_expenses, requestsToMerge);
            budgetData.initial_income = mergeRequests(budgetData.initial_income, requestsToMerge);

            // Set state for all our data
            setBudget(budgetData);
            setTransactions(transactionsData);
            setGoals(goalsData);

        } catch (err) {
            setError(err.message);
        } finally {
            if (!isRefresh) setLoading(false);
        }
    };

    const handleStateUpdate = (response) => {
        if (response && response.budget && response.transactions) {
            setBudget(response.budget);
            setTransactions(response.transactions);
        } else {

        }
        // Close any open modals.
        setModalType(null);
        setIsEditDatesModalOpen(false);
    };

    useEffect(() => {
        if (budgetId) {
            fetchPageData(false);
        }
    }, [budgetId]);

    useEffect(() => {
        if (user && budget) {
            const recurring = budget.initial_expenses.filter(exp => exp.type === 'recurring');
            const shouldShow = user.completed_budget_count === 0
                && !user.has_seen_accounts_prompt
                && recurring.length > 0
                && recurring.every(exp => exp.is_paid);
            setShowNextSteps(shouldShow);
        }
    }, [user, budget]);

    const handleCloseBudget = async () => {
        setIsClosing(true);
        try {
            // Use the new, clean API function
            await api.closeBudget(budgetId);
            window.location.href = `/review/${budgetId}`;
        } catch (err) {
            // The API client will show the error toast
            setError(err.message);
            setIsClosing(false);
        }
    };

    const isPastEndDate = (dateString) => {
        if (!dateString) return false;
        const endDate = new Date(`${dateString}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return endDate < today;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(`${dateString}T00:00:00`);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleRequestSent = (uniqueId) => {
        setPendingRequests(prev => [...prev, uniqueId]);
    };

    // This function also accepts the unique ID to find and remove.
    const handleRequestCancelled = (uniqueId) => {
        setPendingRequests(prev => prev.filter(id => id !== uniqueId));
    };

    if (loading || !user) {
        return <div className="text-white p-8 text-center">Loading your budget...</div>;
    }

    if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;
    if (!budget) {
        return <div className="text-white p-8 text-center">Budget or user data not found.</div>;
    }


    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold">Your Active Budget</h1>
                <p className="text-gray-400">
                    <button onClick={() => setIsEditDatesModalOpen(true)} className="hover:text-indigo-300 transition-colors">
                        {new Date(`${budget.start_date}T00:00:00`).toLocaleDateString()} - {new Date(`${budget.end_date}T00:00:00`).toLocaleDateString()}
                    </button>
                </p>
                <button onClick={() => navigate('/dashboard')} className="text-sm text-indigo-400 hover:text-indigo-300 mt-2">
                    &larr; View All Budgets
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* --- Left Column --- */}
                <div className="md:col-span-1 flex flex-col gap-8">
                    <BudgetSummaryCard
                        onStateUpdate={handleStateUpdate}
                        budget={budget}
                        transactions={transactions}
                        user={user}
                        goals={goals}
                        onOpenAccelerateModal={() => setIsAccelerateModalOpen(true)}
                        onCloseBudget={handleCloseBudget}
                        isClosing={isClosing}
                    />
                    {accounts?.length > 0 && (
                        <AccountsCard
                            accounts={accounts}
                            budgetId={budgetId}
                        />
                    )}
                </div>

                {/* --- Right Column --- */}
                <div className="md:col-span-2 bg-gray-800 p-6 rounded-lg shadow-xl">
                    <IncomeList
                        incomeItems={budget.initial_income}
                        user={user}
                        budget={budget}
                        onStateUpdate={handleStateUpdate}
                        onAddItem={() => setModalType('income')}
                        budgetId={budgetId}
                        onItemRequest={handleRequestSent}
                        onItemRequestCancel={handleRequestCancelled}
                        pendingRequests={pendingRequests}
                    />
                    <ExpensesList
                        expenseItems={budget.initial_expenses}
                        transactions={transactions}
                        budgetId={budgetId}
                        user={user}
                        onAddItem={(type) => setModalType(type)}
                        onStateUpdate={handleStateUpdate}
                        onItemRequest={handleRequestSent}
                        onItemRequestCancel={handleRequestCancelled}
                        pendingRequests={pendingRequests}
                    />
                </div>
            </div>
            {modalType && <AddItemModal type={modalType} budgetId={budgetId} accounts={accounts} onClose={() => setModalType(null)} onSuccess={handleStateUpdate} />}

            <EditDatesModal
                isOpen={isEditDatesModalOpen}
                budget={budget}
                onClose={() => setIsEditDatesModalOpen(false)}
                onSuccess={handleStateUpdate}
            />

            {goals.length > 0 && <AccelerateGoalModal isOpen={isAccelerateModalOpen} onClose={() => setIsAccelerateModalOpen(false)} onSuccess={(handleStateUpdate) => { setIsAccelerateModalOpen(false); }} goal={goals.find(g => g.status === 'active')} surplus={budget.initial_income.reduce((s, i) => s + parseFloat(i.amount || 0), 0) - budget.initial_expenses.reduce((s, e) => s + parseFloat(e.estimated_amount || 0), 0)} budgetId={budgetId} />}
        </div>
    );
}

export default BudgetPage;