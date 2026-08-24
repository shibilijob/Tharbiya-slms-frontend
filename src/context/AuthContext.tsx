import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { authService } from '../services/authService';
import { useSession } from '../lib/auth-client';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (role: UserRole, identifier: string, password?: string) => Promise<User>;
  loginWithGoogle: (role: UserRole) => Promise<User>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (session?.user) {
      const current = authService.getCurrentUser();
      if (current) {
        setUser(current);
      }
    } else {
      const current = authService.getCurrentUser();
      setUser(current);
    }
    setIsLoading(isPending);
  }, [session, isPending]);

  const login = async (role: UserRole, identifier: string, password?: string) => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.login(role, identifier, password);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.loginWithGoogle(role);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const switched = await authService.switchRole(role);
      setUser(switched);
      return switched;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        isAuthenticated: !!user,
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
