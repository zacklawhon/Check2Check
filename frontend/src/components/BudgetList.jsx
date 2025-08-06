import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// The 'user' prop is no longer needed
function BudgetList({ budgetCycles, onRefresh }) {
    const navigate = useNavigate();
    const [loadingId, setLoadingId] = useState(null);

    const handleCloseBudget = async (budgetId) => {
        setLoadingId(budgetId);
        try {
            const response = await fetch(`/api/budget/close/${budgetId}`, {
                method: 'POST', credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to close budget.');
            window.location.href = `/review/${budgetId}`;
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingId(null);
        }
    };
    
    const isPastEndDate = (dateString) => {
        const endDate = new Date(`${dateString}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        return endDate < today;
    };

    const hasActiveBudget = budgetCycles.some(cycle => cycle.status === 'active');
    
    if (budgetCycles.length === 0) {
        return (
            <div className="text-center text-gray-400 p-8">
                <p>You don't have any budgets yet.</p>
                <button onClick={() => navigate('/wizard')} className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">
                    Create Your First Budget
                </button>
            </div>
        );
    }
    
    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            {!hasActiveBudget && (
                <div className="text-center p-4">
                     <button onClick={() => navigate('/wizard')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">
                        Create New Budget
                    </button>
                </div>
            )}

            {budgetCycles.map(cycle => {
                const isClosable = cycle.status === 'active' && isPastEndDate(cycle.end_date);
                return (
                    <div key={cycle.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center shadow-lg">
                        <div>
                            <p className="font-bold">{new Date(`${cycle.start_date}T00:00:00`).toLocaleDateString()} - {new Date(`${cycle.end_date}T00:00:00`).toLocaleDateString()}</p>
                            <p className={`text-sm capitalize font-semibold ${cycle.status === 'active' ? 'text-green-500' : 'text-gray-400'}`}>{cycle.status}</p>
                        </div>
                        {cycle.status === 'active' && !isClosable && (<button onClick={() => navigate(`/budget/${cycle.id}`)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">View</button>)}
                        {isClosable && (<button onClick={() => handleCloseBudget(cycle.id)} disabled={loadingId === cycle.id} className="bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">{loadingId === cycle.id ? 'Closing...' : 'Close & Review'}</button>)}
                        {cycle.status === 'completed' && (<button onClick={() => navigate(`/review/${cycle.id}`)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Review</button>)}
                    </div>
                );
            })}
        </div>
    );
}
export default BudgetList;