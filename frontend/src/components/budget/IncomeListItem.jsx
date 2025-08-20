import React from 'react';


// The component receives the user object as a prop
function IncomeListItem({ item, onReceive, onEdit, onRemove, user }) {
  const isReceived = item.is_received === true;
  const canInteract = !user.is_partner || user.permission_level !== 'read_only';
  const isReadOnly = user.is_partner && user.permission_level === 'read_only';

  const handleReceiveClick = () => {
    if (user.is_partner && user.permission_level === 'update_by_request') {
      // TODO: Call a new handler to send an approval request
      alert('Request to receive income sent for approval!');
    } else {
      // Owner or full_access partner can open the modal directly
      onReceive(item);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <li className={`flex justify-between items-center p-3 rounded-md transition-colors ${isReceived ? 'bg-gray-700' : 'bg-gray-900/50'}`}>
      <div>
        <p className={`font-semibold ${isReceived ? 'text-gray-400 line-through' : ''}`}>{item.label}</p>
        <p className="text-xs text-gray-400">
          {/* 2. Replace the placeholder comment with the function call */}
          Expected: <span className="font-semibold text-indigo-300">{formatDate(item.date)}</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-semibold ${isReceived ? 'text-gray-500' : 'text-green-400'}`}>
          + ${parseFloat(item.amount).toFixed(2)}
        </span>

        {/* Render buttons only if the user is not read_only */}
        {canInteract && !isReceived && (
          <button
            onClick={handleReceiveClick}
            title="Mark as Received"
            className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-2 rounded"
          >
            Receive
          </button>
        )}

        {/* The edit and remove buttons are disabled for read_only partners */}
        <button
          disabled={isReceived || isReadOnly}
          onClick={() => onEdit(item)}
          title="Edit"
          className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          {/* SVG for Edit */}
        </button>
        <button
          disabled={isReceived || isReadOnly}
          onClick={() => onRemove(item)}
          title="Remove"
          className="text-gray-400 hover:text-white font-bold text-lg disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          &times;
        </button>
      </div>
    </li>
  );
}

export default IncomeListItem;