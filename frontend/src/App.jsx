import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// We'll move the data fetching logic into this component
import AuthenticatedLayout from './components/AuthenticatedLayout';
import AccountPage from './pages/AccountPage';
import LandingPage from './pages/LandingPage';
import VerificationPage from './pages/VerificationPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './pages/BudgetPage';
import BudgetReviewPage from './pages/BudgetReviewPage';
import { GuidedWizard } from './components/wizard/GuidedWizard';
import EmailChangeVerificationPage from './pages/EmailChangeVerificationPage';
import RegisterPage from './pages/RegisterPage';


function ProtectedRoute() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeBudget, setActiveBudget] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isNewUser, setIsNewUser] = useState(false);


  const location = useLocation();
  const navigate = useNavigate();

  const fetchInitialData = async (newBudgetId = null, isSilent = false) => {
    if (!isSilent) {
      setLoadingUser(true);
    }
    try {
      // 1. Fetch all data just as before
      const [profileRes, cyclesRes, accountsRes, activeBudgetRes] = await Promise.all([
        fetch('/api/user/profile', { credentials: 'include' }),
        fetch('/api/budget/cycles', { credentials: 'include' }),
        fetch('/api/user-accounts', { credentials: 'include' }),
        fetch('/api/user/active-budget', { credentials: 'include' })
      ]);

      if (!profileRes.ok || !cyclesRes.ok || !accountsRes.ok) {
        throw new Error('Authentication check failed.');
      }

      // 2. Parse all data
      const userData = await profileRes.json();
      const cyclesData = await cyclesRes.json();
      const accountsData = await accountsRes.json();
      let activeBudgetData = null;
      if (activeBudgetRes.ok) {
        activeBudgetData = await activeBudgetRes.json();
      }

      // 3. Set all state for the global layout
      setUser(userData);
      setAccounts(accountsData);
      setIsNewUser(cyclesData.length === 0);
      if (activeBudgetData) {
        setActiveBudget(activeBudgetData);
      }

      if (newBudgetId) {
        navigate(`/budget/${newBudgetId}`);
      }

      // 4. *** THIS IS THE KEY CHANGE ***
      // Return the fresh data so child components can use it immediately.
      return {
        user: userData,
        accounts: accountsData,
        activeBudget: activeBudgetData
      };

    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      setUser(null);
    } finally {
      if (!isSilent) {
        setLoadingUser(false);
      }
    }
  };

  useEffect(() => { fetchInitialData(); }, []);

  if (loadingUser) {
    return <div className="text-center p-8 text-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (isNewUser && location.pathname !== '/wizard') {
    return <Navigate to="/wizard" replace />;
  }

  // Pass down the modified refresh function
  const contextData = { user, activeBudget, accounts, refreshData: fetchInitialData };
  return (
    <AuthenticatedLayout activeBudget={activeBudget}>
      <Outlet context={contextData} />
    </AuthenticatedLayout>
  );
}

function App() {
  const isStaging = window.location.hostname.includes('staging');
  
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

      {isStaging && (
        <div style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          width: '100%',
          backgroundColor: 'rgba(234, 179, 8, 0.9)', // Yellow color with opacity
          color: 'black',
          textAlign: 'center',
          padding: '8px',
          fontWeight: 'bold',
          fontSize: '1rem',
          zIndex: 9999, // Ensures it's on top of all other content
          boxShadow: '0 -2px 10px rgba(0,0,0,0.5)',
          textTransform: 'uppercase',
        }}>
          🚧 Staging Environment 🚧
        </div>
      )}
    </div>
  );
}

export default App;