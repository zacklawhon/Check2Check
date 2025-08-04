import React, { useState } from 'react';
// FIX: Import the useNavigate hook
import { useNavigate } from 'react-router-dom';

// FIX: `Maps` prop is removed.
function Header() {
  // FIX: Initialize the navigate function from the hook.
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' 
    });
    // FIX: Uses the navigate function from the hook.
    navigate('/');
  };

  const handleNavClick = (path) => {
    // FIX: Uses the navigate function from the hook.
    navigate(path);
    setIsMenuOpen(false); // Close the menu after navigation
  };

  return (
    // Add relative positioning for the absolute dropdown
    <header className="bg-gray-800 shadow-md relative">
      <div className="container mx-auto flex justify-between items-center p-4 text-white">
        <h1 
          className="text-xl md:text-2xl font-bold cursor-pointer"
          onClick={() => handleNavClick('/dashboard')}
        >
          Check2Check.org
        </h1>

        {/* Desktop Navigation (Visible on medium screens and up) */}
        <nav className="hidden md:flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => handleNavClick('/dashboard')}
            className="text-gray-300 hover:text-white transition-colors"
          >
            Dashboard
          </button>
          <button 
            onClick={() => handleNavClick('/account')}
            className="text-gray-300 hover:text-white transition-colors"
          >
            Account
          </button>
          <button 
            onClick={handleLogout}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
          >
            Logout
          </button>
        </nav>

        {/* Mobile Menu Button (Hamburger Icon - visible on small screens) */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              // Close (X) Icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger Icon
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-gray-800 shadow-lg z-20">
          <nav className="flex flex-col p-4">
            <button 
              onClick={() => handleNavClick('/dashboard')} 
              className="text-left text-gray-300 hover:text-white py-2"
            >
              Dashboard
            </button>
            <button 
              onClick={() => handleNavClick('/account')} 
              className="text-left text-gray-300 hover:text-white py-2"
            >
              Account
            </button>
            <button 
              onClick={handleLogout} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm py-2 px-3 mt-2"
            >
              Logout
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;