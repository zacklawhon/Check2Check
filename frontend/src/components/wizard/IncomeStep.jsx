import React, { useState, useEffect, useRef } from 'react';
import * as api from '../../utils/api';

// --- NEW SUB-COMPONENT FOR IN-LINE EDITS ---
function IncomeRuleEditor({ source, onSaveSuccess }) {
    const [frequency, setFrequency] = useState(source.frequency);
    const [frequencyDay, setFrequencyDay] = useState('5');
    const [frequencyDate1, setFrequencyDate1] = useState('15');
    const [frequencyDate2, setFrequencyDate2] = useState('30');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        setError('');
        try {
            const payload = {
                ...source,
                frequency,
                frequency_day: frequencyDay,
                frequency_date_1: frequencyDate1,
                frequency_date_2: frequencyDate2,
            };
            await api.updateIncomeSource(source.id, payload);
            onSaveSuccess(payload);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="col-span-12 bg-gray-800 p-3 mt-2 rounded-lg space-y-3">
            <p className="text-sm text-yellow-300">Please provide more details for this income source to enable projections.</p>
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Frequency</label>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600">
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Every 2 Weeks</option>
                    <option value="semi-monthly">Twice a Month</option>
                    <option value="monthly">Monthly</option>
                    <option value="one-time">One-Time</option>
                </select>
            </div>
            {/* Conditional inputs based on selected frequency */}
            {(frequency === 'weekly' || frequency === 'bi-weekly') && (
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Day of the Week</label>
                    <select value={frequencyDay} onChange={(e) => setFrequencyDay(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600">
                        <option value="1">Sunday</option>
                        <option value="2">Monday</option>
                        <option value="3">Tuesday</option>
                        <option value="4">Wednesday</option>
                        <option value="5">Thursday</option>
                        <option value="6">Friday</option>
                        <option value="7">Saturday</option>
                    </select>
                </div>
            )}
            {frequency === 'semi-monthly' && (
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">First Pay Day</label>
                        <input type="number" value={frequencyDate1} onChange={(e) => setFrequencyDate1(e.target.value)} min="1" max="31" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Second Pay Day</label>
                        <input type="number" value={frequencyDate2} onChange={(e) => setFrequencyDate2(e.target.value)} min="1" max="31" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600" />
                    </div>
                </div>
            )}
            {frequency === 'monthly' && (
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Day of the Month</label>
                    <input type="number" value={frequencyDate1} onChange={(e) => setFrequencyDate1(e.target.value)} min="1" max="31" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600" />
                </div>
            )}
            <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                {loading ? 'Saving...' : 'Save Rule'}
            </button>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

function IncomeStep({ onBack, onComplete, suggestions = [], existingIncome = [], onNewSourceAdded }) {
    const [formState, setFormState] = useState({
        sourceName: '', amount: '', frequency: 'weekly',
        frequencyDay: '5', frequencyDate1: '15', frequencyDate2: '30',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedIncome, setSelectedIncome] = useState([]);
    const [allIncomeSources, setAllIncomeSources] = useState([]);
    const amountInputsRef = useRef({});

    useEffect(() => {
        setAllIncomeSources(suggestions.map(s => ({ ...s, amount: s.amount || '' })));
    }, [suggestions]);

    useEffect(() => {
        setSelectedIncome(existingIncome.map(item => ({ ...item, amount: item.amount || '' })));
    }, [existingIncome]);

    const handleSelectionChange = (source, isChecked) => {
        if (isChecked) {
            setSelectedIncome(prev => [...prev, source]);
        } else {
            setSelectedIncome(prev => prev.filter(item => item.id !== source.id));
        }
    };

    const handleAmountChange = (sourceId, newAmount) => {
        setSelectedIncome(prev => prev.map(item => item.id === sourceId ? { ...item, amount: newAmount } : item));
        setAllIncomeSources(prev => prev.map(item => item.id === sourceId ? { ...item, amount: newAmount } : item));
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    // This function is passed to the editor to update the main list
    const handleRuleUpdate = (updatedSource) => {
        setAllIncomeSources(prev => prev.map(s => s.id === updatedSource.id ? { ...s, ...updatedSource } : s));
        setSelectedIncome(prev => prev.map(s => s.id === updatedSource.id ? { ...s, ...updatedSource } : s));
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.sourceName || !formState.amount || parseFloat(formState.amount) <= 0) {
        setError('Please provide a valid name and amount.');
        return;
    }
    setLoading(true);
    setError('');

    try {
        const payload = {
            label: formState.sourceName,
            frequency: formState.frequency,
            frequency_day: formState.frequencyDay,
            frequency_date_1: formState.frequencyDate1,
            frequency_date_2: formState.frequencyDate2,
        };

        const data = await api.createIncomeSource(payload);

        const newIncomeSource = {
            id: data.id,
            label: formState.sourceName,
            amount: formState.amount,
            frequency: formState.frequency,
            // Also add the new date properties to the frontend state
            frequency_day: payload.frequency_day,
            frequency_date_1: payload.frequency_date_1,
            frequency_date_2: payload.frequency_date_2,
        };

        if (onNewSourceAdded) { onNewSourceAdded(newIncomeSource); }
        setSelectedIncome(prev => [...prev, newIncomeSource]);

        setFormState({
            sourceName: '', amount: '', frequency: 'weekly',
            frequencyDay: '5', frequencyDate1: '15', frequencyDate2: '30'
        });

    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
};

    const handleNext = async () => {
        // --- FIX: EXPANDED CHECK FOR ANY LEGACY RULE ---
        const hasLegacy = selectedIncome.some(s =>
            ((s.frequency === 'weekly' || s.frequency === 'bi-weekly') && !s.frequency_day) ||
            ((s.frequency === 'monthly' || s.frequency === 'semi-monthly') && !s.frequency_date_1)
        );

        if (hasLegacy) {
            setError('Please update the frequency details for all selected income sources before continuing.');
            return;
        }
        setError(''); // Clear error on success
        onComplete(selectedIncome);
    };

    // --- 3. NEW RENDER FUNCTION FOR CONDITIONAL INPUTS ---
    const renderFrequencyDetails = () => {
        switch (formState.frequency) {
            case 'weekly':
            case 'bi-weekly':
                return (
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Day of the Week</label>
                        <select name="frequencyDay" value={formState.frequencyDay} onChange={handleFormChange} className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700">
                            <option value="1">Sunday</option>
                            <option value="2">Monday</option>
                            <option value="3">Tuesday</option>
                            <option value="4">Wednesday</option>
                            <option value="5">Thursday</option>
                            <option value="6">Friday</option>
                            <option value="7">Saturday</option>
                        </select>
                    </div>
                );
            case 'semi-monthly':
                return (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">First Pay Day</label>
                            <input type="number" name="frequencyDate1" value={formState.frequencyDate1} onChange={handleFormChange} min="1" max="31" className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Second Pay Day</label>
                            <input type="number" name="frequencyDate2" value={formState.frequencyDate2} onChange={handleFormChange} min="1" max="31" className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700" />
                        </div>
                    </div>
                );
            case 'monthly':
                return (
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Day of the Month</label>
                        <input type="number" name="frequencyDate1" value={formState.frequencyDate1} onChange={handleFormChange} min="1" max="31" className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700" />
                    </div>
                );
            default:
                return null; // For 'one-time'
        }
    };

    const isNextDisabled = !selectedIncome.some(item => item.amount && parseFloat(item.amount) > 0);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Step 2: Add Your Income Sources</h2>

            {allIncomeSources.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-semibold mb-2">Suggested Income Sources</h3>
                    <p className="text-sm text-gray-400 mb-2">Check the box for each income source you expect this period and confirm the amount.</p>
                    <div className="space-y-3 bg-gray-700 p-4 rounded-lg">
                        {allIncomeSources.map((source, index) => {
                            const isSelected = selectedIncome.some(item => item.id === source.id);
                            const selectedItem = selectedIncome.find(item => item.id === source.id) || source;

                            // --- FIX: EXPANDED CHECK FOR ANY LEGACY RULE ---
                            const isLegacy = (
                                (source.frequency === 'weekly' || source.frequency === 'bi-weekly') && !source.frequency_day
                            ) || (
                                    (source.frequency === 'monthly' || source.frequency === 'semi-monthly') && !source.frequency_date_1
                                );

                            return (
                                <div key={source.id} className="grid grid-cols-12 gap-2 items-center">
                                    <label className="col-span-1 flex items-center">
                                        <input type="checkbox" checked={isSelected} onChange={(e) => handleSelectionChange(source, e.target.checked)} className="h-5 w-5 rounded bg-gray-800 border-gray-600 text-indigo-500" />
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
                                            value={selectedItem.amount} 
                                            onChange={(e) => handleAmountChange(source.id, e.target.value)} 
                                            disabled={!isSelected} 
                                            ref={(el) => {
                                                if (el) {
                                                    amountInputsRef.current[source.id] = el;
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Tab') {
                                                    e.preventDefault();
                                                    const selectedIds = selectedIncome.map(item => item.id);
                                                    const currentIndex = selectedIds.indexOf(source.id);
                                                    let nextIndex;
                                                    if (e.shiftKey) {
                                                        nextIndex = (currentIndex - 1 + selectedIds.length) % selectedIds.length;
                                                    } else {
                                                        nextIndex = (currentIndex + 1) % selectedIds.length;
                                                    }
                                                    const nextId = selectedIds[nextIndex];
                                                    const nextInput = amountInputsRef.current[nextId];
                                                    if (nextInput) nextInput.focus();
                                                }
                                            }}
                                            className="w-full bg-gray-800 text-white rounded-md p-1 border border-gray-600 disabled:bg-gray-700" 
                                        />
                                    </div>

                                    {/* --- RENDER THE EDITOR IF NEEDED --- */}
                                    {isSelected && isLegacy && <IncomeRuleEditor source={source} onSaveSuccess={handleRuleUpdate} />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <p className="text-gray-400 mb-4">Add a new income source with its amount and frequency.</p>
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-600 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" name="sourceName" value={formState.sourceName} onChange={handleFormChange} placeholder="Source Name (e.g., Paycheck)" className="md:col-span-2 bg-gray-800 text-white rounded-lg p-2 border border-gray-700" />
                    <input type="number" step="0.01" name="amount" value={formState.amount} onChange={handleFormChange} placeholder="Amount (per instance)" className="bg-gray-800 text-white rounded-lg p-2 border border-gray-700" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Frequency</label>
                    <select name="frequency" value={formState.frequency} onChange={handleFormChange} className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700">
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Every 2 Weeks</option>
                        <option value="semi-monthly">Twice a Month</option>
                        <option value="monthly">Monthly</option>
                        <option value="one-time">One-Time</option>
                    </select>
                </div>

                {renderFrequencyDetails()}

                <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                    {loading ? 'Adding...' : 'Add Income Source'}
                </button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </form>

            <div className="flex justify-between mt-8">
                {onBack && <button onClick={onBack} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">Back</button>}
                <button onClick={handleNext} disabled={isNextDisabled || loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500 ml-auto">
                    {loading ? 'Saving...' : 'Next: Review Projection'}
                </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        </div>
    );
}

export default IncomeStep;
