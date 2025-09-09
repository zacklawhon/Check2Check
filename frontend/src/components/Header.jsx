import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HelpFeedbackModal from './common/HelpFeedbackModal';
import logo from '../assets/c2c-logo-2.png';
import * as api from '../utils/api';

function Header({ activeBudget, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const canViewSettings = user && user.id && (
    user.owner_user_id === null ||
    user.owner_user_id === undefined ||
    user.permission_level === 'full_access'
  );

  const pageKey = useMemo(() => {
    const { pathname } = location;
    if (pathname.startsWith('/budget/')) return 'budget';
    if (pathname.startsWith('/wizard')) return 'wizard';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    return 'default'; // Fallback key
  }, [location]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // The API client will show a toast, but we can log the error
      console.error("Logout failed, navigating to homepage.", err);
    } finally {
      // Always navigate to the homepage after attempting to log out
      navigate('/');
    }
  };

  const handleNavClick = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-gray-800 shadow-md relative">
      <div className="container mx-auto flex justify-between items-center p-4 text-white">
        <img
          src={logo} // 2. Use the imported variable here
          alt="Check2Check Logo"
          className="h-8 w-auto cursor-pointer"
          onClick={() => handleNavClick('/dashboard')}
        />

        <nav className="hidden md:flex items-center gap-4 md:gap-6">
          {activeBudget && (
            <button
              onClick={() => handleNavClick(`/budget/${activeBudget.id}`)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md"
            >
              Active Budget
            </button>
          )}
          <button onClick={() => handleNavClick('/dashboard')} className="text-gray-300 hover:text-white">Dashboard</button>
          <button onClick={() => setIsHelpModalOpen(true)} className="text-gray-300 hover:text-white">Help & Feedback</button>
          {canViewSettings && (
            <button onClick={() => navigate('/settings')} className="text-gray-300 hover:text-white">Settings</button>
          )}
          <button onClick={handleLogout} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm">Logout</button>
        </nav>

        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-gray-800 shadow-lg z-20">
          <nav className="flex flex-col p-4">
            {activeBudget && (
              <button
                onClick={() => handleNavClick(`/budget/${activeBudget.id}`)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm py-2 px-3 mb-2"
              >
                Active Budget
              </button>
            )}
            <button onClick={() => handleNavClick('/dashboard')} className="text-left text-gray-300 hover:text-white py-2">Dashboard</button>
            <button onClick={() => { setIsHelpModalOpen(true); setIsMenuOpen(false); }} className="text-left text-gray-300 hover:text-white py-2">Help & Feedback</button>
            {canViewSettings && (
              <button onClick={() => navigate('/settings')} className="text-gray-300 hover:text-white">Settings</button>
            )}
            <button onClick={handleLogout} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm py-2 px-3 mt-2">Logout</button>
          </nav>
        </div>
      )}

      {/* 4. Pass the pageKey prop to the modal */}
      <HelpFeedbackModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        pageKey={pageKey}
      />
    </header>
  );
}

export default Header;