import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// We'll move the data fetching logic into this component
import { ContentProvider } from './contexts/ContentContext';
import WhatsNewModal from './components/common/WhatsNewModal';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import AccountPage from './pages/AccountPage';
import LandingPage from './pages/LandingPage';
import VerificationPage from './pages/VerificationPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './pages/BudgetPage';
import BudgetReviewPage from './pages/BudgetReviewPage';
import GoalsPage from './pages/GoalsPage';
import { GuidedWizard } from './components/wizard/GuidedWizard';
import EmailChangeVerificationPage from './pages/EmailChangeVerificationPage';
import RegisterPage from './pages/RegisterPage';
import Footer from './components/common/Footer'; 


function ProtectedRoute() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeBudget, setActiveBudget] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // 2. Add state for the new content and announcement system
  const [helpContent, setHelpContent] = useState(null);
  const [announcement, setAnnouncement] = useState(null);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const fetchInitialData = async (newBudgetId = null, isSilent = false) => {
    if (!isSilent) setLoadingUser(true);
    try {
      // 3. Add content and announcement fetches to the initial data load
      const [profileRes, cyclesRes, accountsRes, activeBudgetRes, contentRes, announcementRes] = await Promise.all([
        fetch('/api/user/profile', { credentials: 'include' }),
        fetch('/api/budget/cycles', { credentials: 'include' }),
        fetch('/api/user-accounts', { credentials: 'include' }),
        fetch('/api/user/active-budget', { credentials: 'include' }),
        fetch('/api/content/all', { credentials: 'include' }),
        fetch('/api/content/latest-announcement', { credentials: 'include' })
      ]);

      if (!profileRes.ok || !cyclesRes.ok || !accountsRes.ok || !contentRes.ok) {
        throw new Error('Authentication check failed.');
      }

      // Parse all data
      const userData = await profileRes.json();
      const cyclesData = await cyclesRes.json();
      const accountsData = await accountsRes.json();
      setHelpContent(await contentRes.json()); // Set help content

      // Check for and set announcement
      if (announcementRes.ok) {
        const announcementData = await announcementRes.json();
        if (announcementData) {
          setAnnouncement(announcementData);
          setIsWhatsNewOpen(true);
        }
      }
      
      let activeBudgetData = null;
      if (activeBudgetRes.ok) activeBudgetData = await activeBudgetRes.json();

      setUser(userData);
      setAccounts(accountsData);
      setIsNewUser(cyclesData.length === 0);
      if (activeBudgetData) setActiveBudget(activeBudgetData);
      if (newBudgetId) navigate(`/budget/${newBudgetId}`);

      return { user: userData, accounts: accountsData, activeBudget: activeBudgetData };
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      setUser(null);
    } finally {
      if (!isSilent) setLoadingUser(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, []);

  // 4. Create handler to mark announcement as seen
  const handleCloseWhatsNew = async () => {
      if (announcement) {
          try {
              await fetch('/api/content/mark-as-seen', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({ content_id: announcement.id })
              });
          } catch (err) {
              console.error("Failed to mark announcement as seen:", err);
          }
      }
      setIsWhatsNewOpen(false);
  };

  if (loadingUser) return <div className="text-center p-8 text-white">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (isNewUser && location.pathname !== '/wizard') return <Navigate to="/wizard" replace />;

  const contextData = { user, activeBudget, accounts, refreshData: fetchInitialData };

  return (
    // 5. Wrap the entire authenticated layout in the ContentProvider
    <ContentProvider content={helpContent}>
        <AuthenticatedLayout activeBudget={activeBudget}>
            <Outlet context={contextData} />
            <WhatsNewModal 
                isOpen={isWhatsNewOpen}
                onClose={handleCloseWhatsNew}
                announcement={announcement}
            />
        </AuthenticatedLayout>
    </ContentProvider>
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
            <Route path="/goals" element={<GoalsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
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