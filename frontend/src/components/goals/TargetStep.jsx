import React, { useMemo } from 'react';

function TargetStep({ debts = [], strategy, goals = [], onBack, onComplete }) {

    const activeGoalNames = useMemo(() =>
        new Set(goals
            .filter(g => g.goal_type === 'debt_reduction')
            .map(g => g.goal_name)
        ),
        [goals]);

    const sortedDebts = useMemo(() => {
        const debtsCopy = [...debts];
        if (strategy === 'snowball') {
            return debtsCopy.sort((a, b) => parseFloat(a.outstanding_balance) - parseFloat(b.outstanding_balance));
        }
        return debtsCopy.sort((a, b) => parseFloat(b.interest_rate) - parseFloat(a.interest_rate));
    }, [debts, strategy]);

    if (debts.length === 0) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Select Your Target</h2>
                <p className="text-gray-300">
                    It looks like you haven't added any debts with a balance and interest rate on your Account page yet. Please go there to add your debts, then come back to create your plan!
                </p>
                <div className="mt-8">
                    <button onClick={onBack} className="text-gray-400 hover:text-white font-semibold py-2 px-5 rounded-lg transition">
                        &larr; Back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-2 text-center">Select Your Target</h2>
            <p className="text-gray-400 mb-6 text-center">Based on your chosen strategy, we recommend starting with the debt below. You can always choose a different one.</p>

            <ul className="space-y-3">
                {sortedDebts.map((debt, index) => {
                    // For each debt, check if a goal for it already exists.
                    const goalNameForDebt = `Pay Off: ${debt.label}`;
                    const isGoalActive = activeGoalNames.has(goalNameForDebt);

                    return (
                        <li key={debt.id} className={`bg-gray-700 p-4 rounded-lg flex items-center justify-between ${index === 0 && !isGoalActive ? 'border-2 border-indigo-500' : ''}`}>
                            <div>
                                <div className="flex items-center gap-3">
                                    <p className="font-bold text-lg text-white">{debt.label}</p>
                                    {index === 0 && !isGoalActive && <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">Recommended</span>}
                                </div>
                                <p className="text-sm text-gray-300">
                                    Balance: ${parseFloat(debt.outstanding_balance).toFixed(2)}
                                    <span className="mx-2">|</span>
                                    Rate: {parseFloat(debt.interest_rate).toFixed(2)}%
                                </p>
                            </div>

                            {/* --- CONDITIONAL BUTTON LOGIC --- */}
                            {isGoalActive ? (
                                <span className="bg-gray-500 text-white text-xs font-bold py-2 px-4 rounded-lg cursor-not-allowed">
                                    Goal Active
                                </span>
                            ) : (
                                <button
                                    onClick={() => onComplete(debt)}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
                                >
                                    Set as Goal
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>

            <div className="mt-8 text-center">
                <button onClick={onBack} className="text-gray-400 hover:text-white font-semibold py-2 px-5 rounded-lg transition">
                    &larr; Back
                </button>
            </div>
        </div>
    );
}

export default TargetStep;