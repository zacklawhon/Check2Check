import React from 'react';

// Reusable card for the selection
const GoalChoiceCard = ({ title, description, icon, onSelect }) => (
    <div className="bg-gray-700 p-6 rounded-lg flex flex-col text-center">
        <div className="text-5xl mb-3">{icon}</div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-gray-300 mb-4 flex-grow">{description}</p>
        <button 
            onClick={onSelect}
            className="mt-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg w-full"
        >
            Select
        </button>
    </div>
);

function GoalTypeStep({ onSelect, onBack }) {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-2 text-center">What's Your Next Goal?</h2>
            <p className="text-gray-400 mb-6 text-center">Choose the type of financial goal you want to focus on next.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GoalChoiceCard
                    title="Debt Reduction Plan"
                    icon="📉"
                    description="Create a focused plan to pay down a credit card or loan using the Avalanche or Snowball method."
                    onSelect={() => onSelect('debt')}
                />
                <GoalChoiceCard
                    title="New Savings Goal"
                    icon="💰"
                    description="Save for a specific target, like a vacation, a down payment, or a big purchase."
                    onSelect={() => onSelect('savings')}
                />
            </div>

            <div className="mt-8 text-center">
                <button onClick={onBack} className="text-gray-400 hover:text-white font-semibold py-2 px-5 rounded-lg transition">
                    &larr; Back to Settings
                </button>
            </div>
        </div>
    );
}

export default GoalTypeStep;