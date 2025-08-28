import React, { useState } from 'react';
import * as api from '../../../utils/api';

function EditDatesModal({ isOpen, budget, onClose, onSuccess }) {
    // Helper to format date for input field
    const formatDate = (dateString) => {
        return new Date(dateString).toISOString().split('T')[0];
    };

    const [startDate, setStartDate] = useState(formatDate(budget.start_date));
    const [endDate, setEndDate] = useState(formatDate(budget.end_date));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.updateBudgetDates(budget.id, { start_date: startDate, end_date: endDate });
            onSuccess();
        } catch (err) {
            setError(err.message); 
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-sm relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white">&times;</button>
                <h2 className="text-2xl font-bold text-center mb-6 text-white">Edit Budget Dates</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 mb-6">
                        <div>
                            <label htmlFor="start-date" className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                            <input
                                type="date"
                                id="start-date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                required
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
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg disabled:bg-gray-500">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
                </form>
            </div>
        </div>
    );
}

export default EditDatesModal;
