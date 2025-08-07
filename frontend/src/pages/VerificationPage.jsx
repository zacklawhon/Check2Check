import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function VerificationPage() {
    const navigate = useNavigate();
    // We only need two states: one for the initial message and one for a true error.
    const [statusMessage, setStatusMessage] = useState('Verifying your login, please wait...');
    const [error, setError] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');

            if (!token) {
                setStatusMessage('No login token found. Please request a new link.');
                setError(true);
                return;
            }

            try {
                const response = await fetch('/api/auth/verify-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                if (response.ok) {
                    // SUCCESS!
                    // Instead of setting local messages, we immediately navigate.
                    // Using window.location forces a full page refresh, which makes
                    // App.jsx re-check your login status and load the dashboard correctly.
                    window.location.assign('/dashboard');
                } else {
                    // If the API says the token is bad, set the error state.
                    const data = await response.json();
                    setStatusMessage(data.message || 'Failed to verify login link.');
                    setError(true);
                }
            } catch (err) {
                // For network errors etc.
                setStatusMessage('An unexpected error occurred. Please try again.');
                setError(true);
            }
        };

        // Add a small delay to allow the "Verifying..." message to be seen.
        const timer = setTimeout(verifyToken, 500);
        return () => clearTimeout(timer); // Cleanup timer on unmount

    }, []); // Empty dependency array ensures this runs only once

    return (
        <div className="flex items-center justify-center text-white min-h-screen">
            <div className="text-center p-4">
                {/* This h1 will now only show the current status or a final error message. */}
                <h1 className="text-2xl font-bold mb-4">{statusMessage}</h1>

                {/* This button only appears if there is a definite, final error. */}
                {error && (
                    <button 
                        onClick={() => navigate('/')} 
                        className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        Go to Homepage
                    </button>
                )}
            </div>
        </div>
    );
}

export default VerificationPage;