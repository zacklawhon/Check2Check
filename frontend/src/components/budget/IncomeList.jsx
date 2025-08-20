import React from 'react';
import IncomeListItem from './IncomeListItem'; // The component we created in the last step

function IncomeList({ incomeItems, user, onAddItem, onReceiveItem, onEditItem, onRemoveItem }) {
  const canEdit = !user.is_partner || user.permission_level !== 'read_only';

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
        {incomeItems.map((item, index) => (
          <IncomeListItem
            key={`income-${index}`}
            item={item}
            user={user} // Pass user permissions down to each item
            onReceive={onReceiveItem}
            onEdit={onEditItem}
            onRemove={onRemoveItem}
          />
        ))}
      </ul>
    </div>
  );
}

export default IncomeList;