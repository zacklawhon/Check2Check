import React from 'react';
import Header from './Header';

function AuthenticatedLayout({ children, activeBudget }) {
  return (
    <div>
      <Header activeBudget={activeBudget} />
      <main>
        {children}
      </main>
    </div>
  );
}

export default AuthenticatedLayout;