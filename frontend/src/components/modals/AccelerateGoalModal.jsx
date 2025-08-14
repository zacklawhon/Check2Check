import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function AccelerateGoalModal({ isOpen, onClose, onSuccess, goal, surplus, budgetId }) {
    const [debtPayment, setDebtPayment] = useState('');
    const [savingsPayment, setSavingsPayment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (goal && surplus) {
            if (goal.strategy === 'hybrid') {
                const half = (surplus / 2).toFixed(2);
                setDebtPayment(half);
                setSavingsPayment(half);
            } else if (goal.goal_type === 'debt_reduction') {
                setDebtPayment(surplus.toFixed(2));
                setSavingsPayment('');
            } else { // savings
                setSavingsPayment(surplus.toFixed(2));
                setDebtPayment('');
            }
        }
    }, [goal, surplus, isOpen]);

    const handleSubmit = async () => {
        setLoading(true);
        const debtAmount = parseFloat(debtPayment) || 0;
        const savingsAmount = parseFloat(savingsPayment) || 0;

        try {
            const promises = [];
            if (debtAmount > 0) {
                promises.push(fetch(`/api/goals/${goal.id}/log-payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ amount: debtAmount, budgetId, paymentType: 'debt' })
                }));
            }
            if (savingsAmount > 0) {
                promises.push(fetch(`/api/goals/${goal.id}/log-payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ amount: savingsAmount, budgetId, paymentType: 'savings' })
                }));
            }

            await Promise.all(promises);
            toast.success('Surplus applied to your goal!');
            onSuccess();

        } catch (err) {
            toast.error('Failed to apply surplus.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md relative">
                <h2 className="text-2xl font-bold text-center mb-4 text-white">Accelerate Your Goal!</h2>
                <p className="text-center text-gray-400 mb-6">
                    Your budget has a surplus of <strong className="text-green-400">${surplus.toFixed(2)}</strong>. Let's put it to work!
                </p>

                <div className="space-y-4">
                    {goal.strategy === 'hybrid' ? (
                        <>
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-300">Extra Payment to "{goal.goal_name}"</label>
                                <input type="number" value={debtPayment} onChange={e => setDebtPayment(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-300">Contribution to Emergency Fund</label>
                                <input type="number" value={savingsPayment} onChange={e => setSavingsPayment(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600" />
                            </div>
                        </>
                    ) : (
                         <div>
                            <label className="block text-sm font-semibold mb-1 text-gray-300">Amount to Apply</label>
                            <input type="number" value={debtPayment || savingsPayment} onChange={e => goal.goal_type === 'debt_reduction' ? setDebtPayment(e.target.value) : setSavingsPayment(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600" />
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 pt-6">
                    <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500">
                        {loading ? 'Applying...' : 'Apply Funds'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AccelerateGoalModal;