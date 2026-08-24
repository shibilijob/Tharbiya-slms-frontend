import { AttendanceRecord, AttendanceStatus } from '../types';
import { api } from '../lib/axios';

const STORAGE_KEY = 'tharbiyah_attendance';

export const attendanceService = {
  async getAll(): Promise<AttendanceRecord[]> {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse stored attendance", e);
      }
    }
    return [];
  },

  async getByStudent(studentId: string): Promise<AttendanceRecord[]> {
    try {
      const res = await api.get<{ records: any[] }>(`/attendance/student/${studentId}`);
      if (res.data?.records && Array.isArray(res.data.records)) {
        return res.data.records.map((r: any) => ({
          id: r._id || r.id,
          studentId: r.studentId?._id || r.studentId,
          date: typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0],
          status: r.status as AttendanceStatus,
          remarks: r.remark || r.remarks,
          markedByTeacherId: r.markedById?._id || r.markedById || ''
        }));
      }
    } catch {
      // Offline / API unavailable fallback
    }

    const records = await this.getAll();
    return records
      .filter(r => r.studentId === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getByDateAndClass(date: string, studentIds: string[], classId?: string): Promise<AttendanceRecord[]> {
    if (classId) {
      try {
        const res = await api.get<{ records: any[] }>(`/attendance/class/${classId}?date=${date}`);
        if (res.data?.records && Array.isArray(res.data.records)) {
          return res.data.records.map((r: any) => ({
            id: r._id || r.id,
            studentId: r.studentId?._id || r.studentId,
            date: typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0],
            status: r.status as AttendanceStatus,
            remarks: r.remark || r.remarks,
            markedByTeacherId: r.markedById?._id || r.markedById || ''
          }));
        }
      } catch {
        // Fallback
      }
    }

    const records = await this.getAll();
    return records.filter(r => r.date === date && studentIds.includes(r.studentId));
  },

  async markAttendance(
    studentId: string,
    date: string,
    status: AttendanceStatus,
    teacherId: string,
    remarks?: string,
    classId?: string
  ): Promise<AttendanceRecord> {
    try {
      if (classId) {
        await api.post('/attendance', {
          classId,
          date,
          records: [{ studentId, status, remark: remarks }]
        });
      }
    } catch {
      // Fallback
    }

    const records = await this.getAll();
    const existingIndex = records.findIndex(r => r.studentId === studentId && r.date === date);

    if (existingIndex > -1) {
      records[existingIndex] = {
        ...records[existingIndex],
        status,
        remarks,
        markedByTeacherId: teacherId
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return records[existingIndex];
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${studentId}-${date}-${Date.now()}`,
        studentId,
        date,
        status,
        remarks,
        markedByTeacherId: teacherId
      };
      const updated = [newRecord, ...records];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newRecord;
    }
  },

  async batchMarkAttendance(
    updates: Array<{ studentId: string; date: string; status: AttendanceStatus; remarks?: string }>,
    teacherId: string,
    classId?: string
  ): Promise<AttendanceRecord[]> {
    if (classId && updates.length > 0) {
      try {
        const date = updates[0].date;
        await api.post('/attendance', {
          classId,
          date,
          records: updates.map(u => ({
            studentId: u.studentId,
            status: u.status,
            remark: u.remarks
          }))
        });
      } catch {
        // Fallback
      }
    }

    const records = await this.getAll();
    const resultMap: Map<string, AttendanceRecord> = new Map();
    
    records.forEach(r => resultMap.set(`${r.studentId}_${r.date}`, r));

    const updatedOrNew: AttendanceRecord[] = [];

    updates.forEach(u => {
      const key = `${u.studentId}_${u.date}`;
      if (resultMap.has(key)) {
        const existing = resultMap.get(key)!;
        const modified = { ...existing, status: u.status, remarks: u.remarks, markedByTeacherId: teacherId };
        resultMap.set(key, modified);
        updatedOrNew.push(modified);
      } else {
        const fresh: AttendanceRecord = {
          id: `att-${u.studentId}-${u.date}-${Date.now()}`,
          studentId: u.studentId,
          date: u.date,
          status: u.status,
          remarks: u.remarks,
          markedByTeacherId: teacherId
        };
        resultMap.set(key, fresh);
        updatedOrNew.push(fresh);
      }
    });

    const newFullList = Array.from(resultMap.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFullList));
    return updatedOrNew;
  }
};

