import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as api from '../../utils/api';

function ProfileForm({ user, onUpdate, setUser }) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

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

        try {
            await toast.promise(
                api.updateProfile(formData),
                {
                    loading: 'Saving Profile...',
                    success: 'Profile updated successfully!',
                    error: (err) => `Error: ${err.toString()}`,
                }
            );
            if (setUser) {
                setUser(prev => ({
                    ...prev,
                    demographic_zip_code: formData.demographic_zip_code,
                    demographic_age_range: formData.demographic_age_range,
                    demographic_sex: formData.demographic_sex,
                    demographic_household_size: formData.demographic_household_size,
                }));
            }
            // --- Pass updated fields to parent for local update only ---
            if (onUpdate) {
                onUpdate({
                    demographic_zip_code: formData.demographic_zip_code,
                    demographic_age_range: formData.demographic_age_range,
                    demographic_sex: formData.demographic_sex,
                    demographic_household_size: formData.demographic_household_size,
                });
            }
        } catch (err) {
            console.error("Failed to update profile:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Your Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* --- FIX: Added labels for each input --- */}
                    <div>
                        <label htmlFor="demographic_zip_code" className="block text-sm font-medium text-gray-300 mb-1">Zip Code</label>
                        <input id="demographic_zip_code" name="demographic_zip_code" value={formData.demographic_zip_code || ''} onChange={handleChange} placeholder="e.g., 90210" className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"/>
                    </div>
                    <div>
                        <label htmlFor="demographic_household_size" className="block text-sm font-medium text-gray-300 mb-1">Household Size</label>
                        <input id="demographic_household_size" type="number" name="demographic_household_size" value={formData.demographic_household_size || ''} onChange={handleChange} placeholder="e.g., 4" className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600"/>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label htmlFor="demographic_age_range" className="block text-sm font-medium text-gray-300 mb-1">Age Range</label>
                        <select id="demographic_age_range" name="demographic_age_range" value={formData.demographic_age_range || ''} onChange={handleChange} className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600">
                            <option value="">Select Age Range</option>
                            <option value="18-24">18-24</option>
                            <option value="25-34">25-34</option>
                            <option value="35-44">35-44</option>
                            <option value="45-54">45-54</option>
                            <option value="55+">55+</option>
                        </select>
                     </div>
                    <div>
                        <label htmlFor="demographic_sex" className="block text-sm font-medium text-gray-300 mb-1">Sex</label>
                        <select id="demographic_sex" name="demographic_sex" value={formData.demographic_sex || ''} onChange={handleChange} className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600">
                            <option value="">Select Sex</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                    </div>
                </div>
                {/* --- End of FIX --- */}
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