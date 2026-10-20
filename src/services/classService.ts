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

export interface ClassAccessItem { id: string; name: string; }

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
    void user;
    const res = await api.get<any>('/muallim/classes');
    const rawClasses = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    return Array.isArray(rawClasses)
      ? rawClasses.map((c: any) => String(c.name || c).replace(/^Class\s*/i, '').trim()).filter(Boolean)
      : [];
  },

  async getClassAccessList(): Promise<ClassAccessItem[]> {
    const res = await api.get<any>('/muallim/classes');
    const rows = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    return Array.isArray(rows)
      ? rows.map((c: any) => ({ id: String(c.id || c._id || ''), name: String(c.name || '') })).filter((c: ClassAccessItem) => c.id && c.name)
      : [];
  }
};
