import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import * as api from '../utils/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [inviteToken, setInviteToken] = useState(null);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        const token = searchParams.get('invite_token');
        if (token) {
            setInviteToken(token);
        } else {
            // If no token is present, redirect to the homepage.
            toast.error('An invitation is required to register.');
            navigate('/');
        }
    }, [searchParams, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.requestLoginLink(email, inviteToken);
            setIsSubmitted(true);
        } catch (err) {
            // The API client already shows the error toast
        } finally {
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center p-8 text-white max-w-md">
                    <h1 className="text-3xl font-bold text-green-400 mb-4">Success!</h1>
                    <p className="text-gray-300">Please check your email at <strong>{email}</strong> for a link to complete your login.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
                <h1 className="text-2xl font-bold text-white text-center mb-2">Welcome to Check2Check!</h1>
                <p className="text-center text-gray-400 mb-6">You've been invited. Enter your email to create your account and get started.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-indigo-500"
                            placeholder="you@example.com"
                            required
                            autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !inviteToken}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg disabled:bg-gray-500"
                    >
                        {loading ? 'Sending Link...' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}