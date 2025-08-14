import React from 'react';

// A reusable card component for displaying each strategy
const StrategyCard = ({ title, icon, description, benefit, onSelect }) => (
    <div className="bg-gray-700 p-6 rounded-lg flex flex-col">
        <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <span className="text-3xl">{icon}</span>
            {title}
        </h3>
        <p className="text-gray-300 mb-2"><strong>How it works:</strong> {description}</p>
        <p className="text-indigo-200 mb-4 flex-grow"><strong>The big win:</strong> {benefit}</p>
        <button 
            onClick={onSelect}
            className="mt-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg w-full"
        >
            Choose {title}
        </button>
    </div>
);

function StrategyStep({ onBack, onComplete }) {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-2 text-center">Choose Your Strategy</h2>
            <p className="text-gray-400 mb-6 text-center">There's no single "best" way to pay off debt. Choose the method that feels right for you.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StrategyCard
                    title="Avalanche"
                    description="You pay extra on the debt with the highest interest rate."
                    benefit="You'll pay the least amount of interest over time, saving you the most money."
                    onSelect={() => onComplete('avalanche')}
                />
                <StrategyCard
                    title="Snowball"
                    description="You pay extra on the debt with the smallest balance."
                    benefit="You'll get quick wins by clearing small debts completely, which helps build motivation."
                    onSelect={() => onComplete('snowball')}
                />
                <StrategyCard
                    title="Hybrid"
                    description="You split any extra money between your top debt goal and your emergency savings."
                    benefit="You make steady progress on both getting out of debt and building your financial safety net."
                    onSelect={() => onComplete('hybrid')}
                />
            </div>

            <div className="mt-8 text-center">
                <button onClick={onBack} className="text-gray-400 hover:text-white font-semibold py-2 px-5 rounded-lg transition">
                    &larr; Back
                </button>
            </div>
        </div>
    );
}

export default StrategyStep;