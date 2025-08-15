import React, { useState, useEffect } from 'react';

function BudgetCycleStep({ onComplete, proposedStartDate }) {
    const [startDate, setStartDate] = useState('');
    const [duration, setDuration] = useState('1-month'); // Default duration
    const [endDate, setEndDate] = useState('');

    // Set the initial start date when the component loads
    useEffect(() => {
        setStartDate(proposedStartDate || new Date().toISOString().split('T')[0]);
    }, [proposedStartDate]);

    // Calculate the end date whenever the start date or duration changes
    useEffect(() => {
        if (startDate) {
            const start = new Date(`${startDate}T00:00:00`);
            let end = new Date(start);

            switch (duration) {
                case '1-week':
                    end.setDate(start.getDate() + 6);
                    break;
                case '2-weeks':
                    end.setDate(start.getDate() + 13);
                    break;
                case 'end-of-month':
                    end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
                    break;
                case '1-month':
                    end.setMonth(start.getMonth() + 1);
                    end.setDate(start.getDate() - 1);
                    break;
                default:
                    break;
            }
            setEndDate(end.toISOString().split('T')[0]);
        }
    }, [startDate, duration]);

    const handleNext = () => {
        onComplete({ startDate, endDate });
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Step 1: Define Your Budget Cycle</h2>
            <p className="text-gray-400 mb-6">
                First, let's set the timeframe for this budget. We've proposed a start date for you.
            </p>

            <div className="space-y-4 mb-6">
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                    <input
                        type="date"
                        id="start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600"
                    />
                </div>
                <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-1">Duration</label>
                    <select
                        id="duration"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600"
                    >
                        <option value="1-month">One Month</option>
                        <option value="end-of-month">To End of Month</option>
                        <option value="2-weeks">Two Weeks</option>
                        <option value="1-week">One Week</option>
                    </select>
                </div>
                {endDate && (
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                        <p className="text-gray-300">Your budget will run until: <strong className="text-white">{endDate}</strong></p>
                    </div>
                )}
            </div>

            <div className="text-right mt-8">
                <button onClick={handleNext} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg">
                    Next: Add Income
                </button>
            </div>
        </div>
    );
}

export default BudgetCycleStep;
