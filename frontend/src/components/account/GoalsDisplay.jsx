// In src/components/account/GoalsDisplay.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

function GoalsDisplay({ goals, onEdit, onDelete }) { // Removed onAddMore from props
    const navigate = useNavigate(); // Initialize the hook

    if (goals.length === 0) return null;

    return (
        <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-2xl font-bold text-white">Your Active Goals</h2>
                <button 
                    // Use navigate to go to the goals wizard
                    onClick={() => navigate('/goals')} 
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                >
                    + Add More Goals
                </button>
            </div>
            <ul className="space-y-3">
                {goals.map(goal => (
                    <li key={goal.id} className="bg-gray-700 p-4 rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-lg text-gray-200">{goal.goal_name}</p>
                            <p className="text-sm text-gray-400 capitalize">Strategy: {goal.strategy}</p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => onEdit(goal)} 
                                className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2 px-3 rounded-md"
                            >
                                Edit
                            </button>
                            <button 
                                // Pass the full goal object to the handler
                                onClick={() => onDelete(goal)} 
                                className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 py-2 px-3 rounded-md"
                            >
                                Delete
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default GoalsDisplay;