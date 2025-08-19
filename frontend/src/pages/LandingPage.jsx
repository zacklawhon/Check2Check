import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate and useEffect
import AnonymousCalculator from '../components/landing/AnonymousCalculator';
import AuthModal from '../components/landing/AuthModal';
import logo from '../assets/c2c-logo-2.png';

function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // 2. Add loading state
  const navigate = useNavigate();

  // 3. Add an effect to check authentication status on load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // We can use an existing endpoint that requires authentication.
        // If this fetch succeeds, the user is logged in.
        const response = await fetch('/api/user/profile', { credentials: 'include' });
        if (response.ok) {
          navigate('/dashboard'); // Redirect to dashboard if logged in
        } else {
          // If the request fails (e.g., 401 Unauthorized), the user is not logged in.
          // We'll allow the landing page to render.
          setIsCheckingAuth(false);
        }
      } catch (err) {
        // Network errors also mean we can't authenticate, so show the page.
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [navigate]); // Dependency array ensures this runs only once

  // 4. While checking, you can show a simple loading indicator
  if (isCheckingAuth) {
    return <div className="text-center p-8 text-white">Loading...</div>;
  }

  // If auth check is complete and the user is not logged in, show the page
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <header className="p-4 md:p-6">
        <div className="container mx-auto flex justify-between items-center">
          <img 
          src={logo} // 2. Use the imported variable here
          alt="Check2Check Logo" 
          className="h-8 w-auto cursor-pointer"
        />
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

      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
    </div>
  );
}

export default LandingPage;