// Create new file: src/components/modals/EditGoalModal.jsx
import React, { useState, useEffect } from 'react';
import * as api from '../../../utils/api'; // 1. Import the API client

function EditGoalModal({ isOpen, goal, onClose, onSuccess }) {
    const [goalName, setGoalName] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (goal) {
            setGoalName(goal.goal_name);
        }
    }, [goal]);

    // 2. The handler is now much simpler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);
        try {
            const updatedGoal = await api.updateGoal(goal.id, { goal_name: goalName });
            // Pass updated goal data to parent for seamless update
            onSuccess(updatedGoal);
        } catch (err) {
            setError(err.message); // The API client already shows a toast
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-4">Edit Goal</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="goalName" className="block text-gray-300 text-sm font-bold mb-2">
                            Goal Name
                        </label>
                        <input
                            type="text"
                            id="goalName"
                            value={goalName}
                            onChange={(e) => setGoalName(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 bg-gray-700 text-white leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-indigo-400"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditGoalModal;