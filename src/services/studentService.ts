import { Student, StudentStatus } from '../types';
import { api } from '../lib/axios';

const STORAGE_KEY = 'tharbiyah_students';

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export interface PaginatedStudentsResponse {
  students: Student[];
  pagination: PaginationInfo;
}

const mapBackendStudentToFrontend = (s: any): Student => ({
  id: s._id || s.id,
  admissionNo: s.admissionNumber || s.admissionNo || '',
  name: s.name,
  malayalamName: s.nameMalayalam || s.malayalamName || '',
  gender: s.gender || 'MALE',
  class: s.className?.replace(/^Class\s*/i, '') || s.classId?.name?.replace(/^Class\s*/i, '') || s.class || '5',
  status: s.isActive !== false ? 'ACTIVE' : 'INACTIVE',
  parentId: s.parentId?._id || s.parentId || '',
  parentName: s.parentId?.name || s.parentName || 'Parent',
  parentPhone: s.parentId?.phone || s.parentPhone || '',
  assignedTeacherId: s.teacherId || s.classId?.classTeacherId?._id || s.classId?.classTeacherId || 'teacher-1',
  teacherName: s.teacherName || s.classId?.classTeacherId?.name || 'Usthad Shihabudheen Saadi',
  dob: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '2015-05-14',
  admissionDate: s.admissionDate ? new Date(s.admissionDate).toISOString().split('T')[0] : '2024-06-01',
  bloodGroup: s.bloodGroup || 'B+'
});

export const studentService = {
  async getAll(params?: { page?: number; limit?: number; search?: string; classId?: string; status?: string }): Promise<Student[]> {
    // 1. Check if logged in user is a Parent
    const authData = localStorage.getItem('tharbiyah_auth_user');
    let isParent = false;
    if (authData) {
      try {
        const u = JSON.parse(authData);
        if (u?.role === 'PARENT') isParent = true;
      } catch {}
    }

    if (isParent) {
      try {
        const parentRes = await api.get<any>('/parent/children');
        const rawChildren = Array.isArray(parentRes.data) ? parentRes.data : (parentRes.data?.data || []);
        if (Array.isArray(rawChildren) && rawChildren.length > 0) {
          const mapped = rawChildren.map(mapBackendStudentToFrontend);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (pErr) {
        console.warn("Backend /parent/children error:", pErr);
      }
    }

    try {
      const queryParams: Record<string, any> = { limit: params?.limit || 100 };
      if (params?.page) queryParams.page = params.page;
      if (params?.search) queryParams.search = params.search;
      if (params?.classId && params.classId !== 'ALL') queryParams.classId = params.classId;
      if (params?.status && params.status !== 'ALL') queryParams.status = params.status;

      const res = await api.get<any>('/sadhr/students', { params: queryParams });
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (Array.isArray(rawList)) {
        const mapped = rawList.map(mapBackendStudentToFrontend);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        return mapped;
      }
    } catch (err) {
      console.warn("Backend /sadhr/students unavailable, checking parent or local cache", err);
      // Fallback: try parent endpoint if not already tried
      if (!isParent) {
        try {
          const parentRes = await api.get<any>('/parent/children');
          const rawChildren = Array.isArray(parentRes.data) ? parentRes.data : (parentRes.data?.data || []);
          if (Array.isArray(rawChildren) && rawChildren.length > 0) {
            const mapped = rawChildren.map(mapBackendStudentToFrontend);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
            return mapped;
          }
        } catch {}
      }
    }

    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse stored students", e);
      }
    }
    return [];
  },

  async getPaginated(params?: {
    page?: number;
    limit?: number;
    search?: string;
    classId?: string;
    status?: string;
  }): Promise<PaginatedStudentsResponse> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;

    try {
      const queryParams: Record<string, any> = { page, limit };
      if (params?.search) queryParams.search = params.search;
      if (params?.classId && params.classId !== 'ALL') queryParams.classId = params.classId;
      if (params?.status && params.status !== 'ALL') queryParams.status = params.status;

      const res = await api.get<any>('/sadhr/students', { params: queryParams });
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (Array.isArray(rawList)) {
        const mapped = rawList.map(mapBackendStudentToFrontend);
        const pagination: PaginationInfo = res.data?.pagination || {
          total: mapped.length,
          page,
          limit,
          totalPages: Math.ceil(mapped.length / limit) || 1,
          hasPrevPage: page > 1,
          hasNextPage: page < Math.ceil(mapped.length / limit),
        };

        return { students: mapped, pagination };
      }
    } catch (err) {
      console.warn("Backend /sadhr/students unavailable, using local fallback", err);
    }

    const all = await this.getAll();
    let filtered = all;

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.admissionNo.toLowerCase().includes(q) ||
          (s.malayalamName && s.malayalamName.includes(q))
      );
    }

    if (params?.classId && params.classId !== 'ALL') {
      filtered = filtered.filter((s) => s.class === params.classId || `Class ${s.class}` === params.classId);
    }

    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((s) => s.status === params.status);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return {
      students: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    };
  },

  async getById(id: string): Promise<Student | null> {
    try {
      const res = await api.get<any>(`/sadhr/students/${id}`);
      const raw = res.data?.data || res.data;
      if (raw) {
        return mapBackendStudentToFrontend(raw);
      }
    } catch {
      // Offline fallback
    }

    const students = await this.getAll();
    return students.find(s => s.id === id) || null;
  },

  async getByParent(parentId: string): Promise<Student[]> {
    const students = await this.getAll();
    return students.filter(s => s.parentId === parentId);
  },

  async getByTeacher(teacherId: string): Promise<Student[]> {
    const students = await this.getAll();
    return students.filter(s => s.assignedTeacherId === teacherId);
  },

  async getByClass(className: string): Promise<Student[]> {
    const students = await this.getAll();
    return students.filter(s => s.class === className);
  },

  async create(studentData: Omit<Student, 'id'>): Promise<Student> {
    try {
      const payload = {
        name: studentData.name,
        admissionNumber: studentData.admissionNo,
        gender: studentData.gender,
        dateOfBirth: studentData.dob,
        parentId: studentData.parentId || undefined,
        classId: studentData.class,
        admissionDate: studentData.admissionDate,
      };

      const res = await api.post<any>('/sadhr/students', payload);
      const raw = res.data?.data || res.data;
      if (raw) {
        const created = mapBackendStudentToFrontend(raw);
        const students = await this.getAll();
        localStorage.setItem(STORAGE_KEY, JSON.stringify([created, ...students]));
        return created;
      }
    } catch (err: any) {
      console.error("Backend error creating student, falling back:", err?.response?.data || err?.message);
    }

    const students = await this.getAll();
    const newStudent: Student = {
      ...studentData,
      id: `student-${Date.now()}`
    };
    const updated = [newStudent, ...students];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newStudent;
  },

  async update(id: string, updates: Partial<Student>): Promise<Student> {
    try {
      if (id && !id.startsWith('student-')) {
        const res = await api.patch(`/sadhr/students/${id}`, {
          name: updates.name,
          gender: updates.gender,
          dateOfBirth: updates.dob,
          parentId: updates.parentId || undefined,
          classId: updates.class || undefined,
          admissionDate: updates.admissionDate,
          isActive: updates.status ? updates.status === 'ACTIVE' : undefined,
        });
        const raw = res.data?.data || res.data;
        if (raw) {
          return mapBackendStudentToFrontend(raw);
        }
      }
    } catch (err: any) {
      console.error("Backend error updating student:", err?.response?.data || err?.message);
    }

    const students = await this.getAll();
    const index = students.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Student not found");
    
    const updatedStudent = { ...students[index], ...updates };
    students[index] = updatedStudent;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    return updatedStudent;
  },

  async delete(id: string): Promise<boolean> {
    try {
      if (id && !id.startsWith('student-')) {
        await api.delete(`/sadhr/students/${id}`);
      }
    } catch (err: any) {
      console.error("Backend error deleting student:", err?.response?.data || err?.message);
    }

    const students = await this.getAll();
    const filtered = students.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  async updateStatus(id: string, status: StudentStatus): Promise<Student> {
    return this.update(id, { status });
  }
};

