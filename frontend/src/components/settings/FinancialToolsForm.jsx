import React, { useState, useEffect } from 'react';
import * as api from '../../utils/api';

function FinancialToolsForm({ financialTools, onUpdate }) {
    const [tools, setTools] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (financialTools) {
            setTools({
                has_checking_account: financialTools.has_checking_account === '1',
                has_savings_account: financialTools.has_savings_account === '1',
                has_credit_card: financialTools.has_credit_card === '1',
                savings_goal: financialTools.savings_goal || '2000.00'
            });
        }
    }, [financialTools]);

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setTools(prev => ({ ...prev, [name]: checked }));
    };

    const handleGoalChange = (e) => {
        setTools(prev => ({...prev, savings_goal: e.target.value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess('');
        try {
            await api.updateFinancialTools(tools);
            setSuccess('Settings saved!');
            onUpdate();
        } catch (err) {
            // The API client already shows an error toast
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Financial Tools & Goals</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-300 mb-2">What financial tools do you use?</label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2"><input type="checkbox" name="has_checking_account" checked={tools.has_checking_account || false} onChange={handleCheckboxChange} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600"/><span className="text-gray-300">Checking Account</span></label>
                        <label className="flex items-center gap-2"><input type="checkbox" name="has_savings_account" checked={tools.has_savings_account || false} onChange={handleCheckboxChange} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600"/><span className="text-gray-300">Savings Account</span></label>
                        <label className="flex items-center gap-2"><input type="checkbox" name="has_credit_card" checked={tools.has_credit_card || false} onChange={handleCheckboxChange} className="form-checkbox h-4 w-4 rounded bg-gray-700 border-gray-600"/><span className="text-gray-300">Credit Card</span></label>
                    </div>
                </div>
                <div>
                    <label className="block text-gray-300 mb-2">What is your primary savings goal?</label>
                    <input type="number" step="0.01" value={tools.savings_goal || ''} onChange={handleGoalChange} className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"/>
                </div>
                <div className="text-right mt-4">
                     <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500">
                        {loading ? 'Saving...' : 'Save Tools'}
                    </button>
                </div>
                {success && <p className="text-green-400 text-sm mt-2 text-right">{success}</p>}
            </form>
        </div>
    );
}

export default FinancialToolsForm;