import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { currentUser, isAdmin, loading, userProfile } = useAuth();

  if (loading || (currentUser && !userProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" state={{ message: "Please log in to access admin panel" }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ message: "Access denied. Admin privileges required." }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
