import React from 'react';
import Header from './Header';

function AuthenticatedLayout({ children, activeBudget, user }) {
  return (
    <div>
      <Header activeBudget={activeBudget} user={user}/>
      <main>
        {children}
      </main>
    </div>
  );
}

export default AuthenticatedLayout;