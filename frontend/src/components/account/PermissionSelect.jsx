import React, { useState } from 'react';

function PermissionSelect({ partner, onUpdatePermission, onPermissionUpdated }) {
  const [selected, setSelected] = useState(partner.permission_level);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await onUpdatePermission(partner.id, selected);
      onPermissionUpdated(partner.id, selected); // Update local state
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        className="p-2 border border-gray-600 rounded-md text-sm bg-gray-900"
      >
        <option value="read_only">Read Only</option>
        <option value="update_by_request">Update by Request</option>
        <option value="full_access">Full Access</option>
      </select>
      <button
        onClick={handleSave}
        disabled={saving || selected === partner.permission_level}
        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
      {error && <span className="text-red-400 text-xs ml-2">{error}</span>}
    </div>
  );
}

export default PermissionSelect;
