import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate and useEffect
import AnonymousCalculator from '../components/landing/AnonymousCalculator';
import AuthModal from '../components/landing/AuthModal';
import logo from '../assets/c2c-logo-2.png';
import * as api from '../utils/api';

function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        await api.getProfile();
        // If the above line succeeds, the user is logged in.
        navigate('/dashboard');
      } catch (err) {
        // --- THIS IS THE FIX ---
        // The apiRequest helper throws an error with a message.
        // If the user is simply not logged in, the message will contain "401".
        if (err.message.includes('401') || err.message.includes('Authentication')) {
          // This is an expected "error" for a logged-out user, so we show the page.
          setIsCheckingAuth(false);
        } else {
          // For any other error (e.g., server down), we can handle it differently.
          // For now, we'll also just show the page, but you could show an error message.
          console.error("Auth check failed with an unexpected error:", err);
          setIsCheckingAuth(false);
        }
        // --- END OF FIX ---
      }
    };

    checkAuthStatus();
  }, [navigate]);

  if (isCheckingAuth) {
    return <div className="text-center p-8 text-white">Loading...</div>;
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <header className="p-4 md:p-6">
        <div className="container mx-auto flex justify-between items-center">
          <img 
            src={logo}
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