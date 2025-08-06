import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import AuthenticatedLayout from './components/AuthenticatedLayout';
import AccountPage from './pages/AccountPage';
import LandingPage from './pages/LandingPage';
import VerificationPage from './pages/VerificationPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './pages/BudgetPage';
import BudgetReviewPage from './pages/BudgetReviewPage';
import GuidedWizard from './components/wizard/GuidedWizard';
import EmailChangeVerificationPage from './pages/EmailChangeVerificationPage';

function ProtectedRoute({ user, loadingUser, activeBudget }) {
  if (loadingUser) {
    return <div className="text-center p-8 text-white">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return (
    <AuthenticatedLayout activeBudget={activeBudget}>
      <Outlet />
    </AuthenticatedLayout>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeBudget, setActiveBudget] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingUser(true);
      try {
        // Step 1: First, just try to get the user profile.
        const profileRes = await fetch('/api/user/profile', { credentials: 'include' });

        if (profileRes.ok) {
          const userData = await profileRes.json();
          setUser(userData);

          // Step 2: If we successfully get a user, THEN we fetch their active budget.
          const activeBudgetRes = await fetch('/api/user/active-budget', { credentials: 'include' });
          if (activeBudgetRes.ok) {
            setActiveBudget(await activeBudgetRes.json());
          }
        } else {
          // If the profile fetch fails, we know the user is not logged in.
          setUser(null);
          setActiveBudget(null);
        }
      } catch (err) {
        setUser(null);
        setActiveBudget(null);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchInitialData();
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen">
      <BrowserRouter>
        <Toaster position="top-center" toastOptions={{ style: { background: '#374151', color: '#fff' } }} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/verify-login" element={<VerificationPage />} />
          <Route path="/verify-email-change/:token" element={<EmailChangeVerificationPage />} />

          <Route element={<ProtectedRoute user={user} loadingUser={loadingUser} activeBudget={activeBudget} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wizard" element={<GuidedWizard user={user} />} />
            <Route path="/budget/:budgetId" element={<BudgetPage />} />
            <Route path="/review/:budgetId" element={<BudgetReviewPage />} />
            <Route path="/account" element={<AccountPage user={user} />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;