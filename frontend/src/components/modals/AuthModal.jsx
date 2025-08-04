// =================================================================
// FILE: /frontend/src/components/AuthModal.jsx
// =================================================================
import React, { useState } from 'react';

function AuthModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred.');
      }

      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white">&times;</button>
        <h2 className="text-2xl font-bold text-center mb-4 text-white">Login or Sign Up</h2>
        <p className="text-center text-gray-400 mb-6">We'll send a magic link to your email. No password needed.</p>
        
        {message ? (
            <div className="text-green-400 text-center">{message}</div>
        ) : (
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="w-full bg-gray-700 text-white rounded-lg p-3 mb-4 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-500"
                >
                    {loading ? 'Sending...' : 'Send Login Link'}
                </button>
                {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
            </form>
        )}
      </div>
    </div>
  );
}

export default AuthModal;