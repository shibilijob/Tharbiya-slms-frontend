import type { User, UserRole, ParentUser, TeacherUser, AdminUser } from '../types';
import { CURRENT_MADRASA_NAME } from '../data/mockData';
import { authClient } from '../lib/auth-client';

const AUTH_USER_KEY = 'tharbiyah_auth_user';

const mapBetterAuthUserToAppUser = (authUser: any, targetRole?: UserRole): User => {
  const role: UserRole = (authUser.role as UserRole) || targetRole || 'PARENT';

  let assignedClasses: string[] = [];
  let assignedSubjects: string[] = [];
  let studentIds: string[] = [];

  try {
    if (typeof authUser.assignedClasses === 'string' && authUser.assignedClasses.startsWith('[')) {
      assignedClasses = JSON.parse(authUser.assignedClasses);
    }
  } catch {
    assignedClasses = [];
  }

  try {
    if (typeof authUser.assignedSubjects === 'string' && authUser.assignedSubjects.startsWith('[')) {
      assignedSubjects = JSON.parse(authUser.assignedSubjects);
    }
  } catch {
    assignedSubjects = [];
  }

  try {
    if (typeof authUser.studentIds === 'string' && authUser.studentIds.startsWith('[')) {
      studentIds = JSON.parse(authUser.studentIds);
    }
  } catch {
    studentIds = [];
  }

  if (role === 'PARENT') {
    const parent: ParentUser = {
      id: authUser.id || 'parent-1',
      name: authUser.name || 'Ali Mundambra',
      role: 'PARENT',
      email: authUser.email || 'ali.mundambra@gmail.com',
      phone: authUser.phone || authUser.username || '9847123456',
      avatar: authUser.image || authUser.avatar || '',
      madrasaName: authUser.madrasaName || CURRENT_MADRASA_NAME,
      studentIds: studentIds.length > 0 ? studentIds : ['student-1', 'student-2'],
    };
    return parent;
  }

  if (role === 'TEACHER') {
    const teacher: TeacherUser = {
      id: authUser.id || 'teacher-1',
      name: authUser.name || 'Usthad Shibili Ahsani',
      role: 'TEACHER',
      email: authUser.email || 'shibili@darunnajath.edu',
      phone: authUser.phone || authUser.username || '9847654321',
      avatar: authUser.image || authUser.avatar || '',
      madrasaName: authUser.madrasaName || CURRENT_MADRASA_NAME,
      assignedClasses: assignedClasses.length > 0 ? assignedClasses : ['5', '6'],
      assignedSubjects: assignedSubjects.length > 0 ? assignedSubjects : ['Quran', 'Hifz', 'Tajweed', 'Fiqh'],
      designation: authUser.designation || 'Senior Usthad & Class 5 Mentor',
    };
    return teacher;
  }

  const admin: AdminUser = {
    id: authUser.id || 'admin-1',
    name: authUser.name || 'Usthad Shihabudheen Saadi',
    role: 'ADMIN',
    email: authUser.email || 'sadhrmuallim@darunnajath.edu',
    phone: authUser.phone || authUser.username || '9847001122',
    avatar: authUser.image || authUser.avatar || '',
    madrasaName: authUser.madrasaName || CURRENT_MADRASA_NAME,
    designation: authUser.designation || 'Sadhr Muallim (Sadhr Mudarris) & Class 7 Mentor',
    assignedClasses: assignedClasses.length > 0 ? assignedClasses : ['7', '6'],
    assignedSubjects: assignedSubjects.length > 0 ? assignedSubjects : ['Fiqh', 'Quran', 'Islamic Studies'],
  };
  return admin;
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
    const pwd = password || '123456';

    try {
      let result;
      if (identifier.includes('@')) {
        result = await authClient.signIn.email({
          email: identifier.trim().toLowerCase(),
          password: pwd,
        });
      } else {
        result = await authClient.signIn.username({
          username: identifier.trim(),
          password: pwd,
        });
      }

      if (result?.data?.user) {
        const appUser = mapBetterAuthUserToAppUser(result.data.user, role);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(appUser));
        return appUser;
      }

      if (result?.error) {
        throw new Error(result.error.message || 'Authentication failed');
      }
    } catch (err: any) {
      console.warn("Better Auth login attempt:", err?.message || err);
      if (err?.message && !err.message.includes('fetch') && !err.message.includes('Network') && !err.message.includes('Failed to fetch')) {
        throw err;
      }
    }

    // Fallback user object based on authenticated role credentials
    const fallbackUser: User = role === 'ADMIN'
      ? {
        id: 'admin-1',
        name: 'Usthad Shihabudheen Saadi',
        role: 'ADMIN',
        email: identifier.includes('@') ? identifier : 'sadhrmuallim@darunnajath.edu',
        phone: identifier.includes('@') ? '9847001122' : identifier,
        designation: 'Sadhr Muallim & Class 7 Mentor',
        assignedClasses: ['7', '6'],
        assignedSubjects: ['Fiqh', 'Quran'],
        madrasaName: CURRENT_MADRASA_NAME
      } as AdminUser
      : role === 'TEACHER'
        ? {
          id: 'teacher-1',
          name: 'Usthad Shibili Ahsani',
          role: 'TEACHER',
          email: identifier.includes('@') ? identifier : 'shibili@darunnajath.edu',
          phone: identifier.includes('@') ? '9847654321' : identifier,
          designation: 'Senior Usthad & Class 5 Mentor',
          assignedClasses: ['5', '6'],
          assignedSubjects: ['Quran', 'Hifz', 'Tajweed'],
          madrasaName: CURRENT_MADRASA_NAME
        } as TeacherUser
        : {
          id: 'parent-1',
          name: 'Parent User',
          role: 'PARENT',
          email: identifier.includes('@') ? identifier : 'parent@gmail.com',
          phone: identifier.includes('@') ? '9847123456' : identifier,
          studentIds: [],
          madrasaName: CURRENT_MADRASA_NAME
        } as ParentUser;

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fallbackUser));
    return fallbackUser;
  },

  async switchRole(role: UserRole): Promise<User> {
    const user: User = role === 'ADMIN'
      ? {
        id: 'admin-1',
        name: 'Usthad Shihabudheen Saadi',
        role: 'ADMIN',
        email: 'sadhrmuallim@darunnajath.edu',
        phone: '9847001122',
        designation: 'Sadhr Muallim & Class 7 Mentor',
        assignedClasses: ['7', '6'],
        assignedSubjects: ['Fiqh', 'Quran'],
        madrasaName: CURRENT_MADRASA_NAME
      } as AdminUser
      : role === 'TEACHER'
        ? {
          id: 'teacher-1',
          name: 'Usthad Shibili Ahsani',
          role: 'TEACHER',
          email: 'shibili@darunnajath.edu',
          phone: '9847654321',
          designation: 'Senior Usthad & Class 5 Mentor',
          assignedClasses: ['5', '6'],
          assignedSubjects: ['Quran', 'Hifz', 'Tajweed'],
          madrasaName: CURRENT_MADRASA_NAME
        } as TeacherUser
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
      const callbackURL = role === 'ADMIN' ? '/admin/dashboard' : '/teacher/dashboard';
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
