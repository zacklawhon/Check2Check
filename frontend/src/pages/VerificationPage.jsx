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
                // 2. Use the new, clean API function
                await api.verifyLoginLink(token);
                
                // On success, force a full page refresh to the dashboard
                window.location.assign('/dashboard');

            } catch (err) {
                // The API client already shows a toast, but we can set a message here too.
                setStatusMessage(err.message || 'Failed to verify login link.');
                setError(true);
            }
        };

        const timer = setTimeout(verifyToken, 500);
        return () => clearTimeout(timer);

    }, []);

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