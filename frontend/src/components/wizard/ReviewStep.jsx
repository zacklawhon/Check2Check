import React, { useState, useEffect } from 'react';

function ReviewStep({ onBack, onComplete, dates, incomeRules }) {
    const [projection, setProjection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProjection = async () => {
            try {
                const response = await fetch('/api/budget/project-income', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        start_date: dates.startDate,
                        end_date: dates.endDate,
                        income_rules: incomeRules,
                    }),
                });
                if (!response.ok) throw new Error('Could not calculate projection.');
                const data = await response.json();
                setProjection(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProjection();
    }, [dates, incomeRules]);

    const totalProjectedIncome = projection ? projection.reduce((sum, item) => sum + item.amount, 0) : 0;

    if (loading) return <p className="text-center">Calculating your projected income...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Step 3: Review Your Projected Income</h2>
            <p className="text-gray-400 mb-6">
                Based on your rules, we've projected the following income for your budget cycle from <strong>{dates.startDate}</strong> to <strong>{dates.endDate}</strong>.
            </p>

            <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-bold">Total Projected Income:</h3>
                    <span className="text-2xl font-bold text-green-400">${totalProjectedIncome.toFixed(2)}</span>
                </div>
                <ul className="space-y-2">
                    {projection.map((item, index) => (
                        <li key={index} className="flex justify-between items-center bg-gray-800 p-2 rounded-md">
                            <div>
                                <p className="font-semibold">{item.label}</p>
                                <p className="text-xs text-gray-400">{item.date}</p>
                            </div>
                            <span className="font-semibold">${item.amount.toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="flex justify-between mt-8">
                <button onClick={onBack} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">Back</button>
                <button onClick={() => onComplete(projection)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">
                    Looks Good, Next
                </button>
            </div>
        </div>
    );
}

export default ReviewStep;
