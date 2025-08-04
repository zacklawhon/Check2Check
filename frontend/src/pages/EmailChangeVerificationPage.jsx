import React, { useState, useEffect } from 'react';
// FIX: Import useNavigate for programmatic redirection
import { useNavigate } from 'react-router-dom'; 

function EmailChangeVerificationPage() {
    // FIX: Use the useNavigate hook
    const navigate = useNavigate(); 
    const [message, setMessage] = useState('Verifying your email change...');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            const pathParts = window.location.pathname.split('/');
            const token = pathParts[pathParts.length - 1];

            if (!token) {
                setMessage('Verification token not found. Please try again.');
                return;
            }

            try {
                // The GET method is fine as long as your route allows it.
                const response = await fetch(`/api/account/verify-email-change/${token}`, {
                    method: 'GET', // Or 'POST' if you changed the backend route
                    credentials: 'include'
                });
                
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.messages?.error || 'Verification failed.');
                }
                
                // Set success state and message
                setMessage(data.message || 'Your email has been updated successfully!');
                setIsSuccess(true);

                // --- RECOMMENDED CHANGE ---
                // Redirect to login after a delay so the user can read the message.
                setTimeout(() => {
                    // Pass the success message to the login page to be displayed.
                    navigate('/login', { state: { successMessage: data.message } });
                }, 3000);

            } catch (err) {
                setMessage(err.message);
            }
        };

        verifyToken();
        // FIX: Add navigate to the dependency array
    }, [navigate]); 

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center max-w-md">
                <h1 className={`text-2xl font-bold mb-4 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                    {isSuccess ? 'Success!' : 'Verification Status'}
                </h1>
                <p className="text-gray-300">
                    {message}
                    {/* Add a message about the upcoming redirect */}
                    {isSuccess && ' You will be redirected to the login page shortly.'}
                </p>
            </div>
        </div>
    );
}

export default EmailChangeVerificationPage;