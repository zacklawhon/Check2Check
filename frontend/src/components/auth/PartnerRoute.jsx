import React from 'react';
import { useOutletContext, Navigate, Outlet } from 'react-router-dom';

function PartnerRoute() {
  // 1. Receive the full context from the parent route (ProtectedRoute)
  const context = useOutletContext(); 

  // The user object is inside the context we just received
  const { user } = context;

  if (!user) {
    return <div>Loading...</div>; 
  }

  // If the user is a partner, redirect them.
  if (user.owner_user_id) {
    return <Navigate to="/dashboard" replace />;
  }

  // 2. If the user is an owner, pass the context down to the child route (AccountPage)
  return <Outlet context={context} />;
}

export default PartnerRoute;