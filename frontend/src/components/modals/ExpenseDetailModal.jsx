import React, { useState, useEffect } from 'react';

// A simple sub-component to render the bar chart
function BarChart({ data }) {
    if (!data || data.length === 0) {
        return <p className="text-gray-500 text-sm">No payment history found for this bill.</p>;
    }

    const maxValue = Math.max(...data.map(item => parseFloat(item.amount)));

    return (
        <div className="w-full bg-gray-900/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-4 text-gray-300">Payment History</h4>
            <div className="flex justify-around items-end h-32 border-b border-l border-gray-600 pb-2 pl-2">
                {data.map((item) => (
                    <div key={item.id} className="flex flex-col items-center flex-grow text-center">
                        <div 
                            className="w-3/4 bg-indigo-500 hover:bg-indigo-400 rounded-t-sm"
                            style={{ height: `${(parseFloat(item.amount) / maxValue) * 100}%` }}
                            title={`$${parseFloat(item.amount).toFixed(2)} on ${new Date(item.transacted_at).toLocaleDateString()}`}
                        ></div>
                        <span className="text-xs text-gray-400 mt-2">
                            {new Date(item.transacted_at).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ExpenseDetailModal({ item, isOpen, onClose, budgetId, onUpdate }) {
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setFormData({
                principal_balance: item.principal_balance || '',
                interest_rate: item.interest_rate || '',
                outstanding_balance: item.outstanding_balance || '',
                maturity_date: item.maturity_date || ''
            });
        }
        if (!isOpen) {
            setIsEditing(false); // Reset edit mode when modal is closed
            return;
        };

        const isHistoryNeeded = ['utilities', 'other', 'housing', 'subscription', 'insurance'].includes(item.category);

        if (isHistoryNeeded) {
            const fetchHistory = async () => {
                setLoadingHistory(true);
                try {
                    const response = await fetch(`/api/budget/expense-history?label=${encodeURIComponent(item.label)}`, {
                        credentials: 'include'
                    });
                    if (!response.ok) throw new Error('Could not fetch history.');
                    const data = await response.json();
                    setHistory(data);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoadingHistory(false);
                }
            };
            fetchHistory();
        }
    }, [isOpen, item]);

    if (!isOpen) return null;

    const handleFormChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/expenses/update-details/${item.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            if (!response.ok) throw new Error('Failed to save changes.');
            setIsEditing(false);
            onUpdate();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/budget/mark-bill-paid/${budgetId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ label: item.label, amount: item.estimated_amount })
            });
            if (!response.ok) throw new Error('Failed to mark as paid.');
            onUpdate();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Renders either the display text or the edit form based on 'isEditing' state
    const renderDetails = () => {
        const commonFields = (
            <div className="space-y-2">
                <input 
                    type="number" 
                    name="interest_rate" 
                    value={formData.interest_rate} 
                    onChange={handleFormChange}
                    placeholder="Interest Rate (%)" 
                    className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600"
                />
            </div>
        );

        switch (item.category) {
            case 'loan':
                return isEditing ? (
                    <div className="space-y-2">
                        <input type="number" name="principal_balance" value={formData.principal_balance} onChange={handleFormChange} placeholder="Principal Balance" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600"/>
                        {commonFields}
                        <input type="date" name="maturity_date" value={formData.maturity_date} onChange={handleFormChange} className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600"/>
                    </div>
                ) : (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-400">Principal Balance:</span><span>${item.principal_balance || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Interest Rate:</span><span>{item.interest_rate || 'N/A'}%</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Maturity Date:</span><span>{item.maturity_date || 'N/A'}</span></div>
                    </div>
                );
            case 'credit-card':
                return isEditing ? (
                     <div className="space-y-2">
                        <input type="number" name="outstanding_balance" value={formData.outstanding_balance} onChange={handleFormChange} placeholder="Outstanding Balance" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600"/>
                        {commonFields}
                    </div>
                ) : (
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-400">Outstanding Balance:</span><span>${item.outstanding_balance || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Interest Rate:</span><span>{item.interest_rate || 'N/A'}%</span></div>
                    </div>
                );
            default:
                return loadingHistory ? <p>Loading history...</p> : <BarChart data={history} />;
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white text-2xl">&times;</button>
                <h2 className="text-2xl font-bold text-center mb-2 text-white">{item.label}</h2>
                <p className="text-sm text-gray-400 text-center mb-6 capitalize">{item.category}</p>
                
                <div className="space-y-4 my-6 min-h-[160px]">
                    {renderDetails()}
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>

                <div className="flex items-center gap-4 border-t border-gray-700 pt-4">
                    {!item.is_paid && (
                        <button onClick={handleMarkPaid} disabled={loading} className="flex-grow bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                            {loading ? 'Processing...' : `Pay $${item.estimated_amount}`}
                        </button>
                    )}
                    {isEditing ? (
                        <>
                            <button onClick={handleSaveChanges} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">Save</button>
                            <button onClick={() => setIsEditing(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
                        </>
                    ) : (
                        // Only show the Edit button for categories that have editable fields
                        ['loan', 'credit-card'].includes(item.category) && (
                           <button onClick={() => setIsEditing(true)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Edit</button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default ExpenseDetailModal;