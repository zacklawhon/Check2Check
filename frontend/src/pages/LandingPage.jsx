import React, { useState } from 'react';
// FIX: AuthModal will now use the hook internally, no need for navigate prop.
import AnonymousCalculator from '../components/AnonymousCalculator';
import AuthModal from '../components/modals/AuthModal';

// FIX: `Maps` prop is removed.
function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <header className="p-4 md:p-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Check2Check.org
          </h1>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Login / Sign Up
          </button>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center p-4">
        <AnonymousCalculator onShowAuth={() => setIsAuthModalOpen(true)} />
      </main>

      {/* FIX: `Maps` prop removed. AuthModal must be updated to use the hook. */}
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
    </div>
  );
}

export default LandingPage;