import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HelpFeedbackModal from './common/HelpFeedbackModal';
import logo from '../assets/c2c-logo-2.png';
import * as api from '../utils/api';

// 1. Accept the 'user' object as a prop
function Header({ activeBudget, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // 2. Determine if the user is an owner
  const isOwner = user && !user.owner_user_id;

  const pageKey = useMemo(() => {
    const { pathname } = location;
    if (pathname.startsWith('/budget/')) return 'budget';
    if (pathname.startsWith('/wizard')) return 'wizard';
    if (pathname.startsWith('/account')) return 'account';
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    return 'default'; // Fallback key
  }, [location]);

  const handleLogout = async () => {
    try {
        await api.logout();
    } catch (err) {
        console.error("Logout failed, navigating to homepage.", err);
    } finally {
        navigate('/');
    }
  };

  const handleNavClick = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="bg-gray-800 text-white shadow-md sticky top-0 z-30">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center">
            <img src={logo} alt="Check2Check" className="h-10 w-auto mr-4"/>
            <nav className="hidden md:flex items-center space-x-4">
              <button onClick={() => navigate('/dashboard')} className="text-gray-300 hover:text-white">Dashboard</button>
              
              {/* 3. Conditionally render the "Account" link for desktop */}
              {isOwner && (
                <button onClick={() => navigate('/account')} className="text-gray-300 hover:text-white">Account</button>
              )}

              <button onClick={() => setIsHelpModalOpen(true)} className="text-gray-300 hover:text-white">Help & Feedback</button>
            </nav>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {activeBudget && (
              <button
                onClick={() => navigate(`/budget/${activeBudget.id}`)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm py-2 px-4"
              >
                Active Budget
              </button>
            )}
            <button onClick={handleLogout} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm py-2 px-4">Logout</button>
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {/* Hamburger/Close Icon */}
          </button>
        </div>
      </header>

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

            {/* 4. Conditionally render the "Account" link for mobile */}
            {isOwner && (
              <button onClick={() => handleNavClick('/account')} className="text-left text-gray-300 hover:text-white py-2">Account</button>
            )}

            <button onClick={() => { setIsHelpModalOpen(true); setIsMenuOpen(false); }} className="text-left text-gray-300 hover:text-white py-2">Help & Feedback</button>
            <button onClick={handleLogout} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm py-2 px-3 mt-2">Logout</button>
          </nav>
        </div>
      )}
      
      <HelpFeedbackModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </>
  );
}

export default Header;