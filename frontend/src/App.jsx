import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Layouts and Pages
import AccountPage from './pages/AccountPage';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import LandingPage from './pages/LandingPage';
import VerificationPage from './pages/VerificationPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './pages/BudgetPage';
import BudgetReviewPage from './pages/BudgetReviewPage';
import GuidedWizard from './components/wizard/GuidedWizard';
import EmailChangeVerificationPage from './pages/EmailChangeVerificationPage';



function ProtectedRoute({ user, loadingUser }) {
  if (loadingUser) {
    return <div className="text-center p-8 text-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthenticatedLayout>
      <Outlet />
    </AuthenticatedLayout>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile', { credentials: 'include' });
        if (res.ok) {
          setUser(await res.json());
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen">
      <BrowserRouter>
        <Routes>
          {/* Unauthenticated Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/verify-login" element={<VerificationPage />} />
          <Route path="/verify-email-change/:token" element={<EmailChangeVerificationPage />} />

          {/* Authenticated Pages */}
          <Route element={<ProtectedRoute user={user} loadingUser={loadingUser} />}>
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