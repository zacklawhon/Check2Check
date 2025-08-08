import React, { useState, useEffect } from 'react';

// FIX: Add a new prop `buttonText`
function DateConfirmationStep({ proposedStartDate, proposedEndDate, onComplete, buttonText }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        setStartDate(proposedStartDate);
        setEndDate(proposedEndDate);
    }, [proposedStartDate, proposedEndDate]);

    const handleNext = () => {
        onComplete({ startDate, endDate });
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Step 1: Confirm Your Budget Dates</h2>
            <p className="text-gray-400 mb-6">
                Welcome! Our system attempted to intelligently guess the following dates for your next budget. You can adjust them if needed.
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
            </div>

            <div className="text-right mt-8">
                {/* FIX: Use the buttonText prop, or a default value */}
                <button onClick={handleNext} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">
                    {buttonText || 'Next: Income'}
                </button>
            </div>
        </div>
    );
}

export default DateConfirmationStep;