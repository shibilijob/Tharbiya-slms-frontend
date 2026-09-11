import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { authService } from '../services/authService';
import { api } from '../lib/axios';
import { clearAppStorage } from '../utils/storageCleanup';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  syncSessionUser: (sessionUser: any) => User;
  login: (role: UserRole, identifier: string, password?: string) => Promise<User>;
  loginWithGoogle: (role: UserRole) => Promise<void>;
  switchRole: (role: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  refreshFacultyProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: authService.getCurrentUser(),
  role: authService.getCurrentUser()?.role || null,
  isAuthenticated: !!authService.getCurrentUser(),
  isLoading: true,

  setUser: (user: User | null) => {
    set({
      user,
      role: user ? user.role : null,
      isAuthenticated: !!user,
    });
  },

  setIsLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  syncSessionUser: (sessionUser: any) => {
    const synced = authService.syncSessionUser(sessionUser);
    set({
      user: synced,
      role: synced.role,
      isAuthenticated: true,
      isLoading: false,
    });
    return synced;
  },

  login: async (role: UserRole, identifier: string, password?: string) => {
    set({ isLoading: true });
    try {
      const loggedUser = await authService.login(role, identifier, password);
      set({
        user: loggedUser,
        role: loggedUser.role,
        isAuthenticated: true,
        isLoading: false,
      });
      return loggedUser;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  loginWithGoogle: async (role: UserRole) => {
    set({ isLoading: true });
    try {
      await authService.loginWithGoogle(role);
    } finally {
      set({ isLoading: false });
    }
  },

  switchRole: async (role: UserRole) => {
    set({ isLoading: true });
    try {
      const switched = await authService.switchRole(role);
      set({
        user: switched,
        role: switched.role,
        isAuthenticated: true,
        isLoading: false,
      });
      return switched;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      clearAppStorage();
      set({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  refreshFacultyProfile: async () => {
    const current = get().user;
    if (!current || (current.role !== 'MUALLIM' && current.role !== 'SADHR_MUALLIM')) {
      return;
    }

    try {
      const res = await api.get<any>('/faculty-members');
      const teachers = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (Array.isArray(teachers) && teachers.length > 0) {
        const matched = teachers.find((t: any) =>
          (current.id && (t.id === current.id || t._id === current.id)) ||
          (current.email && t.email && t.email.toLowerCase() === current.email.toLowerCase()) ||
          (current.phone && t.phone && t.phone === current.phone) ||
          (current.name && t.name && (
            t.name.toLowerCase() === current.name.toLowerCase() ||
            t.name.toLowerCase().includes(current.name.toLowerCase()) ||
            current.name.toLowerCase().includes(t.name.toLowerCase())
          ))
        );

        if (matched && Array.isArray(matched.assignedClasses)) {
          const updatedUser = {
            ...current,
            id: matched.id || current.id,
            assignedClasses: matched.assignedClasses.map((c: any) => String(c).replace(/^Class\s*/i, '').trim()),
            name: matched.name || current.name
          };
          set({
            user: updatedUser as any,
            role: updatedUser.role,
            isAuthenticated: true,
          });
          localStorage.setItem('tharbiyah_auth_user', JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      console.warn('Failed to refresh faculty profile:', err);
    }
  },
}));
