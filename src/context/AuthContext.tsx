import React, { createContext, useContext, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { useSession } from '../lib/auth-client';
import { useAuthStore } from '../stores/authStore';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (role: UserRole, identifier: string, password?: string) => Promise<User>;
  loginWithGoogle: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const logout = useAuthStore((state) => state.logout);
  const switchRole = useAuthStore((state) => state.switchRole);
  const syncSessionUser = useAuthStore((state) => state.syncSessionUser);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);
  const refreshFacultyProfile = useAuthStore((state) => state.refreshFacultyProfile);

  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (session?.user) {
      if (!user || (user.email && session.user.email && user.email !== session.user.email)) {
        syncSessionUser(session.user);
      }
    }
    setIsLoading(isPending);
  }, [session, isPending]);

  // Sync faculty profile from live MongoDB data on startup
  useEffect(() => {
    refreshFacultyProfile();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
