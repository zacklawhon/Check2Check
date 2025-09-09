import React, { useState } from 'react';
import RecurringExpenseItem from './RecurringExpenseItem';
import VariableExpenseItem from './VariableExpenseItem';
import ConfirmationModal from '../common/ConfirmationModal';
import EditBudgetItemModal from './modals/EditBudgetItemModal';
import * as api from '../../utils/api';

function ExpensesList({ expenseItems, transactions, budgetId, user, onAddItem, onStateUpdate, onItemRequest, pendingRequests, onItemRequestCancel, budget }) {
    // --- REFACTOR START ---
    // State for all expense-related actions now lives here.
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToRemove, setItemToRemove] = useState(null);

    // Handler for removing an expense
    const handleRemoveExpense = async () => {
        if (!itemToRemove) return;
        try {
            const response = await api.removeExpenseItem(budgetId, itemToRemove.label);
            onStateUpdate(response); // Pass the new state up to the page
            setItemToRemove(null);    // Close the modal
        } catch (err) {
            setItemToRemove(null);
        }
    };

    // Combined success handler for any modal in this component
    const handleModalSuccess = (response) => {
        onStateUpdate(response);
        setItemToEdit(null); // Close the edit modal
    };
    // --- REFACTOR END ---

    const canEdit = !user.is_partner || user.permission_level !== 'read_only';

    // Always use the latest expenseItems prop (already merged in parent) for rendering
    const recurringExpenses = expenseItems.filter(exp => exp.type === 'recurring');
    const variableExpenses = expenseItems.filter(exp => exp.type === 'variable');

    const groupedRecurring = recurringExpenses.reduce((acc, expense) => {
        const category = expense.category || 'other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(expense);
        return acc;
    }, {});

    // Find pending "add_expense" requests not already in expenseItems
    const pendingAddExpenseRequests = (budget?.action_requests || [])
        .filter(req => req.action_type === 'add_expense' && req.status === 'pending')
        .filter(req => {
            try {
                const payload = JSON.parse(req.payload);
                // Only include if NOT in expenseItems (by label, estimated_amount, and type)
                return !expenseItems.some(item =>
                    item.label === payload.label &&
                    String(item.estimated_amount) === String(payload.estimated_amount) &&
                    item.type === payload.type
                );
            } catch {
                return false;
            }
        })
        .map(req => {
            let payload = {};
            try {
                payload = JSON.parse(req.payload);
            } catch {}
            return {
                id: `pending-${req.id}`, // Unique ID for pending items
                label: payload.label || 'Pending Expense',
                estimated_amount: payload.estimated_amount || 0,
                category: payload.category || 'other',
                type: payload.type || 'recurring',
                is_paid: payload.is_paid || false,
                due_date: payload.due_date || null,
                pending_request: req,
            };
        });

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-red-400">Expenses</h3>
                {canEdit && (
                    <button
                        className="text-sm bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-lg"
                        onClick={onAddItem}
                    >
                        + Add
                    </button>
                )}
            </div>
            {/* Render pending add_expense requests at the top */}
            {pendingAddExpenseRequests.length > 0 && (
                <div className="mb-4">
                    <h4 className="font-semibold text-gray-400 capitalize mb-2">Pending Expenses</h4>
                    <ul className="space-y-2">
                        {pendingAddExpenseRequests.map((item, index) => (
                            <RecurringExpenseItem
                                key={`pending-add-expense-${item.label}-${index}`}
                                item={item}
                                budgetId={budgetId}
                                user={user}
                                onStateUpdate={onStateUpdate}
                                onEdit={() => {}}
                                onRemove={() => {}}
                                onItemRequest={onItemRequest}
                                onItemRequestCancel={onItemRequestCancel}
                                isPending={true}
                            />
                        ))}
                    </ul>
                </div>
            )}
            {Object.entries(groupedRecurring).map(([category, items]) => (
                <div key={category} className="mb-4">
                    <h4 className="font-semibold text-gray-400 capitalize mb-2">{category.replace('-', ' ')}</h4>
                    <ul className="space-y-2">
                        {items.map((item) => (
                            <RecurringExpenseItem
                                key={item.id || item.label}
                                item={item}
                                budgetId={budgetId}
                                user={user}
                                // Pass down the new state handlers
                                onStateUpdate={onStateUpdate}
                                onEdit={setItemToEdit}
                                onRemove={setItemToRemove}
                                onItemRequest={onItemRequest}
                                onItemRequestCancel={onItemRequestCancel}
                                isPending={pendingRequests.includes(item.label)}
                            />
                        ))}
                    </ul>
                </div>
            ))}
            <h4 className="font-semibold text-gray-400 capitalize mb-2 mt-6">Variable Expenses</h4>
            <ul className="space-y-2">
                {variableExpenses.map((item, index) => (
                    <VariableExpenseItem
                        key={`var-exp-${item.label}-${index}`}
                        item={item}
                        budgetId={budgetId}
                        user={user}
                        onStateUpdate={onStateUpdate}
                        itemTransactions={transactions.filter(t => t.type === 'expense' && t.category_name === item.label)}
                        onItemRequest={onItemRequest}
                        onRemove={setItemToRemove}
                        isPending={pendingRequests.includes(item.label)}
                    />
                ))}
            </ul>

            {/* All expense-related modals are now managed and rendered here */}
            <ConfirmationModal
                isOpen={!!itemToRemove}
                onClose={() => setItemToRemove(null)}
                onConfirm={handleRemoveExpense}
                title="Confirm Removal"
                message={`Are you sure you want to remove "${itemToRemove?.label}"?`}
            />
            <EditBudgetItemModal
                isOpen={!!itemToEdit}
                item={itemToEdit}
                budgetId={budgetId}
                hideDueDate={itemToEdit && itemToEdit.type === 'variable'}
                onClose={() => setItemToEdit(null)}
                onSuccess={handleModalSuccess} // Use the new success handler
            />
        </div>
    );
}

export default ExpensesList;