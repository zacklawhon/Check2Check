import React, { useState, useEffect } from 'react';
// FIX: Import hooks
import { useParams, useNavigate } from 'react-router-dom';

// FIX: Remove props
function BudgetReviewPage() {
    // FIX: Initialize hooks
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
    if (!budget) return <div className="text-white p-8 text-center">Budget review not found.</div>;

    const summary = budget.final_summary;

    return (
        <div className="container mx-auto p-4 md:p-8 text-white">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold">Budget Review</h1>
                <p className="text-gray-400">
                    {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                </p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Card rendering... same as before */}
            </div>

            <div className="text-center mt-8">
                <button onClick={() => navigate('/dashboard')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg">
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
}
export default BudgetReviewPage;