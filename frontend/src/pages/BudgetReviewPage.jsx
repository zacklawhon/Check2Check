import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import AccelerateGoalModal from '../components/budget/AccelerateGoalModal';

function BudgetReviewPage() {
    const { budgetId } = useParams();
    const navigate = useNavigate();
    const { refreshData: refreshGlobalData } = useOutletContext();

    const [reviewData, setReviewData] = useState(null);
    const [activeGoal, setActiveGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isApplySurplusModalOpen, setIsApplySurplusModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [reviewRes, goalsRes] = await Promise.all([
                    fetch(`/api/budget/${budgetId}`, { credentials: 'include' }),
                    fetch('/api/goals', { credentials: 'include' })
                ]);

                if (!reviewRes.ok || !goalsRes.ok) {
                    throw new Error('Could not load budget review data.');
                }

                const budget = await reviewRes.json();
                if (budget.status !== 'completed' || !budget.final_summary) {
                    navigate(`/budget/${budgetId}`);
                    return;
                }
                setReviewData(budget);

                const goals = await goalsRes.json();
                const firstActiveGoal = goals.find(g => g.status === 'active');
                setActiveGoal(firstActiveGoal);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [budgetId, navigate]);

    const handleSuccess = () => {
        setIsApplySurplusModalOpen(false);
        if (refreshGlobalData) {
            refreshGlobalData(null, true);
        }
        // After applying, refetch the data for this page to hide the prompt
        // This is a simple way to update the UI post-action.
        window.location.reload();
    };

    if (loading) return <div className="text-white p-8 text-center">Loading your budget review...</div>;
    if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;
    if (!reviewData) return null;

    const { final_summary: summary } = reviewData;
    const actualSurplus = parseFloat(summary.actualSurplus || 0);

    // --- NEW LOGIC TO PREVENT OVER-APPLYING SURPLUS ---
    let remainingBalance = 0;
    if (activeGoal) {
        if (activeGoal.goal_type === 'debt_reduction') {
            remainingBalance = parseFloat(activeGoal.current_amount);
        } else { // savings
            remainingBalance = parseFloat(activeGoal.target_amount) - parseFloat(activeGoal.current_amount);
        }
    }
    // Ensure remaining balance is not negative
    remainingBalance = Math.max(0, remainingBalance);

    // The amount to apply is the smaller of the surplus or the remaining balance
    const surplusToApply = Math.min(actualSurplus, remainingBalance);
    // --- END OF NEW LOGIC ---

    return (
        <>
            <div className="container mx-auto p-4 md:p-8 text-white">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold">Budget Review</h1>
                    <p className="text-gray-400">
                        {new Date(`${reviewData.start_date}T00:00:00`).toLocaleDateString()} - {new Date(`${reviewData.end_date}T00:00:00`).toLocaleDateString()}
                    </p>
                </header>

                {/* The card now only shows if there's a meaningful amount to apply */}
                {surplusToApply > 0 && activeGoal && (
                    <div className="bg-indigo-800 p-6 rounded-lg shadow-xl border border-indigo-500 text-center max-w-2xl mx-auto mb-8">
                        <h2 className="text-2xl font-bold mb-3">Congratulations! 🎉</h2>
                        <p className="text-indigo-200 mb-4">
                            You finished with an extra ${actualSurplus.toFixed(2)}. Let's apply <strong className="text-white">${surplusToApply.toFixed(2)}</strong> to your goal!
                        </p>
                        <button
                            onClick={() => setIsApplySurplusModalOpen(true)}
                            className="bg-white text-indigo-800 font-bold py-2 px-6 rounded-lg hover:bg-indigo-100"
                        >
                            Apply to "{activeGoal.goal_name}"
                        </button>
                    </div>
                )}

                <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">Final Summary</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between"><span className="text-gray-400">Planned Income:</span><span>${parseFloat(summary.plannedIncome).toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Actual Income:</span><span className="font-semibold text-green-400">${parseFloat(summary.actualIncome).toFixed(2)}</span></div>
                        <hr className="border-gray-700"/>
                        <div className="flex justify-between"><span className="text-gray-400">Planned Expenses:</span><span>${parseFloat(summary.plannedExpenses).toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Actual Expenses:</span><span className="font-semibold text-red-400">${parseFloat(summary.actualExpenses).toFixed(2)}</span></div>
                        <hr className="border-gray-700"/>
                        <div className="flex justify-between text-lg"><span className="text-gray-300">Final Surplus / Deficit:</span><span className={`font-bold ${actualSurplus >= 0 ? 'text-green-500' : 'text-red-500'}`}>${actualSurplus.toFixed(2)}</span></div>
                    </div>
                </div>
                
                <div className="text-center mt-8">
                    <button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
                        Back to Dashboard
                    </button>
                </div>
            </div>

            {activeGoal && (
                <AccelerateGoalModal
                    isOpen={isApplySurplusModalOpen}
                    onClose={() => setIsApplySurplusModalOpen(false)}
                    onSuccess={handleSuccess}
                    goal={activeGoal}
                    surplus={surplusToApply} // Pass the capped amount
                    budgetId={budgetId}
                />
            )}
        </>
    );
}

export default BudgetReviewPage;
