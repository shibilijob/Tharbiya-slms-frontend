import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F2] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#DDEDE5] border-t-[#0F6B50] rounded-full animate-spin" />
        <p className="mt-3 text-xs font-semibold text-[#0F6B50]">Loading portal...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    const searchParams = new URLSearchParams();
    if (allowedRoles && allowedRoles.length === 1) {
      searchParams.set('role', allowedRoles[0]);
    }
    const loginUrl = searchParams.toString() ? `/login?${searchParams.toString()}` : '/login';
    return <Navigate to={loginUrl} state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role mismatch: redirect to user's assigned dashboard
    if (user.role === 'SADHR_MUALLIM') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'MUALLIM') return <Navigate to="/teacher/dashboard" replace />;
    return <Navigate to="/parent/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
