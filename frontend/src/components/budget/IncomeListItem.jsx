import React, { useState } from 'react';
import toast from 'react-hot-toast';
import * as api from '../../utils/api';

function IncomeListItem({ item, budgetId, onReceive, onEdit, onRemove, user, onUpdate, onItemRequest, isPending, onItemRequestCancel }) {
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
      if (action === 'approve') {
        await api.approveRequest(item.pending_request.id);
      } else {
        await api.denyRequest(item.pending_request.id);
      }
      toast.success(`Request ${action}d!`);
      onStateUpdate(response);
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
        const data = await api.removeIncomeItem(budgetId, item.label);
        toast.success(data.message);

        if (isUpdateByRequest) {
          onItemRequest(item);
          onStateUpdate(response);
        } else {

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


      if (onItemRequestCancel) {
        onItemRequestCancel(item);
      } else {
        onStateUpdate(response);
      }
    } catch (err) {

    } finally {
      setLoading(false);
    }
  };
  // --- RENDER LOGIC ---

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
            onClick={handleCancelRequest}
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
        <button
          onClick={() => onRemove(item)} // This should now call the function from props
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