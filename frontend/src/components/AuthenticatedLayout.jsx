import React from 'react';
import Header from './Header';

function AuthenticatedLayout({ children, navigate }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header navigate={navigate} />
      <main>
        {children}
      </main>
    </div>
  );
}

export default AuthenticatedLayout;