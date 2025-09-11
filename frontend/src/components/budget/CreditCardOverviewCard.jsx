import React from 'react';

function CreditCardOverviewCard({ creditCardStats }) {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold text-white-300 border-b border-gray-700 mb-2">Credit Card Overview</h3>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-300">Available Spending Limit:</span> <span className="font-bold text-green-400">${(creditCardStats.totalSpendingLimit-creditCardStats.totalOutstanding).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
                <div className="flex justify-between"><span className="text-gray-300">Total Outstanding Balance:</span> <span className="font-bold text-red-400">${creditCardStats.totalOutstanding.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
                <div className="flex justify-between"><span className="text-gray-300">Total Spending Limit:</span> <span className="font-bold text-blue-300">${creditCardStats.totalSpendingLimit.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
                <div className="flex justify-between"><span className="text-gray-300">Average Interest Rate:</span> <span className="font-bold text-orange-300">{creditCardStats.avgInterestRate.toFixed(2)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-300">Total Cards:</span> <span className="font-bold text-white">{creditCardStats.totalCards}</span></div>
            </div>
        </div>
    );
}

export default CreditCardOverviewCard;
