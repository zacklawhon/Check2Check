import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function ProfileForm({ user, onUpdate }) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                demographic_zip_code: user.demographic_zip_code || '',
                demographic_age_range: user.demographic_age_range || '',
                demographic_sex: user.demographic_sex || '',
                demographic_household_size: user.demographic_household_size || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const promise = fetch('/api/account/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData)
        }).then(response => {
            if (!response.ok) {
                return response.json().then(data => Promise.reject(data.message || 'Failed to update.'));
            }
            return response.json();
        });

        await toast.promise(promise, {
            loading: 'Saving Profile...',
            success: 'Profile updated successfully!',
            error: (err) => `Error: ${err.toString()}`,
        });
        
        onUpdate();
        setLoading(false);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Your Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="demographic_zip_code" value={formData.demographic_zip_code || ''} onChange={handleChange} placeholder="Zip Code" className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"/>
                    <input type="number" name="demographic_household_size" value={formData.demographic_household_size || ''} onChange={handleChange} placeholder="Household Size" className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <select name="demographic_age_range" value={formData.demographic_age_range || ''} onChange={handleChange} className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600">
                        <option value="">Select Age Range</option>
                        <option value="18-24">18-24</option>
                        <option value="25-34">25-34</option>
                        <option value="35-44">35-44</option>
                        <option value="45-54">45-54</option>
                        <option value="55+">55+</option>
                    </select>
                    <select name="demographic_sex" value={formData.demographic_sex || ''} onChange={handleChange} className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600">
                        <option value="">Select Sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                </div>
                <div className="text-right">
                    <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500">
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ProfileForm;