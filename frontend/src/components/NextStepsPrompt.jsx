import React from 'react';
import { useNavigate } from 'react-router-dom';

function NextStepsPrompt({ onDismiss }) {
    const navigate = useNavigate();

    const handleDismiss = async () => {
        try {
            await fetch('/api/user/dismiss-accounts-prompt', { 
                method: 'POST', 
                credentials: 'include' 
            });
        } catch (err) {
            console.error("Failed to dismiss prompt:", err);
        }
        // Tell the parent page to hide the prompt and refresh data
        onDismiss(); 
    };

    const handleNavigate = () => {
        handleDismiss(); // Also dismiss the prompt when navigating
        navigate('/account');
    };

    return (
        <div className="bg-indigo-800 border border-indigo-500 text-white p-6 rounded-lg shadow-xl mb-8 max-w-4xl mx-auto relative">
            <button onClick={handleDismiss} className="absolute top-2 right-3 text-indigo-200 hover:text-white text-2xl">&times;</button>
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-3">Congratulations on completing your first budget! 🎉</h2>
                <p className="text-indigo-200 mb-4">
                    Now is a great time to visit your Account page. You can add your checking or savings accounts, manage your recurring bills, and personalize your profile.
                </p>
                <button
                    onClick={handleNavigate}
                    className="bg-white text-indigo-800 font-bold py-2 px-6 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                    Go to Account Page
                </button>
            </div>
        </div>
    );
}
export default NextStepsPrompt;