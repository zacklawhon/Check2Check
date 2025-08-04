// =================================================================
// FILE: /frontend/src/components/ExperienceSelection.jsx
// =================================================================
import React, { useState } from 'react';

function ExperienceSelection({ user, onModeSet }) {
    const [error, setError] = useState('');

    const handleModeSelection = async (mode) => {
      if(!user) return;
      try {
          const response = await fetch('/api/user/set-experience-mode', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ mode })
          });
          if(!response.ok) throw new Error('Failed to set mode');
          onModeSet(mode);
      } catch (err) {
          setError('Could not save your choice. Please try again.');
      }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
        <div className="bg-gray-800 p-8 rounded-lg text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Welcome, {user.email}!</h2>
            <p className="mb-6">How would you like to start your journey?</p>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="flex justify-center gap-4">
                <button onClick={() => handleModeSelection('simple')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg">
                    Simple Mode
                </button>
                <button onClick={() => handleModeSelection('guided')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
                    Guided Mode
                </button>
            </div>
        </div>
    </div>
  );
}

export default ExperienceSelection;
