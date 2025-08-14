import React from 'react';

const ProgressBar = ({ percent }) => (
    <div className="w-full bg-gray-600 rounded-full h-4">
        <div 
            className="bg-green-500 h-4 rounded-full transition-all duration-500" 
            style={{ width: `${percent}%` }}
        ></div>
    </div>
);

function GoalsDisplay({ goals = [] }) {
    if (goals.length === 0) {
        return null; // Don't render anything if there are no goals
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Your Active Goals</h2>
            <div className="space-y-4">
                {goals.map(goal => {
                    const current = parseFloat(goal.current_amount);
                    const target = parseFloat(goal.target_amount);
                    let percent = 0;
                    let progressText = '';

                    if (goal.goal_type === 'savings') {
                        percent = target > 0 ? (current / target) * 100 : 0;
                        progressText = `$${current.toFixed(2)} of $${target.toFixed(2)} saved`;
                    } else { // debt_reduction
                        const amountPaid = target - current;
                        percent = target > 0 ? (amountPaid / target) * 100 : 0;
                        progressText = `$${amountPaid.toFixed(2)} of $${target.toFixed(2)} paid off`;
                    }
                    
                    // Ensure percent is between 0 and 100
                    percent = Math.max(0, Math.min(100, percent));

                    return (
                        <div key={goal.id} className="bg-gray-700 p-4 rounded-md">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-200">{goal.goal_name}</span>
                                <span className="text-sm font-bold text-green-400">{percent.toFixed(1)}%</span>
                            </div>
                            <ProgressBar percent={percent} />
                            <p className="text-right text-xs text-gray-400 mt-1">{progressText}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default GoalsDisplay;
