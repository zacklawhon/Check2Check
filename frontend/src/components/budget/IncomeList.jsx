import React, { useState } from 'react';
import IncomeListItem from './IncomeListItem';
import ConfirmationModal from '../common/ConfirmationModal';
import EditIncomeItemModal from '../budget/modals/EditIncomeItemModal'; // Import Edit Modal
import ReceiveIncomeModal from '../budget/modals/ReceiveIncomeModal'; // Import Receive Modal
import * as api from '../../utils/api';

function IncomeList({ incomeItems, user, onAddItem, onItemRequest, pendingRequests, budgetId, onStateUpdate, onItemRequestCancel, budget, onRefresh }) {
  console.log('IncomeList props:', { incomeItems, budget });
  const canEdit = !user.is_partner || user.permission_level !== 'read_only';

  // --- REFACTOR START ---
  // State for all income-related actions now lives here.
  const [itemToRemove, setItemToRemove] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToReceive, setItemToReceive] = useState(null);

  const handleRemoveIncome = async () => {
    if (!itemToRemove) return;
    try {
      const response = await api.removeIncomeItem(budgetId, itemToRemove.label);
      onStateUpdate(response);
      setItemToRemove(null);
    } catch (err) {
      setItemToRemove(null);
    }
  };
  // --- REFACTOR END ---

  // Find pending "add_income" requests not already in incomeItems
  const pendingAddIncomeRequests = (budget?.action_requests || [])
    .filter(req => req.action_type === 'add_income' && req.status === 'pending')
    .filter(req => {
      try {
        const payload = JSON.parse(req.payload);
        // Only include if NOT in incomeItems
        return !incomeItems.some(item =>
          item.label === payload.label && item.date === payload.date
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
        label: payload.label || 'Pending Income',
        amount: payload.amount || 0,
        date: payload.date || '',
        frequency: payload.frequency,
        is_received: false,
        pending_request: req,
      };
    });

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-bold text-green-400">Planned Income</h3>
        {canEdit && (
          <button
            onClick={onAddItem}
            className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg"
          >
            + Add
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {/* Render pending add_income requests first */}
        {pendingAddIncomeRequests.map((item, index) => (
          <IncomeListItem
            key={`pending-add-income-${item.label}-${item.date}-${index}`}
            item={item}
            user={user}
            onReceive={() => {}}
            onEdit={() => {}}
            onRemove={() => {}}
            budgetId={budgetId}
            onStateUpdate={onStateUpdate}
            onItemRequestCancel={onItemRequestCancel}
            onItemRequest={onItemRequest}
            isPending={true}
          />
        ))}
        {/* Render normal income items */}
        {incomeItems && incomeItems.map((item, index) => {
          const uniqueId = `${item.label}-${item.date}`;
          return (
            <IncomeListItem
              key={`${uniqueId}-${index}`}
              item={item}
              user={user}
              onReceive={setItemToReceive}
              onEdit={setItemToEdit}
              onRemove={setItemToRemove}
              budgetId={budgetId}
              onStateUpdate={onStateUpdate}
              onItemRequestCancel={onItemRequestCancel}
              onItemRequest={onItemRequest}
              isPending={pendingRequests && pendingRequests.includes(uniqueId)}
            />
          );
        })}
      </ul>
      {/* All income-related modals are now managed and rendered here */}
      <ConfirmationModal
        isOpen={!!itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={handleRemoveIncome}
        title="Confirm Removal"
        message={`Are you sure you want to remove "${itemToRemove?.label}"?`}
      />
      <EditIncomeItemModal
        isOpen={!!itemToEdit}
        item={itemToEdit}
        budgetId={budgetId}
        onClose={() => setItemToEdit(null)}
        onSuccess={(response) => { onStateUpdate(response); setItemToEdit(null); }}
      />
      <ReceiveIncomeModal
        isOpen={!!itemToReceive}
        item={itemToReceive}
        budgetId={budgetId}
        onClose={() => setItemToReceive(null)}
        onSuccess={(response) => {
          onStateUpdate(response); // 1. Pass the new state up to the BudgetPage
          setItemToReceive(null); // 2. Close the modal by setting the local state to null
        }}
      />
    </div>
  );
}

export default IncomeList;