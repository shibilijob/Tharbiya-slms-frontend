import type { User, UserRole, ParentUser, MuallimUser, SadhrMuallimUser } from '../types';
import { CURRENT_MADRASA_NAME } from '../data/mockData';
import { authClient } from '../lib/auth-client';
import { api } from '../lib/axios';

const AUTH_USER_KEY = 'tharbiyah_auth_user';

const normalizeRole = (rawRole: any): UserRole => {
  if (rawRole === 'SADHR_MUALLIM' || rawRole === 'ADMIN') return 'SADHR_MUALLIM';
  if (rawRole === 'MUALLIM' || rawRole === 'TEACHER') return 'MUALLIM';
  return 'PARENT';
};

const mapBetterAuthUserToAppUser = (authUser: any, targetRole?: UserRole): User => {
  const role: UserRole = normalizeRole(authUser.role || targetRole);

  let assignedClasses: string[] = [];
  let assignedSubjects: string[] = [];
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

  if (Array.isArray(authUser.assignedSubjects)) {
    assignedSubjects = authUser.assignedSubjects;
  } else if (typeof authUser.assignedSubjects === 'string') {
    try {
      assignedSubjects = authUser.assignedSubjects.startsWith('[')
        ? JSON.parse(authUser.assignedSubjects)
        : [authUser.assignedSubjects.trim()];
    } catch {
      assignedSubjects = authUser.assignedSubjects.trim() ? [authUser.assignedSubjects.trim()] : [];
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
      id: authUser.id || 'parent-1',
      name: authUser.name,
      role: 'PARENT',
      email: authUser.email,
      phone: authUser.phone || authUser.username,
      avatar: authUser.image || authUser.avatar || '',
      madrasaName: authUser.madrasaName || CURRENT_MADRASA_NAME,
      studentIds: studentIds.length > 0 ? studentIds : ['no students'],
    };
    return parent;
  }

  if (role === 'MUALLIM') {
    const muallim: MuallimUser = {
      id: authUser.id || 'muallim-1',
      name: authUser.name || 'Usthad',
      role: 'MUALLIM',
      email: authUser.email,
      phone: authUser.phone || authUser.username,
      avatar: authUser.image || authUser.avatar || '',
      madrasaName: authUser.madrasaName || CURRENT_MADRASA_NAME,
      assignedClasses,
      assignedSubjects: assignedSubjects.length > 0 ? assignedSubjects : ['Quran'],
      designation: authUser.designation || 'Usthad & Class Mentor',
    };
    return muallim;
  }

  const sadhr: SadhrMuallimUser = {
    id: authUser.id || 'sadhr-1',
    name: authUser.name || 'Usthad Shihabudheen Saadi',
    role: 'SADHR_MUALLIM',
    email: authUser.email,
    phone: authUser.phone || authUser.username,
    avatar: authUser.image || authUser.avatar || '',
    madrasaName: authUser.madrasaName || CURRENT_MADRASA_NAME,
    designation: authUser.designation || 'Sadhr Muallim (Sadhr Mudarris)',
    assignedClasses: assignedClasses.length > 0 ? assignedClasses : ['7', '6'],
    assignedSubjects: assignedSubjects.length > 0 ? assignedSubjects : ['Fiqh', 'Quran', 'Islamic Studies'],
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

    const user: User = role === 'SADHR_MUALLIM'
      ? {
        id: 'sadhr-1',
        name: 'Usthad Shihabudheen Saadi',
        role: 'SADHR_MUALLIM',
        email: 'shihab@yopmail.com',
        phone: '0000000001',
        designation: 'Sadhr Muallim (Sadhr Mudarris)',
        assignedClasses: ['1', '8', '12'],
        assignedSubjects: ['Fiqh', 'Quran'],
        madrasaName: CURRENT_MADRASA_NAME
      } as SadhrMuallimUser
      : role === 'MUALLIM'
        ? {
          id: 'muallim-1',
          name: 'Usthad Shibili Ahsani',
          role: 'MUALLIM',
          email: 'shibili@yopmail.com',
          phone: '0000000003',
          designation: 'Usthad & Class Mentor',
          assignedClasses: ['4', '6', '10'],
          assignedSubjects: ['Quran', 'Hifz', 'Tajweed'],
          madrasaName: CURRENT_MADRASA_NAME
        } as MuallimUser
        : {
          id: 'parent-1',
          name: 'Parent User',
          role: 'PARENT',
          email: 'parent@gmail.com',
          phone: '9847123456',
          studentIds: [],
          madrasaName: CURRENT_MADRASA_NAME
        } as ParentUser;

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    return user;
  },

  async loginWithGoogle(role: UserRole): Promise<User> {
    try {
      const callbackURL = role === 'SADHR_MUALLIM' ? '/admin/dashboard' : '/teacher/dashboard';
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL,
      });

      const resData = result?.data as any;
      if (resData?.user) {
        const appUser = mapBetterAuthUserToAppUser(resData.user, role);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(appUser));
        return appUser;
      }
    } catch (err: any) {
      console.warn("Better Auth Google login attempt:", err?.message || err);
    }

    return this.switchRole(role);
  },

  async logout(): Promise<void> {
    try {
      await authClient.signOut();
    } catch (e) {
      console.warn("Better Auth sign out:", e);
    }
    localStorage.removeItem(AUTH_USER_KEY);
  }
};
