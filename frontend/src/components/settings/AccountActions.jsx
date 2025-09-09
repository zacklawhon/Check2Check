import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import * as api from '../../utils/api';
import ConfirmationModal from '../common/ConfirmationModal';

function AccountActions() {
    // Make sure you are using the hook here and not a prop
    const navigate = useNavigate(); 
    const { user } = useOutletContext();
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
            const data = await api.requestEmailChange(newEmail);
            setSuccess(data.message || 'Verification link sent!');
            setNewEmail('');
        } catch (err) {
            setError(err.message); // The API client already shows a toast
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(''), 5000);
        }
    };

    const handleDeleteAccount = async () => {
        setIsConfirmDeleteOpen(false);
        setLoading(true);
        try {
            await api.deleteAccount();
        } catch (err) {
            // This error is expected because the session is destroyed.
            console.warn('Fetch failed during account deletion, as expected.');
        } finally {
            // Always redirect after the attempt.
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
            await api.freshStart();
            window.location.reload(); 
        } catch (err) {
            setError(err.message); // The API client already shows a toast
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
                        <label className="block text-gray-300">
                            Change Email Address
                            {user?.email && (
                                <span className="ml-2 text-gray-400 text-xs">(Current: {user.email})</span>
                            )}
                        </label>
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