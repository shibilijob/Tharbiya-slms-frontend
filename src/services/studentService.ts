import { Student, StudentStatus } from '../types';
import apiClient, { api } from '../lib/axios';
import { getBlobDownloadErrorMessage, saveBlobAsFile } from '../utils/downloadFile';

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

export const mapBackendStudentToFrontend = (s: any, fallbackClass?: string | number): Student => {
  let resolvedClass = '';
  if (s.classId && typeof s.classId === 'object' && s.classId.name) {
    resolvedClass = String(s.classId.name).replace(/^Class\s*/i, '').trim();
  } else if (s.className) {
    resolvedClass = String(s.className).replace(/^Class\s*/i, '').trim();
  } else if (s.class) {
    resolvedClass = String(s.class).replace(/^Class\s*/i, '').trim();
  } else if (typeof fallbackClass === 'string' && fallbackClass) {
    resolvedClass = String(fallbackClass).replace(/^Class\s*/i, '').trim();
  }

  return {
    id: s._id || s.id,
    admissionNo: s.admissionNumber || s.admissionNo || '',
    name: s.name,
    malayalamName: s.nameMalayalam || s.malayalamName || '',
    gender: s.gender || 'MALE',
    class: resolvedClass,
    status: s.isActive !== false ? 'ACTIVE' : 'INACTIVE',
    parentId: s.parentId?._id || s.parentId || '',
    parentName: s.parentId?.name || s.parentName || 'Parent',
    parentPhone: s.parentId?.phone || s.phone || s.parentPhone || '',
    assignedTeacherId: s.teacherId || s.classId?.classTeacherId?._id || s.classId?.classTeacherId || '',
    teacherName: s.teacherName || s.classId?.classTeacherId?.name || '',
    dob: s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '',
    admissionDate: s.admissionDate ? new Date(s.admissionDate).toISOString().split('T')[0] : '',
    bloodGroup: s.bloodGroup || undefined
  };
};

export const studentService = {
  async getAll(params?: { page?: number; limit?: number; search?: string; classId?: string; status?: string }): Promise<Student[]> {
    const authData = localStorage.getItem('tharbiyah_auth_user');
    let role: string | null = null;
    let assignedClasses: string[] = [];

    if (authData) {
      try {
        const u = JSON.parse(authData);
        role = u?.role || null;
        if (Array.isArray(u?.assignedClasses)) {
          assignedClasses = u.assignedClasses;
        } else if (typeof u?.assignedClasses === 'string') {
          try {
            const parsed = JSON.parse(u.assignedClasses);
            assignedClasses = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            assignedClasses = [u.assignedClasses];
          }
        }
      } catch {}
    }

    // 1. PARENT Flow
    if (role === 'PARENT') {
      try {
        const parentRes = await api.get<any>('/parent/children');
        const rawChildren = Array.isArray(parentRes.data) ? parentRes.data : (parentRes.data?.data || []);
        if (Array.isArray(rawChildren)) {
          const mapped = rawChildren.map((c: any) => mapBackendStudentToFrontend(c));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (pErr) {
        console.warn("Backend /parent/children error:", pErr);
        throw pErr;
      }
    }

    // 2. MUALLIM Flow (Fetch from assigned classes via /api/muallim/classes/:classId/students)
    if (role === 'MUALLIM') {
      try {
        let classList = assignedClasses
          .map((c: any) => String(c).replace(/^Class\s*/i, '').trim())
          .filter(Boolean);

        if (classList.length === 0) {
          try {
            const clsRes = await api.get<any>('/muallim/classes');
            const rawClasses = Array.isArray(clsRes.data) ? clsRes.data : (clsRes.data?.data || []);
            classList = rawClasses
              .map((c: any) => String(c.name || c).replace(/^Class\s*/i, '').trim())
              .filter(Boolean);
          } catch {}
        }

        if (classList.length === 0) {
          return [];
        }

        // If specific class requested, filter to that class if assigned
        if (params?.classId && params.classId !== 'ALL') {
          const cleanRequested = params.classId.replace(/^Class\s*/i, '').trim();
          if (classList.includes(cleanRequested)) {
            classList = [cleanRequested];
          }
        }

        const responses = await Promise.allSettled(
          classList.map((cls) => api.get<any>(`/muallim/classes/${cls}/students`))
        );

        const studentMap = new Map<string, Student>();
        responses.forEach((res, idx) => {
          if (res.status === 'fulfilled') {
            const rawList = Array.isArray(res.value.data)
              ? res.value.data
              : (res.value.data?.data || []);
            if (Array.isArray(rawList)) {
              rawList.forEach((rawStudent: any) => {
                const mapped = mapBackendStudentToFrontend(rawStudent, classList[idx]);
                studentMap.set(mapped.id, mapped);
              });
            }
          }
        });

        const combined = Array.from(studentMap.values());
        if (combined.length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
          return combined;
        }
      } catch (mErr) {
        console.warn("Backend /muallim/classes/:classId/students error:", mErr);
      }
    }

    // 3. SADHR_MUALLIM & Admin Flow
    if (role === 'SADHR_MUALLIM' || !role) {
      try {
        const queryParams: Record<string, any> = { limit: params?.limit || 100 };
        if (params?.page) queryParams.page = params.page;
        if (params?.search) queryParams.search = params.search;
        if (params?.classId && params.classId !== 'ALL') queryParams.classId = params.classId;
        if (params?.status && params.status !== 'ALL') queryParams.status = params.status;

        const res = await api.get<any>('/sadhr/students', { params: queryParams });
        const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (Array.isArray(rawList)) {
          const mapped = rawList.map((s: any) => mapBackendStudentToFrontend(s));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
          return mapped;
        }
      } catch (err) {
        console.warn("Backend /sadhr/students unavailable", err);
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

    const authData = localStorage.getItem('tharbiyah_auth_user');
    let role: string | null = null;
    if (authData) {
      try {
        role = JSON.parse(authData)?.role || null;
      } catch {}
    }

    if (role === 'MUALLIM') {
      const all = await this.getAll(params);
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
    }

    try {
      const queryParams: Record<string, any> = { page, limit };
      if (params?.search) queryParams.search = params.search;
      if (params?.classId && params.classId !== 'ALL') queryParams.classId = params.classId;
      if (params?.status && params.status !== 'ALL') queryParams.status = params.status;

      const res = await api.get<any>('/sadhr/students', { params: queryParams });
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (Array.isArray(rawList)) {
        const mapped = rawList.map(mapBackendStudentToFrontend);
        const pagination: PaginationInfo = res.pagination || {
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
      console.warn("Backend /sadhr/students unavailable", err);
    }

    return {
      students: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 1,
        hasPrevPage: false,
        hasNextPage: false,
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
    } catch (err) {
      console.warn("Backend student lookup unavailable", err);
    }

    return null;
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
        const deduplicated = [created, ...students.filter(s => s.id !== created.id)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deduplicated));
        return created;
      }
    } catch (err: any) {
      console.error("Backend error creating student:", err?.response?.data || err?.message);
      throw err;
    }

    throw new Error('Backend failed to return created student');
  },

  async update(id: string, updates: Partial<Student>): Promise<Student> {
    if (id && !id.startsWith('student-')) {
      const payload: Record<string, any> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.admissionNo !== undefined) payload.admissionNumber = updates.admissionNo;
      if (updates.malayalamName !== undefined) payload.nameMalayalam = updates.malayalamName;
      if (updates.parentPhone !== undefined) payload.phone = updates.parentPhone;
      if (updates.gender !== undefined) payload.gender = updates.gender;
      if (updates.dob !== undefined) payload.dateOfBirth = updates.dob;
      if (updates.parentId !== undefined) payload.parentId = updates.parentId || undefined;
      if (updates.class !== undefined) payload.classId = updates.class || undefined;
      if (updates.admissionDate !== undefined) payload.admissionDate = updates.admissionDate;
      if (updates.status !== undefined) payload.isActive = updates.status === 'ACTIVE';

      const res = await api.patch(`/sadhr/students/${id}`, payload);
      const raw = res.data?.data || res.data;
      if (raw) {
        const updated = mapBackendStudentToFrontend(raw);
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            const list: Student[] = JSON.parse(cached);
            const idx = list.findIndex((s) => s.id === updated.id);
            if (idx !== -1) {
              list[idx] = updated;
            } else {
              list.unshift(updated);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
          }
        } catch (e) {
          console.error("Failed to update student in cache:", e);
        }
        return updated;
      }
    }

    throw new Error("Student updates must be saved through the backend");
  },

  async delete(id: string): Promise<boolean> {
    try {
      if (id && !id.startsWith('student-')) {
        await api.delete(`/sadhr/students/${id}`);
      }
    } catch (err: any) {
      console.error("Backend error deleting student:", err?.response?.data || err?.message);
      throw err;
    }

    return true;
  },

  async updateStatus(id: string, status: StudentStatus): Promise<Student> {
    return this.update(id, { status });
  },

  async downloadAllActiveStudents(): Promise<void> {
    try {
      const res = await apiClient.get('/sadhr/students/export/active', {
        responseType: 'blob',
        headers: {
          Accept: 'application/pdf',
        },
      });

      saveBlobAsFile(res.data, 'active-students.pdf', 'application/pdf');
    } catch (error: any) {
      throw new Error(
        await getBlobDownloadErrorMessage(error, 'Failed to download active students PDF.')
      );
    }
  }
};
