import React, { useState } from 'react';

function BudgetCycleStep({ onBack, onComplete, setDates }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleNext = () => {
        setDates({ startDate, endDate });
        onComplete();
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Step 4: Confirm Budget Dates</h2>
            <p className="text-gray-400 mb-6">
                The app will automatically guess your budget's start and end dates based on your income. If you need to, you can override them here.
            </p>

            <div className="space-y-4 mb-6">
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                    <input
                        type="date"
                        id="start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                    <input
                        type="date"
                        id="end-date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>
                 <p className="text-xs text-gray-500">If you leave these blank, the app will create a budget for your next pay cycle.</p>
            </div>

            <div className="flex justify-between mt-8">
                <button onClick={onBack} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg">
                    Back
                </button>
                <button onClick={handleNext} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">
                    Finish Setup
                </button>
            </div>
        </div>
    );
}

export default BudgetCycleStep;
