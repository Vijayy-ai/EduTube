import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // If still loading auth state, show loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Save the current location to redirect back after login
    localStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected component
  return children;
};

export default PrivateRoute;