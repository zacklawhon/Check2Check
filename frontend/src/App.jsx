import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// We'll move the data fetching logic into this component
import AuthenticatedLayout from './components/AuthenticatedLayout';
import AccountPage from './pages/AccountPage';
import LandingPage from './pages/LandingPage';
import VerificationPage from './pages/VerificationPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './pages/BudgetPage';
import BudgetReviewPage from './pages/BudgetReviewPage';
import GuidedWizard from './components/wizard/GuidedWizard';
import EmailChangeVerificationPage from './pages/EmailChangeVerificationPage';
import RegisterPage from './pages/RegisterPage';

// In src/App.jsx

// In src/App.jsx

// In src/App.jsx

function ProtectedRoute() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeBudget, setActiveBudget] = useState(null);
  const [financialTools, setFinancialTools] = useState(null);

  // --- 1. Define the function in the component's main scope ---
  const fetchInitialData = async () => {
    try {
      const [profileRes, activeBudgetRes, toolsRes] = await Promise.all([
        fetch('/api/user/profile', { credentials: 'include' }),
        fetch('/api/user/active-budget', { credentials: 'include' }),
        fetch('/api/account/financial-tools', { credentials: 'include' })
      ]);
      
      if (!profileRes.ok || !toolsRes.ok) {
        throw new Error('Authentication check failed.');
      }

      setUser(await profileRes.json());
      setFinancialTools(await toolsRes.json());

      if (activeBudgetRes.ok) {
        const budgetData = await activeBudgetRes.json();
        if (budgetData) {
          setActiveBudget(budgetData);
        }
      }
      
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  // --- 2. The useEffect hook now simply CALLS the function ---
  useEffect(() => {
    fetchInitialData();
  }, []);


  if (loadingUser) {
    return <div className="text-center p-8 text-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // --- 3. Now the function can be correctly passed in the context ---
  const contextData = { user, activeBudget, financialTools, refreshData: fetchInitialData };

  return (
    <AuthenticatedLayout activeBudget={activeBudget}>
      <Outlet context={contextData} />
    </AuthenticatedLayout>
  );
}

function App() {
  // App.jsx no longer holds any state. It's just a router.
  return (
    <div className="bg-gray-900 min-h-screen">
      <BrowserRouter>
        <Toaster position="top-center" toastOptions={{ style: { background: '#374151', color: '#fff' } }} />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-login" element={<VerificationPage />} />
          <Route path="/verify-email-change/:token" element={<EmailChangeVerificationPage />} />

          {/* Protected Routes */}
          {/* The ProtectedRoute component now handles everything internally */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* The 'user' prop is no longer needed here as it will be handled internally */}
            <Route path="/wizard" element={<GuidedWizard />} />
            <Route path="/budget/:budgetId" element={<BudgetPage />} />
            <Route path="/review/:budgetId" element={<BudgetReviewPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;