import React, { useState, useEffect } from 'react';
// FIX: Import hook
import { useNavigate } from 'react-router-dom';

// FIX: Remove prop
function VerificationPage() {
    // FIX: Initialize hook
    const navigate = useNavigate();
    const [message, setMessage] = useState('Verifying your login...');
    const [error, setError] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');

            if (!token) {
                setError('No token found. Please request a new login link.');
                return;
            }

            try {
                const response = await fetch('/api/auth/verify-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();

                if (response.ok) {
                    setMessage('Login successful! Redirecting to dashboard...');
                    setTimeout(() => navigate('/dashboard'), 2000);
                } else {
                    setError(data.message || 'Failed to verify token.');
                }
            } catch (err) {
                setError('An unexpected error occurred. Please try again.');
            }
        };

        verifyToken();
    // FIX: Remove navigate from dependency array
    }, []);

    return (
        <div className="flex items-center justify-center text-white min-h-screen">
            <div className="text-center">
                <h1 className="text-2xl font-bold">{error || message}</h1>
                {error && (
                    <button onClick={() => navigate('/')} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
                        Go to Homepage
                    </button>
                )}
            </div>
        </div>
    );
}

export default VerificationPage;