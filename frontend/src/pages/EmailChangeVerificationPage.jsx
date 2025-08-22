import React, { useState, useEffect } from 'react';
import * as api from '../utils/api';
import { useNavigate } from 'react-router-dom'; 

function EmailChangeVerificationPage() {
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
                // 2. Use the new, clean API function
                const data = await api.verifyEmailChange(token);
                
                setMessage(data.message || 'Your email has been updated successfully!');
                setIsSuccess(true);

                setTimeout(() => {
                    navigate('/login', { state: { successMessage: data.message } });
                }, 3000);

            } catch (err) {
                setMessage(err.message); // The API client already shows a toast
            }
        };

        verifyToken();
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