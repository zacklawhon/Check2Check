import React, { useState } from 'react';

function FinancialTipModal({ onClose }) {
    const [zipCode, setZipCode] = useState('');
    const [financialTools, setFinancialTools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleToolChange = (tool) => {
        setFinancialTools(prev => 
            prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/user/update-financial-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ zip_code: zipCode, financial_tools: financialTools })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to save information.');
            }
            
            setMessage('Thank you! Your information has been saved.');
            setTimeout(onClose, 2000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const accountTypes = [
        { id: 'checking_account', label: 'Checking Account' },
        { id: 'savings_account', label: 'Savings Account' },
        { id: 'credit_card', label: 'Credit Card' },
        { id: 'line_of_credit', label: 'Line of Credit' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white">&times;</button>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Financial Tip!</h2>
                    <p className="text-gray-400 mb-6">
                        Having a savings account with at least $2,000 is one of the most important steps to financial stability. It acts as a safety net for unexpected emergencies.
                    </p>
                </div>

                {message ? (
                    <p className="text-center text-green-400">{message}</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Which of these financial tools do you currently use?</label>
                            <div className="grid grid-cols-2 gap-2">
                                {accountTypes.map(tool => (
                                    <label key={tool.id} className="flex items-center space-x-2 bg-gray-700 p-3 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={financialTools.includes(tool.id)}
                                            onChange={() => handleToolChange(tool.id)}
                                            className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-white">{tool.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-300 mb-1">What is your Zip Code? (Optional)</label>
                            <input
                                type="text"
                                id="zipCode"
                                value={zipCode}
                                onChange={(e) => setZipCode(e.target.value)}
                                placeholder="e.g., 90210"
                                className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                        
                        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg disabled:bg-gray-500">
                            {loading ? 'Saving...' : 'Save & Close'}
                        </button>
                        {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
                    </form>
                )}
            </div>
        </div>
    );
}

export default FinancialTipModal;
