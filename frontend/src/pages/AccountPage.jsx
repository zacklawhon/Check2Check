import React, { useState, useEffect } from 'react';
import * as api from '../utils/api';
import { useNavigate, useOutletContext } from 'react-router-dom';
import ConfirmationModal from '../components/common/ConfirmationModal';
import EditItemModal from '../components/account/modals/EditItemModal';
import EditIncomeRuleModal from '../components/account/modals/EditIncomeRuleModal'; 
import EditGoalModal from '../components/account/modals/EditGoalModal';
import ProfileForm from '../components/account/ProfileForm';
import AccountActions from '../components/account/AccountActions';
import AccountManager from '../components/account/AccountManager';
import GoalsDisplay from '../components/account/GoalsDisplay';
import IntroGoalCard from '../components/account/IntroGoalCard'; 
import SharedAccessCard from '../components/account/SharedAccessCard';
import { getDayWithOrdinal } from '../components/utils/formatters';

function AccountPage() {
    const outletContext = useOutletContext();
    const [user, setUser] = useState(outletContext.user);
    const [items, setItems] = useState({ income_sources: [], recurring_expenses: [] });
    const [loading, setLoading] = useState(true);
    const [goals, setGoals] = useState([]);
    const [error, setError] = useState('');
    const [editingExpense, setEditingExpense] = useState(null);
    const [editingIncome, setEditingIncome] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [goalToDelete, setGoalToDelete] = useState(null);
    const [editingGoal, setEditingGoal] = useState(null);
    const [invites, setInvites] = useState([]);
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true); 
        try {
            const [fetchedItems, fetchedGoals, fetchedInvites] = await Promise.all([
                api.getRecurringItems(),
                api.getGoals(),
                api.getSharingInvites()
            ]);
            setItems(fetchedItems);
            setGoals(fetchedGoals);
            setInvites(fetchedInvites);
        } catch (err) {
            setError(err.message); // The API client already shows a toast
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setUser(outletContext.user);
    }, [outletContext.user]);

    const handleDeleteGoal = (goal) => {
        setGoalToDelete(goal);
    };

    // This function runs when the user confirms the deletion
    const confirmDeleteGoal = async () => {
        if (!goalToDelete) return;
        try {
            await api.deleteGoal(goalToDelete.id);
            // Update local state directly for seamless UI update
            setGoals(currentGoals => currentGoals.filter(g => g.id !== goalToDelete.id));
        } catch (err) {
            // Error toast is handled by the client
        } finally {
            setGoalToDelete(null);
        }
    };

    // This function will now open the edit modal
    const handleEditGoal = (goal) => {
        setEditingGoal(goal);
    };

    // Update the goal in local state after editing
    const handleEditGoalSuccess = (updatedGoal) => {
        setEditingGoal(null); // Close the modal
        setGoals(currentGoals =>
            currentGoals.map(g => g.id === updatedGoal.id ? { ...g, ...updatedGoal } : g)
        );
    };

    const handleDeleteClick = (item, type) => {
        setItemToDelete({ ...item, type });
    };

    // --- Profile update handler: update user state directly ---
    const handleProfileUpdate = (updatedFields) => {
        setUser(prev => ({
            ...prev,
            ...updatedFields,
        }));
    };

    // --- Recurring expense edit handler ---
    const handleEditExpenseSuccess = (updatedExpense) => {
        setEditingExpense(null);
        setItems(prev => ({
            ...prev,
            recurring_expenses: prev.recurring_expenses.map(e =>
                e.id === updatedExpense.id ? { ...e, ...updatedExpense } : e
            ),
        }));
    };

    // --- Income source edit handler ---
    const handleEditIncomeSuccess = (updatedIncome) => {
        setEditingIncome(null);
        setItems(prev => ({
            ...prev,
            income_sources: prev.income_sources.map(i =>
                i.id === updatedIncome.id ? { ...i, ...updatedIncome } : i
            ),
        }));
    };

    // --- Recurring item delete handler ---
    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await api.deleteRecurringItem(itemToDelete.type, itemToDelete.id);
            setItems(prev => {
                if (itemToDelete.type === 'income') {
                    return {
                        ...prev,
                        income_sources: prev.income_sources.filter(i => i.id !== itemToDelete.id),
                    };
                } else {
                    return {
                        ...prev,
                        recurring_expenses: prev.recurring_expenses.filter(e => e.id !== itemToDelete.id),
                    };
                }
            });
        } catch (err) {
            // Error toast is handled by the client
        } finally {
            setItemToDelete(null);
        }
    };

    const groupedExpenses = items.recurring_expenses.reduce((acc, expense) => {
        const category = expense.category || 'other';
        if (!acc[category]) { acc[category] = []; }
        acc[category].push(expense);
        return acc;
    }, {});

    if (loading) return <div className="text-center p-8 text-white">Loading...</div>;

    return (
        <>
            <div className="container mx-auto p-4 md:p-8">
                <h1 className="text-4xl font-bold text-white text-center mb-8">Account Management</h1>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <div className="space-y-8 max-w-4xl mx-auto">
                    {/* 4. Conditionally render the "Nudge" card */}
                     {goals.length === 0 ? (
                        <IntroGoalCard onStart={() => navigate('/goals')} />
                    ) : (
                        <GoalsDisplay 
                            goals={goals}
                            onEdit={handleEditGoal}
                            onDelete={handleDeleteGoal}
                            onAddMore={() => navigate('/goals')}
                        />
                    )}

                    <AccountManager />

                    <ProfileForm
                        user={user}
                        onUpdate={handleProfileUpdate}
                        setUser={setUser}
                    />

                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-green-400 mb-4">Saved Income</h2>
                        <ul className="space-y-3">
                            {items.income_sources.map(item => (
                                <li key={item.id} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-200">{item.label}</p>
                                        <p className="text-sm text-gray-400 capitalize">{item.frequency}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {/* --- Use the new handler for income --- */}
                                        <button onClick={() => setEditingIncome(item)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                                        <button onClick={() => handleDeleteClick(item, 'income')} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">Saved Bills</h2>
                        <div className="space-y-4">
                            {Object.keys(groupedExpenses).sort().map(category => (
                                <div key={category}>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{category}</h3>
                                    <ul className="space-y-3">
                                        {groupedExpenses[category].map(item => (
                                            <li key={item.id} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-gray-200">{item.label}</p>
                                                    <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                                                        <span className="capitalize">{item.category}</span>
                                                        {item.due_date && <span>(Due: {getDayWithOrdinal(parseInt(item.due_date, 10))})</span>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingExpense(item)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                                                    <button onClick={() => handleDeleteClick(item, 'expense')} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                    <SharedAccessCard invites={invites} onUpdate={fetchData} />
                    <AccountActions />
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!goalToDelete}
                onClose={() => setGoalToDelete(null)}
                onConfirm={confirmDeleteGoal}
                title="Delete Goal"
                message={`Are you sure you want to delete the goal "${goalToDelete?.goal_name}"? This action cannot be undone.`}
            />

            <EditGoalModal
                isOpen={!!editingGoal}
                goal={editingGoal}
                onClose={() => setEditingGoal(null)}
                onSuccess={handleEditGoalSuccess}
            />

            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDelete}
                title={`Deactivate ${itemToDelete?.type}`}
                message={`Are you sure you want to deactivate "${itemToDelete?.label}"? It will no longer be suggested for new budgets.`}
            />

            <EditItemModal
                isOpen={!!editingExpense}
                item={editingExpense}
                onClose={() => setEditingExpense(null)}
                onSuccess={handleEditExpenseSuccess}
            />
            <EditIncomeRuleModal
                isOpen={!!editingIncome}
                incomeSource={editingIncome}
                onClose={() => setEditingIncome(null)}
                onSuccess={handleEditIncomeSuccess}
            />
        </>
    );
}

export default AccountPage;