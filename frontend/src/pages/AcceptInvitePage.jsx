import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // State to manage the UI: loading, error, or confirmation required
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  
  // The token is stored so the user can confirm the transformation
  const [token, setToken] = useState(searchParams.get('token'));

  // This function is called when an existing user confirms the account transformation
  const handleTransformAccount = async () => {
    setStatus('loading');
    setError('');
    try {
      const response = await fetch('/api/sharing/transform-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.messages?.error || 'Failed to transform account.');
      }

      // On success, the backend has logged the user in. Redirect to the dashboard.
      window.location.href = '/dashboard'; // Use a full page reload to refresh user context
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  // This effect runs once when the page loads
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No invitation token provided. Please use the link from your email.');
      return;
    }

    const acceptInvite = async () => {
      try {
        const response = await fetch('/api/sharing/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.messages?.error || 'Failed to accept invitation.');
        }

        // --- Handle the two possible success scenarios ---
        
        // Scenario 1: New user was created and logged in by the backend
        if (data.status === 'new_user_accepted') {
          // Redirect them to the dashboard immediately
          navigate('/dashboard');
        } 
        
        // Scenario 2: User already exists and needs to confirm
        else if (data.status === 'existing_user_confirmation_required') {
          setStatus('confirmation_required');
        }

      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    };

    acceptInvite();
  }, [token, navigate]); // Dependency array ensures this runs only once

  // --- Render UI based on the current status ---

  if (status === 'loading') {
    return (
      <div className="text-center p-8 text-white">
        <h1 className="text-2xl font-bold">Verifying your invitation...</h1>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center p-8 text-white bg-red-800/20 max-w-md mx-auto rounded-lg">
        <h1 className="text-2xl font-bold text-red-400">Error</h1>
        <p className="mt-2 text-gray-300">{error}</p>
      </div>
    );
  }

  if (status === 'confirmation_required') {
    return (
      <div className="text-center p-8 text-white bg-gray-800/50 max-w-lg mx-auto rounded-lg">
        <h1 className="text-2xl font-bold text-yellow-400 mb-4">Confirmation Required</h1>
        <p className="mb-2 text-gray-300">
          You already have a Check2Check account.
        </p>
        <p className="mb-6 text-gray-300">
          Accepting this invitation will <strong className="font-bold text-red-400">delete all of your current financial data</strong> (budgets, goals, accounts, etc.) and link your account to the owner's budget. This action cannot be undone.
        </p>
        <button
          onClick={handleTransformAccount}
          className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 font-bold"
        >
          Confirm and Transform Account
        </button>
      </div>
    );
  }

  return null; // Should not be reached
}

export default AcceptInvitePage;