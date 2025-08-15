// src/components/account/IntroGoalCard.jsx
import React from 'react';

function IntroGoalCard({ onStart }) {
    return (
        <div className="bg-indigo-800 border border-indigo-500 text-white p-6 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold mb-3">Have a Savings Goal? Want to Get Out of Debt? Both?</h2>
            <p className="text-indigo-200 mb-4">
                You're one step away from creating a powerful debt elimination plan, savings goal or both! Create a goal to get started.
            </p>
            <button onClick={onStart} className="bg-white text-indigo-800 font-bold py-2 px-6 rounded-lg hover:bg-indigo-100 transition-colors">
                Create My Plan
            </button>
        </div>
    );
}

export default IntroGoalCard;