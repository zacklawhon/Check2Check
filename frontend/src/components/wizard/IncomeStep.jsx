import React, { useState, useEffect } from 'react';

function IncomeStep({ onBack, onComplete, suggestions = [], existingIncome = [] }) {
    const [sourceName, setSourceName] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState('weekly');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedIncome, setSelectedIncome] = useState([]);

    useEffect(() => {
        const preparedIncome = existingIncome.map(item => ({
            ...item,
            amount: item.amount || ''
        }));
        setSelectedIncome(preparedIncome);
    }, [existingIncome]);

    const handleSelectionChange = (source, isChecked) => {
        if (isChecked) {
            setSelectedIncome(prev => [...prev, source]);
        } else {
            setSelectedIncome(prev => prev.filter(item => item.id !== source.id));
        }
    };

    const handleAmountChange = (sourceId, newAmount) => {
        setSelectedIncome(prev => 
            prev.map(item => 
                item.id === sourceId ? { ...item, amount: newAmount } : item
            )
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!sourceName || !amount || parseFloat(amount) <= 0) {
            setError('Please provide a valid name and amount.');
            return;
        }
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch('/api/onboarding/add-income', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ label: sourceName, frequency })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to add income source.');
            
            const newIncomeSource = { id: data.id, label: sourceName, amount, frequency };
            setSelectedIncome(prev => [...prev, newIncomeSource]);
            
            setSourceName('');
            setAmount('');
            setFrequency('weekly');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        onComplete(selectedIncome);
    };

    const isNextDisabled = selectedIncome.length === 0 || selectedIncome.some(item => !item.amount || parseFloat(item.amount) <= 0);
    
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Step 2: Confirm Your Income</h2>
            
            {suggestions.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-semibold mb-2">Suggested Income Sources</h3>
                    <p className="text-sm text-gray-400 mb-2">Check the box for each income source you expect this period and confirm the amount.</p>
                    <div className="space-y-3 bg-gray-700 p-4 rounded-lg">
                        {suggestions.map(source => {
                            const isSelected = selectedIncome.some(item => item.id === source.id);
                            const selectedItem = selectedIncome.find(item => item.id === source.id);

                            return (
                                <div key={source.id} className="grid grid-cols-12 gap-2 items-center">
                                    <label className="col-span-1 flex items-center">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded bg-gray-800 border-gray-600 text-indigo-500 focus:ring-indigo-600"
                                            checked={isSelected}
                                            onChange={(e) => handleSelectionChange(source, e.target.checked)}
                                        />
                                    </label>
                                    <div className="col-span-7">
                                        <p className="font-semibold">{source.label}</p>
                                        <p className="text-xs text-gray-400 capitalize">{source.frequency}</p>
                                    </div>
                                    <div className="col-span-4 flex items-center">
                                        <span className="mr-1 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={isSelected ? selectedItem.amount : ''}
                                            onChange={(e) => handleAmountChange(source.id, e.target.value)}
                                            disabled={!isSelected}
                                            className="w-full bg-gray-800 text-white rounded-md p-1 border border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-700 disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            <p className="text-gray-400 mb-4">Add any new or one-time income for this budget period.</p>
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="e.g., Side Job" className="col-span-1 md:col-span-2 bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                    <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 250.00" className="bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="col-span-1 md:col-span-2 bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Every 2 Weeks</option>
                        <option value="semi-monthly">Twice a Month</option>
                        <option value="monthly">Monthly</option>
                        <option value="one-time">One-Time</option>
                    </select>
                    <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                        {loading ? 'Adding...' : 'Add Income'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </form>
            
            <div className="flex justify-between mt-8">
                {onBack && <button onClick={onBack} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">Back</button>}
                <button onClick={handleNext} disabled={isNextDisabled} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed ml-auto">
                    Next: Expenses
                </button>
            </div>
        </div>
    );
}

export default IncomeStep;