import React, { useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '../../utils/api';

function IncomeListItem({ item, budgetId, onReceive, onEdit, onRemove, user, onUpdate, onItemRequest, isPending, onItemRequestCancel, onStateUpdate, onRefresh, budget }) {
  const [loading, setLoading] = useState(false);
  const isReceived = !!item.is_received;
  const isReadOnly = user.is_partner && user.permission_level === 'read_only';
  const isUpdateByRequest = user.is_partner && user.permission_level === 'update_by_request';
  const isOwner = !user.owner_user_id;
  const uniqueId = `${item.label}-${item.date}`;

  // --- Handlers for Owner's Approval ---
  const handleApproval = async (action) => {
    setLoading(true);
    try {
      let response;
      if (action === 'approve') {
        response = await api.approveRequest(item.pending_request.id);
      } else {
        response = await api.denyRequest(item.pending_request.id);
      }
      toast.success(`Request ${action === 'deny' ? 'Denied' : 'Approved'}!`);
      if (onStateUpdate && response && response.budget) {
        onStateUpdate(response.budget); // Pass only the budget object
      } else if (onStateUpdate) {
        onStateUpdate(response);
      } else if (onUpdate) {
        onUpdate(response);
      }
    } catch (err) {
      // API client shows toast
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers for Partner/Owner Actions ---
  const handleRemoveClick = async () => {
    if (window.confirm(`Are you sure you want to remove "${item.label}"?`)) {
      try {
        const response = await api.removeIncomeItem(budgetId, item.label);
        toast.success(response.message);

        if (isUpdateByRequest) {
          onItemRequest(item);
          if (onStateUpdate) onStateUpdate(response);
        } else {
          if (onStateUpdate) onStateUpdate(response);
        }
      } catch (err) {
        // API client shows toast
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleCancelRequest = async () => {
    if (!item.pending_request) return;
    setLoading(true);
    try {
      await api.cancelRequest(item.pending_request.id);
      toast.success("Request cancelled!");
      if (onRefresh) onRefresh();

      if (onItemRequestCancel) {
        onItemRequestCancel(item);
      } else {
        onUpdate();
      }
    } catch (err) {

    } finally {
      setLoading(false);
    }
  };
  // --- RENDER LOGIC ---

  // Handle any pending request (not just add_income)
  if (item.pending_request) {
    // Partner's View for a pending item
    if (isUpdateByRequest) {
      return (
        <li className="flex justify-between items-center p-3 rounded-md bg-yellow-900/50">
          <div>
            <p className="font-semibold text-gray-300">{item.label}</p>
            <p className="text-xs text-yellow-400 italic">
              {item.pending_request.description}
            </p>
          </div>
          <button
            onClick={async () => {
              if (!item.pending_request) return;
              setLoading(true);
              try {
                await api.cancelRequest(item.pending_request.id);
                toast.success("Request cancelled!");
                if (onItemRequestCancel) {
                  onItemRequestCancel(item);
                } else {
                  if (onRefresh) onRefresh();
                }
              } catch (err) {
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded"
          >
            {loading ? '...' : 'Cancel'}
          </button>
        </li>
      );
    }

    // Owner's View for a pending item
    if (isOwner) {
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
  }

  // SCENARIO 2: Default view for Owners and Partners
  return (
    <li className={`flex justify-between items-center p-3 rounded-md transition-colors ${!isReceived ? 'hover:bg-gray-600' : ''} ${isReceived ? 'bg-gray-700 cursor-default' : 'bg-gray-900/50 cursor-pointer'}`} onClick={!isReceived ? () => onEdit(item) : undefined}>
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
          <button onClick={(e) => { e.stopPropagation(); onReceive(item); }} title="Mark as Received" className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-2 rounded">
            Receive
          </button>
        )}

        <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} disabled={isReceived || isReadOnly} title="Edit" className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed">
          {/* SVG for Edit */}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(item); }} // This should now call the function from props
          disabled={isReceived || isReadOnly}
          title="Remove"
          className="text-gray-400 hover:text-red-500 disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          { loading ? '...' : 'X' }
        </button>
      </div>
    </li>
  );
}

export default IncomeListItem;