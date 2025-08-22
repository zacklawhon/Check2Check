import React, { useState, useEffect } from 'react';
import * as api from '../../../utils/api';

function EditIncomeRuleModal({ isOpen, incomeSource, onClose, onSuccess }) {
    const [formState, setFormState] = useState({
        label: '',
        frequency: 'weekly',
        frequency_day: '5',
        frequency_date_1: '15',
        frequency_date_2: '30',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // When the modal opens, populate the form with the source's data
        if (incomeSource) {
            setFormState({
                label: incomeSource.label || '',
                frequency: incomeSource.frequency || 'weekly',
                frequency_day: incomeSource.frequency_day || '5',
                frequency_date_1: incomeSource.frequency_date_1 || '15',
                frequency_date_2: incomeSource.frequency_date_2 || '30',
            });
        }
    }, [incomeSource]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.updateIncomeSource(incomeSource.id, formState);
            onSuccess();
        } catch (err) {
            setError(err.message); // The API client already shows a toast
        } finally {
            setLoading(false);
        }
    };

    const renderFrequencyDetails = () => {
        switch (formState.frequency) {
            case 'weekly':
            case 'bi-weekly':
                return (
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Day of the Week</label>
                        <select name="frequency_day" value={formState.frequency_day} onChange={handleChange} className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600">
                            <option value="1">Sunday</option>
                            <option value="2">Monday</option>
                            <option value="3">Tuesday</option>
                            <option value="4">Wednesday</option>
                            <option value="5">Thursday</option>
                            <option value="6">Friday</option>
                            <option value="7">Saturday</option>
                        </select>
                    </div>
                );
            case 'semi-monthly':
                return (
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">First Pay Day</label>
                            <input type="number" name="frequency_date_1" value={formState.frequency_date_1} onChange={handleChange} min="1" max="31" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Second Pay Day</label>
                            <input type="number" name="frequency_date_2" value={formState.frequency_date_2} onChange={handleChange} min="1" max="31" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600" />
                        </div>
                    </div>
                );
            case 'monthly':
                return (
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Day of the Month</label>
                        <input type="number" name="frequency_date_1" value={formState.frequency_date_1} onChange={handleChange} min="1" max="31" className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600" />
                    </div>
                );
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-4">Edit Income Rule</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Source Name</label>
                        <input type="text" name="label" value={formState.label} onChange={handleChange} className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Frequency</label>
                        <select name="frequency" value={formState.frequency} onChange={handleChange} className="w-full bg-gray-700 text-white rounded-lg p-2 border border-gray-600">
                            <option value="weekly">Weekly</option>
                            <option value="bi-weekly">Every 2 Weeks</option>
                            <option value="semi-monthly">Twice a Month</option>
                            <option value="monthly">Monthly</option>
                            <option value="one-time">One-Time</option>
                        </select>
                    </div>
                    {renderFrequencyDetails()}
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:bg-indigo-400">
                            {loading ? 'Saving...' : 'Save Rule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditIncomeRuleModal;
