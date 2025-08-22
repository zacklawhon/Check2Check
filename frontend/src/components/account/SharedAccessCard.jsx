import React, { useState } from 'react';
import * as api from '../../utils/api';

function SharedAccessCard({ invites, onUpdate }) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('read_only');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendInvite = async () => {
    setError('');
    setSuccess('');
    try {
      await api.sendShareInvite(email, permission);
      setSuccess('Invitation sent successfully!');
      setEmail('');
      onUpdate();
    } catch (err) {
      setError(err.message); // The API client already shows a toast
    }
  };

  const handleRevoke = async (inviteId) => {
    if (window.confirm('Are you sure you want to revoke this access? This cannot be undone.')) {
      try {
        await api.revokeAccess(inviteId);
        onUpdate();
      } catch (err) {
        setError(err.message); // The API client already shows a toast
      }
    }
  };

   const handleUpdatePermission = async (partnerId, newPermission) => {
    try {
        await api.updatePartnerPermission(partnerId, newPermission);
        onUpdate();
    } catch (err) {
        setError(err.message); // The API client already shows a toast
    }
  };

  const partners = invites.filter(inv => inv.status === 'accepted');
  const pendingInvites = invites.filter(inv => inv.status === 'pending');

  return (
    <div className="bg-gray-800 p-6 rounded-lg text-white">
      <h2 className="text-2xl font-bold text-teal-400 mb-4">Shared Access</h2>

      {/* Invitation Form */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Invite a Partner</h3>
        <p className="text-sm text-gray-400 mb-4">
          Invite someone to access your budget. You can set their permissions below.
        </p>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="partner@example.com" 
            className="flex-grow w-full p-2 border border-gray-600 rounded-md bg-gray-700 focus:ring-2 focus:ring-teal-500"
          />
          <select 
            value={permission}
            onChange={(e) => setPermission(e.target.value)}
            className="w-full sm:w-auto p-2 border border-gray-600 rounded-md bg-gray-700"
          >
            <option value="read_only">Read Only</option>
            <option value="update_by_request">Update by Request</option>
            <option value="full_access">Full Access</option>
          </select>
          <button 
            onClick={handleSendInvite}
            className="w-full sm:w-auto bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700"
          >
            Send Invite
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-400 text-sm mt-2">{success}</p>}
      </div>

      {/* Current Partners & Invites List */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Manage Partners</h3>
        <div className="space-y-4">
          {invites.length === 0 && <p className="text-gray-400">You haven't invited any partners yet.</p>}
          
          {partners.map(invite => (
            <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
              <div>
                <p className="font-medium">{invite.recipient_email}</p>
                <p className="text-sm text-green-400">Status: Active</p>
              </div>
              <div className="flex items-center space-x-2">
                <select 
                    defaultValue={invite.permission_level}
                    onChange={(e) => handleUpdatePermission(invite.claimed_by_user_id, e.target.value)}
                    className="p-2 border border-gray-600 rounded-md text-sm bg-gray-900"
                >
                    <option value="read_only">Read Only</option>
                    <option value="update_by_request">Update by Request</option>
                    <option value="full_access">Full Access</option>
                </select>
                <button onClick={() => handleRevoke(invite.claimed_by_user_id)} className="text-red-400 hover:text-red-300">
                    Revoke
                </button>
              </div>
            </div>
          ))}

          {pendingInvites.map(invite => (
            <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
              <div>
                <p className="font-medium">{invite.recipient_email}</p>
                <p className="text-sm text-yellow-400">Status: Pending</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => handleRevoke(invite.id)} className="text-red-400 hover:text-red-300">
                  Cancel Invite
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SharedAccessCard;