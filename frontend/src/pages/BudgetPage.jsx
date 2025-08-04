import React, { useState, useEffect } from 'react';
import VariableExpenseItem from '../components/VariableExpenseItem';
import RecurringExpenseItem from '../components/RecurringExpenseItem';
import AddItemModal from '../components/AddItemModal';
import EditIncomeModal from '../components/EditIncomeModal';
import ConfirmationModal from '../components/ConfirmationModal';
import EditDatesModal from '../components/EditDatesModal';

function BudgetPage({ budgetId, navigate }) {
    const [budget, setBudget] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalType, setModalType] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToRemove, setItemToRemove] = useState(null);
    const [isEditDatesModalOpen, setIsEditDatesModalOpen] = useState(false);
    const [showSoftClose, setShowSoftClose] = useState(false);

    const fetchBudgetData = async (isRefresh = false) => {
        if (!budgetId) return;
        if (!isRefresh) setLoading(true);
        try {
            const [budgetRes, transactionsRes, profileRes] = await Promise.all([
                fetch(`/api/budget/${budgetId}`, { credentials: 'include' }),
                fetch(`/api/budget/transactions/${budgetId}`, { credentials: 'include' }),
                fetch('/api/user/profile', { credentials: 'include' })
            ]);
            
            if (!budgetRes.ok || !transactionsRes.ok || !profileRes.ok) {
                throw new Error('Could not fetch all budget data.');
            }

            const budgetData = await budgetRes.json();
            const transactionsData = await transactionsRes.json();
            const profileData = await profileRes.json();
            
            setBudget(budgetData);
            setTransactions(transactionsData);
            setUser(profileData);
            
            const recurring = budgetData.initial_expenses.filter(exp => exp.type === 'recurring');
            if (recurring.length > 0 && recurring.every(exp => exp.is_paid)) {
                setShowSoftClose(true);
            } else {
                setShowSoftClose(false);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgetData();
    }, [budgetId]);

    const refreshBudget = () => { fetchBudgetData(true); };
    const handleSuccess = () => { setModalType(null); refreshBudget(); };

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

    if (loading) return <div className="text-white p-8 text-center">Loading your budget...</div>;
    if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;
    if (!budget || !user) return <div className="text-white p-8 text-center">Budget or user data not found.</div>;

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpensesPaid = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const currentCash = totalIncome - totalExpensesPaid;
    const totalExpectedExpenses = budget.initial_expenses.reduce((sum, item) => sum + parseFloat(item.estimated_amount || 0), 0);

    const recurringExpenses = budget.initial_expenses.filter(exp => exp.type === 'recurring');
    const variableExpenses = budget.initial_expenses.filter(exp => exp.type === 'variable');

    const groupedRecurringExpenses = recurringExpenses.reduce((acc, expense) => {
        const category = expense.category || 'other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(expense);
        return acc;
    }, {});

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

            {showSoftClose && !user.demographic_zip_code && (
                <SavingsSetupPrompt onSetupComplete={refreshBudget} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 bg-gray-800 p-6 rounded-lg shadow-xl self-start">
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
                            <span className="text-gray-400">Expenses Paid:</span>
                            <span className="font-semibold text-red-500">${totalExpensesPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-4 border-t border-gray-600">
                            <span className="text-gray-300 font-bold">Current Cash:</span>
                            <span className={`font-bold text-lg ${currentCash >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${currentCash.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 bg-gray-800 p-6 rounded-lg shadow-xl">
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-bold text-green-400">Income</h3>
                            <button onClick={() => setModalType('income')} className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg">+ Add</button>
                        </div>
                        <ul className="space-y-2">
                            {budget.initial_income.map((item, index) => (
                                <li key={`inc-${index}`} className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
                                    <span>{item.label}</span>
                                    <div className="flex items-center gap-4">
                                        <span>+ ${parseFloat(item.amount).toFixed(2)}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setItemToEdit(item)} className="text-gray-400 hover:text-white text-xs">Edit</button>
                                            <button onClick={() => setItemToRemove(item)} className="text-gray-400 hover:text-white font-bold">&times;</button>
                                        </div>
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
                                {variableExpenses.map((item, index) => {
                                    const itemTransactions = transactions.filter(t => t.category_name === item.label && t.type === 'expense');
                                    return (
                                        <VariableExpenseItem
                                            key={`var-exp-${index}`}
                                            item={item}
                                            budgetId={budgetId}
                                            transactions={itemTransactions}
                                            onUpdate={refreshBudget}
                                        />
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {modalType && (
                <AddItemModal
                    type={modalType}
                    budgetId={budgetId}
                    onClose={() => setModalType(null)}
                    onSuccess={handleSuccess}
                />
            )}

            {itemToEdit && (
                <EditIncomeModal
                    item={itemToEdit}
                    budgetId={budgetId}
                    onClose={() => setItemToEdit(null)}
                    onSuccess={() => {
                        setItemToEdit(null);
                        refreshBudget();
                    }}
                />
            )}

            {isEditDatesModalOpen && (
                <EditDatesModal
                    budget={budget}
                    onClose={() => setIsEditDatesModalOpen(false)}
                    onSuccess={() => {
                        setIsEditDatesModalOpen(false);
                        refreshBudget();
                    }}
                />
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

function SavingsSetupPrompt({ onSetupComplete }) {
    const [hasSavings, setHasSavings] = useState(null);
    const [zipCode, setZipCode] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!hasSavings || !zipCode) {
            setError('Please answer all required questions.');
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/budget/initialize-savings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    hasSavings: hasSavings,
                    zipCode: zipCode,
                    initialBalance: initialBalance
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Could not save your information.');
            }
            
            setIsSubmitted(true);
            setTimeout(() => onSetupComplete(), 1500);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    if (isSubmitted) {
        return (
            <div className="bg-green-800 border-l-4 border-green-500 text-green-100 p-4 rounded-lg mb-8 shadow-lg text-center">
                <h3 className="font-bold text-lg">Thank You!</h3>
                <p>Your information has been saved. Keep up the great work!</p>
            </div>
        )
    }

    return (
        <div className="bg-indigo-800 border-l-4 border-indigo-500 text-indigo-100 p-6 rounded-lg mb-8 shadow-lg">
            <h3 className="font-bold text-lg">Congratulations on paying your bills!</h3>
            <p className="mb-4">Let's take a moment to plan for your financial future. Please answer the questions below.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold mb-2">Do you have a savings account?</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="hasSavings" value="true" onChange={(e) => setHasSavings(e.target.value)} className="form-radio h-4 w-4 text-indigo-400 bg-gray-700 border-gray-600"/>
                            <span>Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="hasSavings" value="false" onChange={(e) => setHasSavings(e.target.value)} className="form-radio h-4 w-4 text-indigo-400 bg-gray-700 border-gray-600"/>
                            <span>No</span>
                        </label>
                    </div>
                </div>

                {hasSavings === 'true' && (
                    <div>
                        <label htmlFor="initial-balance" className="block text-sm font-semibold mb-1">What is your current savings balance? (Optional)</label>
                        <input
                            id="initial-balance"
                            type="number"
                            step="0.01"
                            value={initialBalance}
                            onChange={(e) => setInitialBalance(e.target.value)}
                            placeholder="e.g., 150.00"
                            className="w-full bg-indigo-900/50 text-white rounded-lg p-2 border border-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                        />
                    </div>
                )}
                
                 {hasSavings === 'false' && (
                    <p className="text-sm p-3 bg-indigo-900/50 rounded-lg">That's okay! A great next step is to open a high-yield savings account. It's a safe place to grow your money.</p>
                )}

                <div>
                    <label htmlFor="zip-code" className="block text-sm font-semibold mb-1">What is your Zip Code?</label>
                    <input
                        id="zip-code"
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="e.g., 90210"
                        required
                        className="w-full bg-indigo-900/50 text-white rounded-lg p-2 border border-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                </div>

                {error && <p className="text-red-300 text-sm">{error}</p>}

                <div className="text-right">
                    <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500">
                        {loading ? 'Saving...' : 'Save & Continue'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default BudgetPage;