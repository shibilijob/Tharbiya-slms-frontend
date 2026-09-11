import { api } from '../lib/axios';

export interface ClassItem {
  id: string;
  name: string;
  division?: string;
  classTeacherId?: string;
  classTeacherName?: string;
  classTeacherPhone?: string;
  studentCount: number;
  averageProgress: number;
  isActive?: boolean;
}

export interface TeacherOption {
  id: string;
  name: string;
  designation?: string;
}

export interface CreateClassPayload {
  name: string;
  division?: string;
  classTeacherId?: string;
  capacity?: number;
}

export const classService = {
  /**
   * Fetch all classes (Sadhr / Admin view)
   */
  async getAll(): Promise<ClassItem[]> {
    const res = await api.get<any>('/sadhr/classes');
    const rawData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    if (!Array.isArray(rawData)) return [];

    return rawData.map((c: any) => ({
      id: c.id || c._id,
      name: c.name,
      division: c.division || undefined,
      classTeacherId: c.classTeacherId || undefined,
      classTeacherName: c.classTeacherName || 'Unassigned',
      classTeacherPhone: c.classTeacherPhone || undefined,
      studentCount: c.studentCount || 0,
      averageProgress: c.averageProgress || 88,
      isActive: c.isActive !== false,
    }));
  },

  /**
   * Fetch faculty/teachers for class assignment
   */
  async getTeachersList(): Promise<TeacherOption[]> {
    const res = await api.get<any>('/sadhr/muallims');
    const rawData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    if (!Array.isArray(rawData)) return [];

    return rawData.map((t: any) => ({
      id: t.id || t._id,
      name: t.name,
      designation: t.designation || 'Usthad',
    }));
  },

  /**
   * Create a new class
   */
  async create(payload: CreateClassPayload): Promise<any> {
    const res = await api.post<any>('/sadhr/classes', payload);
    return res.data;
  },

  /**
   * Update an existing class
   */
  async update(id: string, payload: Partial<CreateClassPayload>): Promise<any> {
    const res = await api.patch<any>(`/sadhr/classes/${id}`, payload);
    return res.data;
  },

  /**
   * Delete class
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/sadhr/classes/${id}`);
  },

  /**
   * Fetch Muallim assigned classes from backend
   */
  async getAssignedClassesForTeacher(user: { id?: string; email?: string; phone?: string; name?: string }): Promise<string[]> {
    try {
      const res = await api.get<any>('/faculty-members');
      const teachers = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (Array.isArray(teachers) && teachers.length > 0) {
        const matched = teachers.find((t: any) =>
          (user?.id && (t.id === user.id || t._id === user.id)) ||
          (user?.email && t.email && t.email.toLowerCase() === user.email.toLowerCase()) ||
          (user?.phone && t.phone && t.phone === user.phone) ||
          (user?.name && t.name && (
            t.name.toLowerCase() === user.name.toLowerCase() ||
            t.name.toLowerCase().includes(user.name.toLowerCase()) ||
            user.name.toLowerCase().includes(t.name.toLowerCase())
          ))
        );

        if (matched && Array.isArray(matched.assignedClasses) && matched.assignedClasses.length > 0) {
          return matched.assignedClasses
            .map((c: any) => String(c).replace(/^Class\s*/i, '').trim())
            .filter(Boolean);
        }
      }
    } catch {
      // Fallback
    }

    try {
      const res = await api.get<any>('/muallim/classes');
      const rawClasses = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (Array.isArray(rawClasses) && rawClasses.length > 0) {
        return rawClasses
          .map((c: any) => String(c.name || c).replace(/^Class\s*/i, '').trim())
          .filter(Boolean);
      }
    } catch {
      // Fallback
    }

    return [];
  }
};
