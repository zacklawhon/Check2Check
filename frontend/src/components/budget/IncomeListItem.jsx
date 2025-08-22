import React, { useState } from 'react';
import toast from 'react-hot-toast';

function IncomeListItem({ item, budgetId, onReceive, onEdit, onRemove, user, onUpdate, onItemRequest, isPending }) {
  const [loading, setLoading] = useState(false);
  const isReceived = item.is_received === true;
  const isReadOnly = user.is_partner && user.permission_level === 'read_only';
  const isUpdateByRequest = user.is_partner && user.permission_level === 'update_by_request';
  const isOwner = !user.owner_user_id;

  // --- Handlers for Owner's Approval ---
  const handleApproval = async (action) => {
    setLoading(true);
    const endpoint = `/api/sharing/${action}/${item.pending_request.id}`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Failed to ${action} request.`);
      toast.success(`Request ${action}d!`);
      onUpdate();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Partner/Owner Actions ---
  const handleRemoveClick = async () => {
    if (window.confirm(`Are you sure you want to remove "${item.label}"?`)) {
      try {
        const response = await fetch(`/api/budget-items/remove-income/${budgetId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ label: item.label }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.messages?.error);
        toast.success(data.message);

        // 2. ADD THIS LOGIC BLOCK
        if (isUpdateByRequest) {
          // Tell the parent page to update the UI to "Requested"
          onItemRequest(item.label);
        } else {
          // Owners get a full data refresh
          onUpdate();
        }
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // --- RENDER LOGIC ---

  if (isPending) {
        return (
            <li className="flex justify-between items-center p-3 rounded-md bg-yellow-900/50">
                <div>
                    <p className="font-semibold text-gray-300">{item.label}</p>
                    <p className="text-xs text-yellow-400">A request has been sent for this item.</p>
                </div>
                <button disabled className="bg-yellow-600 text-white text-xs font-bold py-1 px-2 rounded cursor-not-allowed">
                    Requested
                </button>
            </li>
        );
    }

  // SCENARIO 1: The item has a pending request (Owner's View)
  if (isOwner && item.pending_request) {
    return (
      <li className="p-3 rounded-md bg-yellow-900/50 border-2 border-yellow-500">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold">{item.label} <span className="text-gray-400 line-through">${parseFloat(item.amount).toFixed(2)}</span></p>
            <p className="text-sm text-yellow-300 italic">
              Pending: {item.pending_request.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleApproval('approve')} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 text-sm rounded-lg">Approve</button>
            <button onClick={() => handleApproval('deny')} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 text-sm rounded-lg">Deny</button>
          </div>
        </div>
      </li>
    );
  }

  // SCENARIO 2: Default view for Owners and Partners
  return (
    <li className={`flex justify-between items-center p-3 rounded-md transition-colors ${isReceived ? 'bg-gray-700' : 'bg-gray-900/50'}`}>
      <div>
        <p className={`font-semibold ${isReceived ? 'text-gray-400 line-through' : ''}`}>{item.label}</p>
        <p className="text-xs text-gray-400">
          Expected: <span className="font-semibold text-indigo-300">{formatDate(item.date)}</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-semibold ${isReceived ? 'text-gray-500' : 'text-green-400'}`}>
          + ${parseFloat(item.amount).toFixed(2)}
        </span>

        {!isReceived && !isReadOnly && (
          <button onClick={() => onReceive(item)} title="Mark as Received" className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-2 rounded">
            Receive
          </button>
        )}

        <button onClick={() => onEdit(item)} disabled={isReceived || isReadOnly} title="Edit" className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed">
          {/* SVG for Edit */}
        </button>
        <button onClick={handleRemoveClick} disabled={isReceived || isReadOnly} title="Remove" className="text-gray-400 hover:text-white font-bold text-lg disabled:text-gray-600 disabled:cursor-not-allowed">
          &times;
        </button>
      </div>
    </li>
  );
}

export default IncomeListItem;