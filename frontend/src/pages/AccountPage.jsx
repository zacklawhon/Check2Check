import React, { useState, useEffect } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';
import EditItemModal from '../components/modals/EditItemModal';
import ProfileForm from '../components/account/ProfileForm';
import FinancialToolsForm from '../components/account/FinancialToolsForm';
import AccountActions from '../components/account/AccountActions';
import { getDayWithOrdinal } from '../components/utils/formatters';

function AccountPage({ user: initialUser }) {
    const [items, setItems] = useState({ income_sources: [], recurring_expenses: [] });
    const [user, setUser] = useState(initialUser);
    const [financialTools, setFinancialTools] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchData = async () => {
        if (!loading) setLoading(true); 
        try {
            const [itemsRes, userRes, toolsRes] = await Promise.all([
                fetch('/api/account/recurring-items', { credentials: 'include' }),
                fetch('/api/user/profile', { credentials: 'include' }),
                fetch('/api/account/financial-tools', { credentials: 'include' })
            ]);

            if (!itemsRes.ok || !userRes.ok || !toolsRes.ok) throw new Error('Failed to fetch account data.');
            
            const itemsData = await itemsRes.json();
            const userData = await userRes.json();
            const toolsData = await toolsRes.json();
            
            setItems(itemsData);
            setUser(userData);
            setFinancialTools(toolsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteClick = (item, type) => {
        setItemToDelete({ ...item, type });
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        const { type, id } = itemToDelete;
        const url = type === 'income' ? `/api/account/income-sources/${id}` : `/api/account/recurring-expenses/${id}`;
        try {
            const response = await fetch(url, { method: 'DELETE', credentials: 'include' });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Failed to deactivate ${type}.`);
            }
            fetchData();
        } catch (err) {
            setError(err.message);
        } finally {
            setItemToDelete(null);
        }
    };
    
    const handleEditSuccess = () => {
        setEditingItem(null);
        fetchData();
    };

    const groupedExpenses = items.recurring_expenses.reduce((acc, expense) => {
        const category = expense.category || 'other';
        if (!acc[category]) { acc[category] = []; }
        acc[category].push(expense);
        return acc;
    }, {});

    if (loading || !user || !financialTools) return <div className="text-center p-8 text-white">Loading...</div>;
    
    return (
        <>
            <div className="container mx-auto p-4 md:p-8">
                <h1 className="text-4xl font-bold text-white text-center mb-8">Account Management</h1>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <div className="space-y-8 max-w-4xl mx-auto">
                    <ProfileForm user={user} onUpdate={fetchData} />
                    <FinancialToolsForm financialTools={financialTools} onUpdate={fetchData} />

                    <div className="bg-gray-800 p-6 rounded-lg">
                        <h2 className="text-2xl font-bold text-green-400 mb-4">Saved Income</h2>
                        <ul className="space-y-3">
                            {items.income_sources.map(item => (
                                <li key={item.id} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                                    <div>
                                        {/* --- FIX: Added text color classes --- */}
                                        <p className="font-semibold text-gray-200">{item.label}</p>
                                        <p className="text-sm text-gray-400 capitalize">{item.frequency}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingItem(item)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
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
                                                    {/* --- FIX: Added text color classes --- */}
                                                    <p className="font-semibold text-gray-200">{item.label}</p>
                                                    <div className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                                                        <span className="capitalize">{item.category}</span>
                                                        {item.due_date && <span>(Due: {getDayWithOrdinal(parseInt(item.due_date, 10))})</span>}
                                                        {item.principal_balance && <span className="hidden sm:inline">(Bal: ${item.principal_balance})</span>}
                                                        {item.interest_rate && <span className="hidden sm:inline">({item.interest_rate}%)</span>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingItem(item)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                                                    <button onClick={() => handleDeleteClick(item, 'expense')} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                    <AccountActions />
                </div>
            </div>

            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={confirmDelete}
                title={`Deactivate ${itemToDelete?.type}`}
                message={`Are you sure you want to deactivate "${itemToDelete?.label}"? It will no longer be suggested for new budgets.`}
            />

            <EditItemModal 
                isOpen={!!editingItem}
                item={editingItem}
                onClose={() => setEditingItem(null)}
                onSuccess={handleEditSuccess}
            />
        </>
    );
}

export default AccountPage;