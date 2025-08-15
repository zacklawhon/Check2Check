import React, { useState } from 'react';

function CustomSavingsStep({ onBack, onComplete }) {
    const [goalName, setGoalName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onComplete({
            goal_name: goalName,
            target_amount: parseFloat(targetAmount)
        });
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-2 text-center">Create a Savings Goal</h2>
            <p className="text-gray-400 mb-6 text-center">Give your goal a name and a target amount.</p>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
                <div>
                    <label htmlFor="goalName" className="block text-gray-300 font-semibold mb-2">Goal Name</label>
                    <input
                        id="goalName"
                        type="text"
                        value={goalName}
                        onChange={(e) => setGoalName(e.target.value)}
                        placeholder="e.g., Vacation to Hawaii"
                        className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="targetAmount" className="block text-gray-300 font-semibold mb-2">Target Amount ($)</label>
                    <input
                        id="targetAmount"
                        type="number"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        placeholder="e.g., 2500"
                        className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"
                        required
                        min="1"
                        step="any"
                    />
                </div>
                <div className="flex justify-between items-center pt-4">
                    <button type="button" onClick={onBack} className="text-gray-400 hover:text-white font-semibold">
                        &larr; Back
                    </button>
                    <button 
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
                    >
                        Create Goal
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CustomSavingsStep;