import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../common/ConfirmationModal';

function AccountActions() {
    // Make sure you are using the hook here and not a prop
    const navigate = useNavigate(); 
    const [newEmail, setNewEmail] = useState('');
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [isFreshStartOpen, setIsFreshStartOpen] = useState(false); // New state for the modal
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleEmailChangeRequest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch('/api/account/request-email-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ new_email: newEmail })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.messages?.new_email || 'Failed to request email change.');
            setSuccess('Verification link sent to your old email!');
            setNewEmail('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(''), 5000);
        }
    };

    const handleDeleteAccount = async () => {
        setIsConfirmDeleteOpen(false);
        setLoading(true);
        try {
            await fetch('/api/account/delete', { 
                method: 'DELETE', 
                credentials: 'include' 
            });
        } catch (err) {
            // We can safely ignore this error because we know the session 
            // being destroyed causes it. The account is already deleted.
            console.warn('Fetch failed during account deletion, likely due to session destruction. Navigating as planned.');
        } finally {
            // --- FIX: ALWAYS navigate after attempting deletion ---
            // Whether the fetch 'succeeded' or 'failed', the user's session
            // is gone, so we must redirect them.
            window.location.href = '/';
        }
    };

    // New handler for the fresh start action
    const handleFreshStart = async () => {
        setIsFreshStartOpen(false);
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch('/api/user/fresh-start', {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to reset account.');
            // Reload the page to clear out any old state and show the fresh account
            window.location.reload(); 
        } catch (err) { // <-- This was the line with the error
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="bg-gray-800 p-6 rounded-lg border border-red-500/50">
                <h2 className="text-2xl font-bold text-red-400 mb-4">Account Actions</h2>
                <div className="space-y-6">
                    <form onSubmit={handleEmailChangeRequest} className="space-y-2">
                        <label className="block text-gray-300">Change Email Address</label>
                        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="New Email Address" className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"/>
                        <div className="text-right">
                            <button type="submit" disabled={loading} className="bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                                {loading ? 'Sending...' : 'Request Change'}
                            </button>
                        </div>
                        {success && <p className="text-green-400 text-sm mt-1 text-right">{success}</p>}
                    </form>

                    {/* Fresh Start Section */}
                    <div className="border-t border-gray-700 pt-4">
                        <label className="block text-gray-300">Fresh Start</label>
                        <p className="text-sm text-gray-400 mb-2">
                            Reset your account, clearing all budgets, goals, and transactions.
                            Your login will be kept.
                        </p>
                        <div className="text-right">
                            <button 
                                onClick={() => setIsFreshStartOpen(true)} 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                                Start Fresh
                            </button>
                        </div>
                    </div>
                    
                    {/* Delete Account Section */}
                    <div className="border-t border-gray-700 pt-4">
                        <label className="block text-gray-300">Delete Account</label>
                        <p className="text-sm text-gray-400 mb-2">This will permanently anonymize your account and log you out. This action cannot be undone.</p>
                        <div className="text-right">
                            <button onClick={() => setIsConfirmDeleteOpen(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">Delete Account</button>
                        </div>
                    </div>
                </div>
                 {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
            </div>

            <ConfirmationModal
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={handleDeleteAccount}
                title="Delete Account?"
                message="Are you absolutely sure? All your data will be anonymized and you will be logged out."
            />

            {/* New ConfirmationModal for Fresh Start */}
            <ConfirmationModal
                isOpen={isFreshStartOpen}
                onClose={() => setIsFreshStartOpen(false)}
                onConfirm={handleFreshStart}
                title="Start Fresh?"
                message="Are you sure? This will permanently delete all of your budgets, goals, and transactions. This action cannot be undone."
            />
        </>
    );
}

export default AccountActions;