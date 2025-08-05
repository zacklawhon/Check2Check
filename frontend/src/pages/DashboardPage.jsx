import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BudgetList from '../components/BudgetList';
// FIX: Add the missing import for the GuidedWizard component
import GuidedWizard from '../components/wizard/GuidedWizard';

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [budgetCycles, setBudgetCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [profileRes, cyclesRes] = await Promise.all([
            fetch('/api/user/profile', { credentials: 'include' }),
            fetch('/api/budget/cycles', { credentials: 'include' })
        ]);
        if (profileRes.status === 401) { navigate('/'); return; }
        if (!profileRes.ok || !cyclesRes.ok) throw new Error('Failed to load dashboard data.');
        
        setUser(await profileRes.json());
        setBudgetCycles(await cyclesRes.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => { fetchDashboardData(); }, []);

  if (loading) return <div className="text-white p-8 text-center">Loading...</div>;
  if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;
  if (!user) return <div className="text-red-500 p-8 text-center">Could not find user profile.</div>;

  // This logic correctly sends a new user to the wizard
  if (budgetCycles.length === 0) {
      return <GuidedWizard user={user} />;
  }
  
  return (
    <div className="container mx-auto p-4 md:p-8 text-white">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Budgets</h1>
        <BudgetList budgetCycles={budgetCycles} onRefresh={fetchDashboardData} />
    </div>
  );
}
export default DashboardPage;