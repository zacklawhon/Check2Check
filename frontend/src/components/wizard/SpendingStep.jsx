// frontend/src/components/wizard/SpendingStep.jsx

import React, { useState, useEffect } from 'react';

function SpendingStep({ onBack, onComplete, updateSpending, existingCategories = [] }) {
    // State for the "add new" form
    const [categoryName, setCategoryName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // State to manage the list of selected categories
    const [selectedCategories, setSelectedCategories] = useState([]);

    // --- THIS IS THE FIX ---
    // This hook now initializes the selected categories to an empty list,
    // ensuring the checkboxes are unchecked by default when the component loads.
    useEffect(() => {
        setSelectedCategories([]);
    }, [existingCategories]);

    // Handler for checkbox changes
    const handleSelectionChange = (category, isChecked) => {
        if (isChecked) {
            setSelectedCategories(prev => [...prev, category]);
        } else {
            setSelectedCategories(prev => prev.filter(item => item.id !== category.id));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/onboarding/add-spending-category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name: categoryName })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to add category.');
            
            const newCategory = { id: data.id, name: categoryName };
            // Add to the main list and automatically select it
            updateSpending(newCategory);
            setSelectedCategories(prev => [...prev, newCategory]);
            setCategoryName('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Passes the final confirmed list up to the parent wizard
    const handleNext = () => {
        onComplete(selectedCategories);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Step 4: Variable Spending</h2>
            <p className="text-gray-400 mb-6">Select any variable spending categories you'd like to include in this budget, like groceries, gas, or entertainment.</p>

            {existingCategories.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-semibold mb-2">Your Saved Categories</h3>
                    <div className="space-y-2 bg-gray-700 p-4 rounded-lg">
                        {existingCategories.map(cat => (
                            <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded bg-gray-800 border-gray-600 text-indigo-500 focus:ring-indigo-600"
                                    checked={selectedCategories.some(item => item.id === cat.id)}
                                    onChange={(e) => handleSelectionChange(cat, e.target.checked)}
                                />
                                <span>{cat.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex gap-4 mb-6">
                <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Add a new category..."
                    className="flex-grow bg-gray-700 text-white rounded-lg p-2 border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500">
                    {loading ? 'Adding...' : 'Add'}
                </button>
            </form>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
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
export default SpendingStep;
