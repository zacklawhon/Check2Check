import React, { useState, useEffect } from 'react';
import * as api from '../utils/api';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import VariableExpenseItem from '../components/budget/VariableExpenseItem';
import RecurringExpenseItem from '../components/budget/RecurringExpenseItem';
import IncomeListItem from '../components/budget/IncomeListItem';
import AddItemModal from '../components/budget/modals/AddItemModal';
import EditIncomeModal from '../components/budget/modals/EditIncomeModal';
import ConfirmationModal from '../components/common/ConfirmationModal';
import EditDatesModal from '../components/budget/modals/EditDatesModal';
import AccountsCard from '../components/budget/AccountsCard';
import NextStepsPrompt from '../components/budget/NextStepsPrompt';
import AccelerateGoalModal from '../components/budget/AccelerateGoalModal';
import ReceiveIncomeModal from '../components/budget/modals/ReceiveIncomeModal';
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
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToReceive, setItemToReceive] = useState(null);
    const [itemToRemove, setItemToRemove] = useState(null);
    const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [showNextSteps, setShowNextSteps] = useState(false);
    const [isAccelerateModalOpen, setIsAccelerateModalOpen] = useState(false);
    const [actionRequests, setActionRequests] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);


    const fetchPageData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const [budgetData, transactionsData, goalsData, requestsData] = await Promise.all([
                api.getBudgetDetails(budgetId),
                api.getTransactionsForCycle(budgetId),
                api.getGoals(),
                api.getActionRequests(budgetId)
            ]);
            
            // --- Merge pending requests into the budget items ---
            if (requestsData.length > 0) {
                // This logic attaches the pending request data directly to the item it affects
                const mergeRequests = (items) => {
                    return items.map(item => {
                        const pendingRequest = requestsData.find(req => {
                            const payload = JSON.parse(req.payload);
                            return payload.label === item.label;
                        });
                        return pendingRequest ? { ...item, pending_request: pendingRequest } : item;
                    });
                };
                
                budgetData.initial_expenses = mergeRequests(budgetData.initial_expenses);
                budgetData.initial_income = mergeRequests(budgetData.initial_income);
            }

            setBudget(budgetData);
            setTransactions(transactionsData);
            setGoals(goalsData);
            

        } catch (err) {
            setError(err.message);
        } finally {
            if (!isRefresh) setLoading(false);
        }
    };

    const refreshBudget = () => {
        fetchPageData(true);
        if (refreshGlobalData) {
            refreshGlobalData(null, true);
        }
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

    const handleSuccess = () => { setModalType(null); refreshBudget(); };

    const handleEditSuccess = () => {
        setItemToEdit(null);
        refreshBudget();
    };

    const handleDatesUpdateSuccess = () => { setIsEditDatesModalOpen(false); refreshBudget(); };

    const handleRemoveIncome = async () => {
        if (!itemToRemove) return;
        try {
            await api.removeIncomeItem(budgetId, itemToRemove.label);
            setItemToRemove(null);
            refreshBudget();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleReceiveSuccess = () => {
        setItemToReceive(null);
        refreshBudget();
    };

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

    const handleRequestSent = (itemLabel) => {
        setPendingRequests(prev => [...prev, itemLabel]);
    };

    const handleBudgetEditSuccess = () => {
        setItemToEditInBudget(null);
        refreshBudget();
    };

    if (loading || !user) {
        return <div className="text-white p-8 text-center">Loading your budget...</div>;
    }

    if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;
    if (!budget || !user) return <div className="text-white p-8 text-center">Budget or user data not found.</div>;

    const totalExpectedIncome = budget.initial_income.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const totalExpectedExpenses = budget.initial_expenses.reduce((sum, item) => sum + parseFloat(item.estimated_amount || 0), 0);
    const expectedSurplus = totalExpectedIncome - totalExpectedExpenses;

    const totalReceivedIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpensesPaid = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const currentCash = totalReceivedIncome - totalExpensesPaid;

    let surplusLabel = 'Expected Surplus';
    let surplusColor = 'text-white';
    if (expectedSurplus > 0) surplusColor = 'text-green-400';
    if (expectedSurplus < 0) {
        surplusLabel = 'Expected Deficit';
        surplusColor = 'text-red-400';
    }
    const displaySurplusAmount = Math.abs(expectedSurplus);
    const recurringExpenses = budget.initial_expenses.filter(exp => exp.type === 'recurring');
    const variableExpenses = budget.initial_expenses.filter(exp => exp.type === 'variable');
    const groupedRecurringExpenses = recurringExpenses.reduce((acc, expense) => {
        const category = expense.category || 'other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(expense);
        return acc;
    }, {});
    const isClosable = budget.status === 'active' && isPastEndDate(budget.end_date);
    const activeGoal = goals.find(g => g.status === 'active');

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
                        budget={budget}
                        transactions={transactions}
                        goals={goals}
                        onOpenAccelerateModal={() => setIsAccelerateModalOpen(true)}
                        onCloseBudget={handleCloseBudget}
                        isClosing={isClosing}
                    />
                    {accounts?.length > 0 && (
                        <AccountsCard
                            accounts={accounts}
                            budgetId={budgetId}
                            onUpdate={refreshBudget}
                        />
                    )}
                </div>

                {/* --- Right Column --- */}
                <div className="md:col-span-2 bg-gray-800 p-6 rounded-lg shadow-xl">
                    <IncomeList
                        incomeItems={budget.initial_income}
                        user={user}
                        onAddItem={() => setModalType('income')}
                        onReceiveItem={setItemToReceive}
                        onEditItem={setItemToEdit}
                        onRemoveItem={setItemToRemove}
                        budgetId={budgetId}
                        onItemRequest={handleRequestSent}
                        pendingRequests={pendingRequests}
                    />
                    <ExpensesList
                        expenseItems={budget.initial_expenses}
                        transactions={transactions}
                        budgetId={budgetId}
                        user={user}
                        onAddItem={(type) => setModalType(type)}
                        onEditItem={setItemToEdit}
                        onUpdate={refreshBudget}
                        onItemRequest={handleRequestSent}
                        pendingRequests={pendingRequests}
                    />
                </div>
            </div>

            {/* --- All Modals --- */}
            {modalType && <AddItemModal type={modalType} budgetId={budgetId} accounts={accounts} onClose={() => setModalType(null)} onSuccess={handleSuccess} />}
            {itemToEdit && <EditIncomeModal item={itemToEdit} budgetId={budgetId} onClose={() => setItemToEdit(null)} onSuccess={handleEditSuccess} />}
            {isEditDatesModalOpen && <EditDatesModal budget={budget} onClose={() => setIsEditDatesModalOpen(false)} onSuccess={handleDatesUpdateSuccess} />}
            <ConfirmationModal isOpen={!!itemToRemove} onClose={() => setItemToRemove(null)} onConfirm={handleRemoveIncome} title="Confirm Removal" message={`Are you sure you want to remove "${itemToRemove?.label}"?`} />
            <ReceiveIncomeModal isOpen={!!itemToReceive} item={itemToReceive} budgetId={budgetId} onClose={() => setItemToReceive(null)} onSuccess={handleReceiveSuccess} />
            <EditBudgetItemModal isOpen={!!itemToEdit} onClose={() => setItemToEdit(null)} onSuccess={handleEditSuccess} item={itemToEdit} budgetId={budgetId} />
            {goals.length > 0 && <AccelerateGoalModal isOpen={isAccelerateModalOpen} onClose={() => setIsAccelerateModalOpen(false)} onSuccess={()=>{setIsAccelerateModalOpen(false); refreshBudget();}} goal={goals.find(g=>g.status === 'active')} surplus={budget.initial_income.reduce((s,i)=>s+parseFloat(i.amount||0),0) - budget.initial_expenses.reduce((s,e)=>s+parseFloat(e.estimated_amount||0),0)} budgetId={budgetId} />}
        </div>
    );
}

export default BudgetPage;