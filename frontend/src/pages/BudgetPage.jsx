import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import VariableExpenseItem from '../components/VariableExpenseItem';
import RecurringExpenseItem from '../components/RecurringExpenseItem';
import AddItemModal from '../components/modals/AddItemModal';
import EditIncomeModal from '../components/modals/EditIncomeModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import EditDatesModal from '../components/modals/EditDatesModal';
import AccountsCard from '../components/AccountsCard';
import NextStepsPrompt from '../components/NextStepsPrompt'; // 1. Import the new component

function BudgetPage() {
    const { budgetId } = useParams();
    const navigate = useNavigate();
    const { user, accounts, refreshData: refreshGlobalData } = useOutletContext();

    const [budget, setBudget] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalType, setModalType] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToRemove, setItemToRemove] = useState(null);
    const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    // 2. Add state to control the new prompt's visibility
    const [showNextSteps, setShowNextSteps] = useState(false);

    const fetchBudgetData = async (isRefresh = false) => {
        if (!budgetId) return;
        if (!isRefresh) setLoading(true);
        try {
            const [budgetRes, transactionsRes] = await Promise.all([
                fetch(`/api/budget/${budgetId}`, { credentials: 'include' }),
                fetch(`/api/budget/transactions/${budgetId}`, { credentials: 'include' })
            ]);

            if (!budgetRes.ok || !transactionsRes.ok) throw new Error('Could not fetch budget data.');

            const budgetData = await budgetRes.json();
            setBudget(budgetData);
            setTransactions(await transactionsRes.json());

            // --- 3. This is the new trigger logic for the prompt ---
            const recurring = budgetData.initial_expenses.filter(exp => exp.type === 'recurring');
            // Show prompt if all bills are paid AND it's the user's first budget
            if (user && user.completed_budget_count === 0 && !user.has_seen_accounts_prompt && recurring.length > 0 && recurring.every(exp => exp.is_paid)) {
                setShowNextSteps(true);
            } else {
                setShowNextSteps(false);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgetData();
    }, [budgetId, user]); // Add user to dependency array to re-evaluate when it loads

    const refreshBudget = () => {
        fetchBudgetData(true);
        if (refreshGlobalData) {
            refreshGlobalData();
        }
    };

    const handleSuccess = () => { setModalType(null); refreshBudget(); };
    const handleEditSuccess = () => { setItemToEdit(null); refreshBudget(); };

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

    if (loading) return <div className="text-white p-8 text-center">Loading your budget...</div>;
    if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;
    if (!budget || !user) return <div className="text-white p-8 text-center">Budget or user data not found.</div>;

    const totalExpectedIncome = budget.initial_income.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const totalExpectedExpenses = budget.initial_expenses.reduce((sum, item) => sum + parseFloat(item.estimated_amount || 0), 0);
    const expectedSurplus = totalExpectedIncome - totalExpectedExpenses;
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpensesPaid = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const currentCash = totalIncome - totalExpensesPaid;
    let surplusLabel = 'Expected Surplus';
    let surplusColor = 'text-white';
    if (expectedSurplus > 0) {
        surplusLabel = 'Expected Surplus';
        surplusColor = 'text-green-400';
    } else if (expectedSurplus < 0) {
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

            {/* --- 4. Render the new prompt when its state is true --- */}
            {showNextSteps && <NextStepsPrompt />}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 flex flex-col gap-8">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                        <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Summary</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Total Income:</span>
                                <span className="font-semibold text-green-500">${totalIncome.toFixed(2)}</span>
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
                            {budget.initial_income.map((incomeItem, index) => (
                                <li key={`income-${incomeItem.id || incomeItem.label}-${index}`} className="flex justify-between items-center bg-gray-900/50 p-3 rounded-md">
                                    <div>
                                        <p>{incomeItem.label}</p>
                                        <p className="text-xs text-gray-400 capitalize">{incomeItem.frequency}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-green-400">+ ${parseFloat(incomeItem.amount).toFixed(2)}</span>
                                        <button onClick={() => setItemToEdit(incomeItem)} title="Edit" className="text-gray-400 hover:text-white">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => setItemToRemove(incomeItem)} title="Remove" className="text-gray-400 hover:text-white font-bold text-lg">&times;</button>
                                    </div>
                                </li>
                            ))}
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
                <EditDatesModal budget={budget} onClose={() => setIsEditDatesModalOpen(false)} onSuccess={refreshBudget} />
            )}
            <ConfirmationModal
                isOpen={!!itemToRemove}
                onClose={() => setItemToRemove(null)}
                onConfirm={handleRemoveIncome}
                title="Confirm Removal"
                message={`Are you sure you want to remove the income source "${itemToRemove?.label}"? This will create a negative transaction to balance your budget.`}
            />
        </div>
    );
}

export default BudgetPage;