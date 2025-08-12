import React, {useState, useEffect, useRef } from 'react';

function IncomeStep({ onBack, onComplete, suggestions = [], existingIncome = [], onNewSourceAdded }) {
    const [sourceName, setSourceName] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState('weekly');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedIncome, setSelectedIncome] = useState([]);
    
    const [allIncomeSources, setAllIncomeSources] = useState([]);
    
    const inputRefs = useRef([]);

    // --- THIS IS THE FIX ---
    // We've split the original useEffect into two more specific ones.

    // This effect runs whenever the list of available suggestions changes.
    useEffect(() => {
        const initialSuggestions = suggestions.map(s => ({ ...s, amount: s.amount || '' }));
        setAllIncomeSources(initialSuggestions);
    }, [suggestions]);

    // This effect runs only ONCE when the component first loads to set the initial checked items.
    // It will no longer reset your selections when a new item is added.
    useEffect(() => {
        const preparedIncome = existingIncome.map(item => ({
            ...item,
            amount: item.amount || ''
        }));
        setSelectedIncome(preparedIncome);
    }, []); // The empty array [] ensures this runs only on the initial render.

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
        
        setAllIncomeSources(prev =>
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

            const newIncomeSource = { 
                id: data.id, 
                label: sourceName, 
                amount, 
                frequency 
            };
            
            if (onNewSourceAdded) {
                onNewSourceAdded(newIncomeSource);
            }
            
            // This line now works correctly because the useEffect is not resetting the state.
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

    const handleNext = async () => {
        let finalIncomeList = [...selectedIncome];

        if (sourceName && amount && parseFloat(amount) > 0) {
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
                if (!response.ok) throw new Error(data.message || 'Failed to add final income source.');

                const newIncomeSource = {
                    id: data.id,
                    label: sourceName,
                    amount,
                    frequency
                };
                
                finalIncomeList.push(newIncomeSource);

            } catch (err) {
                setError(err.message);
                setLoading(false);
                return;
            }
        }

        onComplete(finalIncomeList);
    };
    
    const handleKeyDown = (e, index) => {
        if (e.key === 'Tab' && !e.shiftKey) {
            const nextEnabledInputIndex = allIncomeSources.findIndex((source, i) => 
                i > index && selectedIncome.some(item => item.id === source.id)
            );

            if (nextEnabledInputIndex !== -1) {
                e.preventDefault();
                inputRefs.current[nextEnabledInputIndex]?.focus();
            }
        }
    };

    const isFormValid = sourceName && amount && parseFloat(amount) > 0;
    const isListValid = selectedIncome.length > 0 && !selectedIncome.some(item => !item.amount || parseFloat(item.amount) <= 0);
    const isNextDisabled = !isListValid && !isFormValid;
    
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Step 2: Confirm Your Income</h2>
            
            {allIncomeSources.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-semibold mb-2">Suggested Income Sources</h3>
                    <p className="text-sm text-gray-400 mb-2">Check the box for each income source you expect this period and confirm the amount.</p>
                    <div className="space-y-3 bg-gray-700 p-4 rounded-lg">
                        {allIncomeSources.map((source, index) => {
                            const isSelected = selectedIncome.some(item => item.id === source.id);
                            const selectedItem = selectedIncome.find(item => item.id === source.id) || source;

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
                                            ref={el => inputRefs.current[index] = el}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={selectedItem.amount}
                                            onChange={(e) => handleAmountChange(source.id, newAmount)}
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
            
            <p className="text-gray-400 mb-4">Add any new income.</p>
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
                <button onClick={handleNext} disabled={isNextDisabled || loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed ml-auto">
                    {loading ? 'Saving...' : 'Next: Expenses'}
                </button>
            </div>
        </div>
    );
}

export default IncomeStep;