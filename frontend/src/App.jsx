import React, { useState, useEffect } from 'react';
import * as api from './utils/api';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// We'll move the data fetching logic into this component
import { ContentProvider } from './contexts/ContentContext';
import WhatsNewModal from './components/common/WhatsNewModal';
import AuthenticatedLayout from './components/AuthenticatedLayout';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';
import VerificationPage from './pages/VerificationPage';
import DashboardPage from './pages/DashboardPage';
import BudgetPage from './pages/BudgetPage';
import BudgetReviewPage from './pages/BudgetReviewPage';
import GoalsPage from './pages/GoalsPage';
import { GuidedWizard } from './components/wizard/GuidedWizard';
import EmailChangeVerificationPage from './pages/EmailChangeVerificationPage';
import RegisterPage from './pages/RegisterPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import PartnerRoute from './components/auth/PartnerRoute';
import Footer from './components/common/Footer';


function ProtectedRoute() {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeBudget, setActiveBudget] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isNewUser, setIsNewUser] = useState(false);
  const [helpContent, setHelpContent] = useState(null);
  const [announcement, setAnnouncement] = useState(null);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const fetchInitialData = async (newBudgetId = null, isSilent = false) => {
    if (!isSilent) setLoadingUser(true);
    setAuthError(false);
    try {
      const [user, cyclesData, accountsData, activeBudgetData, contentData, announcementData] = await Promise.all([
        api.getProfile(),
        api.getCycles(),
        api.getUserAccounts(),
        api.getActiveBudget(),
        api.getAllContent(),
        api.getLatestAnnouncement()
      ]);

      if (activeBudgetData) {
        activeBudgetData.user = user;
      }

      setUser(user);
      setAccounts(accountsData);
      setIsNewUser(cyclesData.length === 0);
      setActiveBudget(activeBudgetData);
      setHelpContent(contentData);

      if (announcementData) {
        setAnnouncement(announcementData);
        setIsWhatsNewOpen(true);
      }

      if (newBudgetId) navigate(`/budget/${newBudgetId}`);

    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      setAuthError(true);
    } finally {
      if (!isSilent) setLoadingUser(false);
    }
  };

  useEffect(() => { fetchInitialData(); }, []);

  const handleCloseWhatsNew = async () => {
    if (announcement) {
      try {
        await api.markAnnouncementSeen(announcement.id);
      } catch (err) {
        console.error("Failed to mark announcement as seen:", err);
      }
    }
    setIsWhatsNewOpen(false);
  };

  useEffect(() => {
    // Redirect to landing page if not authenticated and not loading
    if (!loadingUser && !user && !authError) {
      navigate('/');
    }
  }, [loadingUser, user, authError, navigate]);

  if (loadingUser) {
    return <div>Loading...</div>;
  }

  if (authError) {
    return (
      <div className="text-center p-8 text-white">
        <h1 className="text-2xl font-bold text-red-400">Connection Error</h1>
        <p className="mt-2 text-gray-300">Could not connect to the server. Please check your internet connection and try again.</p>
        <button
          onClick={() => fetchInitialData()}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  const contextData = { user, activeBudget, accounts, refreshData: fetchInitialData };

  return (
    <ContentProvider content={helpContent}>
      <AuthenticatedLayout activeBudget={activeBudget} user={user}>
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
          {/* Public Routes (for non-logged-in users) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-login" element={<VerificationPage />} />
          <Route path="/verify-email-change/:token" element={<EmailChangeVerificationPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />

          {/* --- Protected Routes (for all logged-in users) --- */}
          <Route element={<ProtectedRoute />}>

            {/* Routes accessible by BOTH Owners and Partners */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wizard" element={<GuidedWizard />} />
            <Route path="/budget/:budgetId" element={<BudgetPage />} />
            <Route path="/review/:budgetId" element={<BudgetReviewPage />} />
            <Route path="/goals" element={<GoalsPage />} />

            {/* Routes accessible ONLY by Owners */}
            <Route element={<PartnerRoute />}>
              <Route path="/settings" element={<SettingsPage />} />
              {/* You can add other owner-only routes here, like '/admin' */}
            </Route>

          </Route>

          {/* Catch-all for any other URL */}
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