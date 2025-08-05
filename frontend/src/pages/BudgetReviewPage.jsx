import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function BudgetReviewPage() {
    const { budgetId } = useParams();
    const navigate = useNavigate();

    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBudgetDetails = async () => {
            if (!budgetId) return;
            try {
                const response = await fetch(`/api/budget/${budgetId}`, {
                    credentials: 'include',
                });
                if (!response.ok) {
                    throw new Error('Could not fetch budget review.');
                }
                const data = await response.json();
                if (data.status !== 'completed' || !data.final_summary) {
                    throw new Error('This budget has not been closed for review yet.');
                }
                setBudget(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBudgetDetails();
    }, [budgetId]);

    if (loading) return <div className="text-white p-8 text-center">Loading your review...</div>;
    if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;
    if (!budget || !budget.final_summary) return <div className="text-white p-8 text-center">Budget review not found.</div>;

    const summary = budget.final_summary;

    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold">Budget Review</h1>
                <p className="text-gray-400">
                    {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                </p>
            </header>
            
            {/* --- FIX: Restored the missing JSX for the summary cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Final Summary Card */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                    <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Final Summary</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Planned Surplus:</span>
                            <span className="font-semibold">${summary.plannedSurplus.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Actual Surplus:</span>
                            <span className={`font-bold text-lg ${summary.actualSurplus >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${summary.actualSurplus.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Spending Breakdown Card */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                     <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Top Spending</h2>
                     <ul className="space-y-2">
                        {summary.topSpendingCategories.map((item) => (
                             <li key={item.category} className="flex justify-between">
                                <span className="text-gray-400 capitalize">{item.category.replace(/_/g, ' ')}:</span>
                                <span>${parseFloat(item.amount).toFixed(2)}</span>
                            </li>
                        ))}
                     </ul>
                </div>
            </div>

            {/* Smart Suggestion Card */}
            <div className="max-w-4xl mx-auto mt-8 bg-gray-800 p-6 rounded-lg shadow-xl">
                 <h2 className="text-2xl font-bold mb-4">Suggestions</h2>
                 {summary.actualSurplus >= 0 ? (
                     <p className="text-green-300">
                         Great job finishing with a surplus! This is a perfect opportunity to move ${summary.actualSurplus.toFixed(2)} into a savings account to build your emergency fund.
                     </p>
                 ) : (
                     <p className="text-yellow-300">
                         It looks like you ended with a small deficit. Don't worry, it happens! Review your top spending categories to see where you might be able to cut back next time. Consider a side hustle like DoorDash or Uber for a quick income boost.
                     </p>
                 )}
            </div>
            {/* --- End of restored section --- */}

            <div className="text-center mt-8">
                <button onClick={() => navigate('/dashboard')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg">
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}
export default BudgetReviewPage;