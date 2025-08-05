import React, { useState, useEffect, useMemo } from 'react';

function ExpenseStep({ onBack, onComplete, suggestions = [], existingExpenses = [], confirmedDates = {} }) {
    const [formState, setFormState] = useState({
        label: '', amount: '', dueDate: '', category: 'other', principal_balance: '',
        interest_rate: '', maturity_date: '', outstanding_balance: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [allExpenses, setAllExpenses] = useState([]);
    const [selectedExpenses, setSelectedExpenses] = useState([]);

    useEffect(() => {
        const initialSuggestions = suggestions.map(s => ({ ...s, estimated_amount: s.estimated_amount || '' }));
        setAllExpenses(initialSuggestions);
        setSelectedExpenses(existingExpenses.map(e => ({ ...e, estimated_amount: e.estimated_amount || '' })));
    }, [suggestions, existingExpenses]);

    const filteredSuggestions = useMemo(() => {
        if (!confirmedDates.startDate || !confirmedDates.endDate) { return allExpenses; }
        const start = new Date(`${confirmedDates.startDate}T00:00:00`);
        const end = new Date(`${confirmedDates.endDate}T00:00:00`);
        return allExpenses.filter(exp => {
            if (!exp.due_date) return false;
            const dueDateDay = parseInt(exp.due_date, 10);
            let current = new Date(start);
            while (current <= end) {
                if (current.getDate() === dueDateDay) return true;
                current.setDate(current.getDate() + 1);
            }
            return false;
        });
    }, [allExpenses, confirmedDates]);

    const handleSelectionChange = (expense, isChecked) => {
        if (isChecked) {
            setSelectedExpenses(prev => [...prev, expense]);
        } else {
            setSelectedExpenses(prev => prev.filter(item => item.id !== expense.id));
        }
    };
    
    const handleAmountChange = (expenseId, newAmount) => {
        const updatedSelected = selectedExpenses.map(item => 
            item.id === expenseId ? { ...item, estimated_amount: newAmount } : item
        );
        setSelectedExpenses(updatedSelected);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formState.label || !formState.amount || parseFloat(formState.amount) <= 0) {
            setError('Please provide a valid name and amount.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const recurringData = { ...formState };
            delete recurringData.amount;
            const response = await fetch('/api/onboarding/add-expense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(recurringData) 
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to add expense.');
            
            const newExpense = { ...recurringData, id: data.id, estimated_amount: formState.amount };
            
            setAllExpenses(prev => [...prev, newExpense]);
            setSelectedExpenses(prev => [...prev, newExpense]);

            setFormState({
                label: '', amount: '', dueDate: '', category: 'other', principal_balance: '',
                interest_rate: '', maturity_date: '', outstanding_balance: ''
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => { onComplete(selectedExpenses); };
    
    const isNextDisabled = selectedExpenses.length > 0 && selectedExpenses.some(item => !item.estimated_amount || parseFloat(item.estimated_amount) <= 0);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Step 3: Confirm Recurring Expenses</h2>

            {filteredSuggestions.length > 0 && (
                 <div className="mb-6">
                    <h3 className="font-semibold mb-2">Suggested Recurring Expenses</h3>
                    <p className="text-sm text-gray-400 mb-2">Check the box for each bill you expect this period and enter the amount you plan to pay.</p>
                    <div className="space-y-3 bg-gray-700 p-4 rounded-lg">
                        {filteredSuggestions.map(exp => {
                             const isSelected = selectedExpenses.some(item => item.id === exp.id);
                             const selectedItem = selectedExpenses.find(item => item.id === exp.id) || exp;
                            return (
                                <div key={exp.id} className="grid grid-cols-12 gap-2 items-center">
                                    <label className="col-span-1 flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => handleSelectionChange(exp, e.target.checked)}
                                            className="h-5 w-5 rounded bg-gray-800 border-gray-600 text-indigo-500 focus:ring-indigo-600"/>
                                    </label>
                                    <div className="col-span-7">
                                        <p className="font-semibold">{exp.label}</p>
                                        <p className="text-xs text-gray-400 capitalize">{exp.category} (Due: {exp.due_date})</p>
                                    </div>
                                    <div className="col-span-4 flex items-center">
                                         <span className="mr-1 text-gray-400">$</span>
                                         <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={selectedItem.estimated_amount}
                                            onChange={(e) => handleAmountChange(exp.id, e.target.value)}
                                            disabled={!isSelected}
                                            className="w-full bg-gray-800 text-white rounded-md p-1 border border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-700 disabled:opacity-50"/>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            
            <p className="text-gray-400 my-4">Add any new recurring bills for this budget period.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="label" value={formState.label} onChange={handleFormChange} placeholder="Bill Name" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                <input type="number" step="0.01" name="amount" value={formState.amount} onChange={handleFormChange} placeholder="Amount for this budget" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                <input type="number" name="dueDate" value={formState.dueDate} onChange={handleFormChange} placeholder="Due Day (e.g., 15)" min="1" max="31" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                <select name="category" value={formState.category} onChange={handleFormChange} className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                    <option value="other">Other</option>
                    <option value="housing">Housing</option>
                    <option value="utilities">Utilities</option>
                    <option value="loan">Loan</option>
                    <option value="credit-card">Credit Card</option>
                    <option value="insurance">Insurance</option>
                    <option value="subscription">Subscription</option>
                </select>

                {formState.category === 'loan' && (
                    <div className="space-y-4 p-4 border border-gray-600 rounded-lg">
                        <h4 className="font-semibold text-gray-300">Loan Details (Optional)</h4>
                        <input type="number" step="0.01" name="principal_balance" value={formState.principal_balance} onChange={handleFormChange} placeholder="Principal Balance" className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700"/>
                        <input type="number" step="0.01" name="interest_rate" value={formState.interest_rate} onChange={handleFormChange} placeholder="Interest Rate (%)" className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700"/>
                        <div>
                           <label className="block text-sm text-gray-400 mb-1">Maturity Date (Optional)</label>
                           <input type="date" name="maturity_date" value={formState.maturity_date} onChange={handleFormChange} className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700"/>
                        </div>
                    </div>
                )}

                {formState.category === 'credit-card' && (
                    <div className="space-y-4 p-4 border border-gray-600 rounded-lg">
                         <h4 className="font-semibold text-gray-300">Credit Card Details (Optional)</h4>
                        <input type="number" step="0.01" name="outstanding_balance" value={formState.outstanding_balance} onChange={handleFormChange} placeholder="Outstanding Balance" className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700"/>
                        <input type="number" step="0.01" name="interest_rate" value={formState.interest_rate} onChange={handleFormChange} placeholder="Interest Rate (%)" className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700"/>
                    </div>
                )}
                
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                    {loading ? 'Adding...' : 'Add Expense'}
                </button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </form>

            <div className="flex justify-between mt-8">
                 <button onClick={onBack} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">Back</button>
                 <button onClick={handleNext} disabled={isNextDisabled} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">Next: Spending</button>
            </div>
        </div>
    );
}
export default ExpenseStep;