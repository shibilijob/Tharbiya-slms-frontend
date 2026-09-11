import type { User, UserRole, ParentUser, MuallimUser, SadhrMuallimUser } from '../types';
import { CURRENT_MADRASA_NAME } from '../data/mockData';
import { authClient } from '../lib/auth-client';
import { api } from '../lib/axios';
import { clearAppStorage } from '../utils/storageCleanup';

const AUTH_USER_KEY = 'tharbiyah_auth_user';

const normalizeRole = (rawRole: any): UserRole => {
  if (rawRole === 'SADHR_MUALLIM' || rawRole === 'ADMIN') return 'SADHR_MUALLIM';
  if (rawRole === 'MUALLIM' || rawRole === 'TEACHER') return 'MUALLIM';
  return 'PARENT';
};

export const mapBetterAuthUserToAppUser = (authUser: any, targetRole?: UserRole): User => {
  const role: UserRole = normalizeRole(authUser.role || targetRole);

  let assignedClasses: string[] = [];
  let studentIds: string[] = [];

  if (Array.isArray(authUser.assignedClasses)) {
    assignedClasses = authUser.assignedClasses.map((c: any) => String(c).replace(/^Class\s*/i, '').trim());
  } else if (typeof authUser.assignedClasses === 'string') {
    try {
      const parsed = authUser.assignedClasses.startsWith('[')
        ? JSON.parse(authUser.assignedClasses)
        : [authUser.assignedClasses.trim()];
      assignedClasses = (Array.isArray(parsed) ? parsed : [parsed]).map((c: any) => String(c).replace(/^Class\s*/i, '').trim());
    } catch {
      assignedClasses = authUser.assignedClasses.trim() ? [authUser.assignedClasses.trim().replace(/^Class\s*/i, '')] : [];
    }
  } else if (authUser.assignedClass) {
    if (Array.isArray(authUser.assignedClass)) {
      assignedClasses = authUser.assignedClass.map((c: any) => String(c).replace(/^Class\s*/i, '').trim());
    } else {
      assignedClasses = [String(authUser.assignedClass).replace(/^Class\s*/i, '').trim()];
    }
  }

  if (Array.isArray(authUser.studentIds)) {
    studentIds = authUser.studentIds;
  } else if (typeof authUser.studentIds === 'string') {
    try {
      studentIds = authUser.studentIds.startsWith('[')
        ? JSON.parse(authUser.studentIds)
        : [authUser.studentIds.trim()];
    } catch {
      studentIds = [];
    }
  }

  if (role === 'PARENT') {
    const parent: ParentUser = {
      id: authUser.id || authUser._id || '',
      name: authUser.name,
      role: 'PARENT',
      email: authUser.email,
      phone: authUser.phone || authUser.username,
      avatar: authUser.image || authUser.avatar || '',
      madrasaName: authUser.madrasaName || CURRENT_MADRASA_NAME,
      studentIds,
    };
    return parent;
  }

  if (role === 'MUALLIM') {
    const muallim: MuallimUser = {
      id: authUser.id || authUser._id || '',
      name: authUser.name || 'Usthad',
      role: 'MUALLIM',
      email: authUser.email,
      phone: authUser.phone || authUser.username,
      avatar: authUser.image || authUser.avatar || '',
      madrasaName: authUser.madrasaName || CURRENT_MADRASA_NAME,
      assignedClasses,
      designation: authUser.designation || 'Usthad & Class Mentor',
    };
    return muallim;
  }

  const sadhr: SadhrMuallimUser = {
    id: authUser.id || authUser._id || '',
    name: authUser.name || 'Usthad',
    role: 'SADHR_MUALLIM',
    email: authUser.email,
    phone: authUser.phone || authUser.username,
    avatar: authUser.image || authUser.avatar || '',
    madrasaName: authUser.madrasaName || CURRENT_MADRASA_NAME,
    designation: authUser.designation || 'Sadhr Muallim (Sadhr Mudarris)',
    assignedClasses,
  };
  return sadhr;
};

export const authService = {
  getCurrentUser(): User | null {
    const data = localStorage.getItem(AUTH_USER_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse auth user", e);
      }
    }
    return null;
  },

  syncSessionUser(authUser: any, fallbackRole?: UserRole): User {
    const savedRole = (sessionStorage.getItem('pending_oauth_role') as UserRole) || fallbackRole;
    const appUser = mapBetterAuthUserToAppUser(authUser, savedRole);
    const token = `sess_${appUser.id}_${Date.now()}`;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(appUser));
    if (!localStorage.getItem('tharbiyah_auth_token')) {
      localStorage.setItem('tharbiyah_auth_token', token);
      localStorage.setItem('token', token);
    }
    sessionStorage.removeItem('pending_oauth_role');
    return appUser;
  },

  async login(role: UserRole, identifier: string, password?: string): Promise<User> {
    const pwd = password || '';

    if (!identifier.trim()) {
      throw new Error('Please enter your phone number or email.');
    }
    if (!pwd.trim()) {
      throw new Error('Please enter your password.');
    }

    try {
      // Primary Backend Auth API (Connects to MongoDB and verifies credentials)
      const apiRes: any = await api.post('/auth/login', {
        identifier: identifier.trim(),
        email: identifier.trim().toLowerCase(),
        phone: identifier.trim(),
        password: pwd,
        role,
      });

      const userObj = apiRes?.user || apiRes?.data?.user || (apiRes?.id ? apiRes : null) || (apiRes?.data?.id ? apiRes.data : null);
      if (userObj && (userObj.id || userObj._id || userObj.name)) {
        const appUser = mapBetterAuthUserToAppUser(userObj, role);
        const token =
          apiRes?.token ||
          apiRes?.session?.token ||
          apiRes?.data?.token ||
          apiRes?.data?.session?.token ||
          `sess_${userObj.id || userObj._id}_${Date.now()}`;

        localStorage.setItem('tharbiyah_auth_token', token);
        localStorage.setItem('token', token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(appUser));
        return appUser;
      }
      throw new Error('Login failed: Invalid server response');
    } catch (apiErr: any) {
      const errMsg =
        apiErr?.response?.data?.message ||
        apiErr?.data?.message ||
        apiErr?.message ||
        'Invalid username or password. Please verify your credentials.';
      throw new Error(errMsg);
    }
  },

  async switchRole(role: UserRole): Promise<User> {
    try {
      const facRes = await api.get<any>('/faculty-members');
      const teachers = Array.isArray(facRes.data) ? facRes.data : (facRes.data?.data || []);
      if (Array.isArray(teachers) && teachers.length > 0) {
        let matched = teachers.find((t: any) =>
          role === 'SADHR_MUALLIM' ? (t.role === 'SADHR_MUALLIM' || t.designation?.toLowerCase().includes('sadhr')) : (t.role === 'MUALLIM')
        );
        if (!matched) matched = teachers[0];

        if (matched) {
          const appUser = mapBetterAuthUserToAppUser(matched, role);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(appUser));
          return appUser;
        }
      }
    } catch (err) {
      console.warn("Failed to fetch faculty for switchRole", err);
    }

    if (role === 'PARENT') {
      throw new Error('Parent role switching requires an authenticated parent login.');
    }

    throw new Error('Role switching requires an authenticated user from the database.');
  },

  async loginWithGoogle(role: UserRole): Promise<void> {
    const redirectPath = role === 'SADHR_MUALLIM' ? '/admin/dashboard' : role === 'PARENT' ? '/parent/dashboard' : '/teacher/dashboard';
    const callbackURL = `${window.location.origin}${redirectPath}`;
    
    // Save intended portal role in session storage for after OAuth callback
    sessionStorage.setItem('pending_oauth_role', role);

    const result = await authClient.signIn.social({
      provider: 'google',
      callbackURL,
    });

    if (result?.error) {
      sessionStorage.removeItem('pending_oauth_role');
      throw new Error(result.error.message || 'Google sign-in initiation failed.');
    }
  },

  async logout(): Promise<void> {
    try {
      await authClient.signOut();
    } catch (e) {
      console.warn("Better Auth sign out:", e);
    } finally {
      clearAppStorage();
    }
  },

  async verifyMuallim(email: string): Promise<{
    name: string;
    email: string;
    phone: string;
    designation?: string;
    role: string;
  }> {
    const res: any = await api.post('/auth/verify-muallim', { email: email.trim().toLowerCase() });
    return res.data || res;
  },

  async sendMuallimResetEmail(email: string): Promise<{ success: boolean; message: string; email: string; name: string }> {
    const res: any = await api.post('/auth/forgot-password/muallim', { email: email.trim().toLowerCase() });
    return res;
  },

  async resetPasswordWithToken(data: { token?: string; email?: string; newPassword: string; confirmPassword?: string }): Promise<any> {
    const res: any = await api.post('/auth/reset-password-token', data);
    return res;
  },

  async resetMuallimPassword(email: string, newPassword: string, confirmPassword?: string): Promise<any> {
    const res: any = await api.post('/auth/reset-password/muallim', {
      email: email.trim().toLowerCase(),
      newPassword,
      confirmPassword: confirmPassword || newPassword,
    });
    return res;
  }
};
