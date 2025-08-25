import React, { useState, useEffect } from 'react';
import * as api from '../../utils/api';

function ReviewStep({ onBack, onComplete, dates, incomeRules }) {
    const [projection, setProjection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // 2. The fetch function is now cleaner
        const fetchProjection = async () => {
            try {
                const data = await api.projectIncome(dates, incomeRules);
                setProjection(data);
            } catch (err) {
                setError(err.message); // The API client already shows a toast
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
