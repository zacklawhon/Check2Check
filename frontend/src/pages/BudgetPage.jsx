import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import VariableExpenseItem from '../components/VariableExpenseItem';
import RecurringExpenseItem from '../components/RecurringExpenseItem';
import AddItemModal from '../components/modals/AddItemModal';
import EditIncomeModal from '../components/modals/EditIncomeModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import EditDatesModal from '../components/modals/EditDatesModal';
import AccountsCard from '../components/AccountsCard';
import NextStepsPrompt from '../components/NextStepsPrompt';
import AccelerateGoalModal from '../components/modals/AccelerateGoalModal';
import ReceiveIncomeModal from '../components/modals/ReceiveIncomeModal';

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

    const fetchPageData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const [budgetRes, transactionsRes, goalsRes] = await Promise.all([
                fetch(`/api/budget/${budgetId}`, { credentials: 'include' }),
                fetch(`/api/budget/transactions/${budgetId}`, { credentials: 'include' }),
                fetch('/api/goals', { credentials: 'include' }) // This line was missing
            ]);

            if (!budgetRes.ok || !transactionsRes.ok || !goalsRes.ok) {
                throw new Error('Could not fetch all budget data.');
            }

            setBudget(await budgetRes.json());
            setTransactions(await transactionsRes.json());
            setGoals(await goalsRes.json());

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
    const handleEditSuccess = () => { setItemToEdit(null); refreshBudget(); };
    const handleDatesUpdateSuccess = () => { setIsEditDatesModalOpen(false); refreshBudget(); };

    const handleRemoveIncome = async () => {
        if (!itemToRemove) return;
        try {
            const response = await fetch(`/api/budget/remove-income/${budgetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ label: itemToRemove.label })
            });
            if (!response.ok) throw new Error('Failed to remove income.');
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
            const response = await fetch(`/api/budget/close/${budgetId}`, {
                method: 'POST',
                credentials: 'include'
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to close budget.');
            }
            window.location.href = `/review/${budgetId}`;
        } catch (err) {
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

    if (loading) return <div className="text-white p-8 text-center">Loading your budget...</div>;
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

            {showNextSteps && <NextStepsPrompt onDismiss={refreshBudget} />}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 flex flex-col gap-8">
                    {expectedSurplus > 0 && activeGoal && (
                        <div className="bg-indigo-800 p-6 rounded-lg shadow-xl border border-indigo-500">
                            <h2 className="text-2xl font-bold mb-3 text-center">Accelerate Your Goal!</h2>
                            <p className="text-indigo-200 text-center mb-4">
                                You have an expected surplus of <strong className="text-white">${expectedSurplus.toFixed(2)}</strong>. Put it to work!
                            </p>
                            <button
                                onClick={() => setIsAccelerateModalOpen(true)}
                                className="w-full bg-white text-indigo-800 font-bold py-2 px-4 rounded-lg hover:bg-indigo-100"
                            >
                                Apply Surplus
                            </button>
                        </div>
                    )}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                        <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Summary</h2>
                        <div className="space-y-3">
                            {/* --- UPDATED SUMMARY DISPLAY --- */}
                            <div className="flex justify-between">
                                <span className="text-gray-400">Expected Income:</span>
                                <span className="font-semibold">${totalExpectedIncome.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Received Income:</span>
                                <span className="font-semibold text-green-500">${totalReceivedIncome.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Planned Expenses:</span>
                                <span className="font-semibold text-red-400">${totalExpectedExpenses.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">{surplusLabel}:</span>
                                <span className={`font-semibold ${surplusColor}`}>${displaySurplusAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Expenses Paid:</span>
                                <span className="font-semibold text-red-500">${totalExpensesPaid.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-4 border-t border-gray-600">
                                <span className="text-gray-300 font-bold">Current Cash:</span>
                                <span className={`font-bold text-lg ${currentCash >= 0 ? 'text-green-400' : 'text-red-400'}`}>${currentCash.toFixed(2)}</span>
                            </div>
                        </div>
                        {isClosable && (
                            <div className="mt-6">
                                <button
                                    onClick={handleCloseBudget}
                                    disabled={isClosing}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500"
                                >
                                    {isClosing ? 'Closing...' : 'Close & Review Budget'}
                                </button>
                            </div>
                        )}
                    </div>
                    {accounts && accounts.length > 0 && (
                        <AccountsCard
                            accounts={accounts}
                            budgetId={budgetId}
                            onUpdate={refreshBudget}
                        />
                    )}
                </div>
                <div className="md:col-span-2 bg-gray-800 p-6 rounded-lg shadow-xl">
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold text-green-400">Planned Income</h3>
                            <button onClick={() => setModalType('income')} className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg">+ Add</button>
                        </div>
                        <ul className="space-y-2">
                            {budget.initial_income.map((incomeItem, index) => {
                                // Check if this income has been received
                                const isReceived = incomeItem.is_received === true;
                                return (
                                    <li key={`income-${index}`} className={`flex justify-between items-center p-3 rounded-md transition-colors ${isReceived ? 'bg-gray-700' : 'bg-gray-900/50'}`}>
                                    <div>
                                        <p className={`font-semibold ${isReceived ? 'text-gray-400 line-through' : ''}`}>{incomeItem.label}</p>
                                        {/* --- THIS IS THE FIX --- */}
                                        {/* Display the projected date for the income event */}
                                        <p className="text-xs text-gray-400">
                                            Expected: <span className="font-semibold text-indigo-300">{formatDate(incomeItem.date)}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`font-semibold ${isReceived ? 'text-gray-500' : 'text-green-400'}`}>+ ${parseFloat(incomeItem.amount).toFixed(2)}</span>
                                        {!isReceived && (
                                            <button onClick={() => setItemToReceive(incomeItem)} title="Mark as Received" className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-2 rounded">
                                                Receive
                                            </button>
                                        )}
                                        <button disabled={isReceived} onClick={() => setItemToEdit(incomeItem)} title="Edit" className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed">
                                            {/* SVG icon */}
                                        </button>
                                        <button disabled={isReceived} onClick={() => setItemToRemove(incomeItem)} title="Remove" className="text-gray-400 hover:text-white font-bold text-lg disabled:text-gray-600 disabled:cursor-not-allowed">&times;</button>
                                    </div>
                                </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-3 text-red-400">Expenses</h3>
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-gray-300">Recurring Bills</h4>
                                <button onClick={() => setModalType('recurring')} className="text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-lg">+ Add</button>
                            </div>
                            <div className="space-y-4">
                                {Object.keys(groupedRecurringExpenses).sort().map(category => (
                                    <div key={category}>
                                        <h5 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{category}</h5>
                                        <ul className="space-y-2">
                                            {groupedRecurringExpenses[category].map((item, index) => (
                                                <RecurringExpenseItem
                                                    key={`rec-exp-${item.id || index}`}
                                                    item={item}
                                                    budgetId={budgetId}
                                                    onUpdate={refreshBudget}
                                                />
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <hr className="border-gray-700 my-6" />
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-gray-300">Variable Spending</h4>
                                <button onClick={() => setModalType('variable')} className="text-sm bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-1 px-3 rounded-lg">+ Add</button>
                            </div>
                            <ul className="space-y-2">
                                {variableExpenses.map((item, index) => (
                                    <VariableExpenseItem
                                        key={`var-exp-${item.label}-${index}`}
                                        item={item}
                                        budgetId={budgetId}
                                        onUpdate={refreshBudget}
                                        transactions={transactions.filter(t => t.type === 'expense' && t.category_name === item.label)}
                                    />
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {activeGoal && (
                <AccelerateGoalModal
                    isOpen={isAccelerateModalOpen}
                    onClose={() => setIsAccelerateModalOpen(false)}
                    onSuccess={() => {
                        setIsAccelerateModalOpen(false);
                        refreshBudget();
                    }}
                    goal={activeGoal}
                    surplus={expectedSurplus}
                    budgetId={budgetId}
                />
            )}

            {modalType && (
                <AddItemModal
                    type={modalType}
                    budgetId={budgetId}
                    accounts={accounts}
                    onClose={() => setModalType(null)}
                    onSuccess={handleSuccess}
                />
            )}
            {itemToEdit && (
                <EditIncomeModal
                    item={itemToEdit}
                    budgetId={budgetId}
                    onClose={() => setItemToEdit(null)}
                    onSuccess={handleEditSuccess}
                />
            )}
            {isEditDatesModalOpen && (
                <EditDatesModal budget={budget} onClose={() => setIsEditDatesModalOpen(false)} onSuccess={handleDatesUpdateSuccess} />
            )}
            <ConfirmationModal
                isOpen={!!itemToRemove}
                onClose={() => setItemToRemove(null)}
                onConfirm={handleRemoveIncome}
                title="Confirm Removal"
                message={`Are you sure you want to remove the income source "${itemToRemove?.label}"? This will create a negative transaction to balance your budget.`}
            />
            <ReceiveIncomeModal
                isOpen={!!itemToReceive}
                item={itemToReceive}
                budgetId={budgetId}
                onClose={() => setItemToReceive(null)}
                onSuccess={handleReceiveSuccess}
            />
        </div>
    );
}

export default BudgetPage;
