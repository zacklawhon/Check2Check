import React from 'react';

const TOOL_INFO = {
    has_checking_account: { name: 'Checking Account', icon: '🏦' },
    has_savings_account: { name: 'Savings Account', icon: '💰' },
    has_credit_card: { name: 'Credit Card', icon: '💳' },
};

function FinancialBadges({ tools }) {
    if (!tools) {
        return null;
    }

    const userTools = Object.keys(TOOL_INFO).filter(key => tools[key]);

    if (userTools.length === 0) {
        return <p className="text-xs text-green-200">No financial tools added yet.</p>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {userTools.map(toolKey => (
                <div key={toolKey} className="bg-green-700 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span>{TOOL_INFO[toolKey].icon}</span>
                    <span>{TOOL_INFO[toolKey].name}</span>
                </div>
            ))}
        </div>
    );
}

export default FinancialBadges;