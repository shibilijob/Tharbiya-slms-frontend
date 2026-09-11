import { create } from 'zustand';
import { AttendanceRecord, AttendanceStatus } from '../types';
import { attendanceService } from '../services/attendanceService';

interface AttendanceState {
  attendance: AttendanceRecord[];
  selectedDate: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedDate: (date: string) => void;
  setAttendance: (records: AttendanceRecord[]) => void;
  fetchAttendance: () => Promise<AttendanceRecord[]>;
  fetchByStudent: (studentId: string) => Promise<AttendanceRecord[]>;
  fetchByDateAndClass: (date: string, classId?: string) => Promise<AttendanceRecord[]>;
  markAttendance: (studentId: string, date: string, status: AttendanceStatus, teacherId: string, remarks?: string, classId?: string) => Promise<AttendanceRecord>;
  batchMarkAttendance: (updates: Array<{ studentId: string; date: string; status: AttendanceStatus; remarks?: string }>, teacherId: string, classId?: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  attendance: [],
  selectedDate: new Date().toISOString().split('T')[0],
  isLoading: false,
  error: null,

  setSelectedDate: (selectedDate: string) => {
    set({ selectedDate });
  },

  setAttendance: (attendance: AttendanceRecord[]) => {
    set({ attendance });
  },

  clearError: () => {
    set({ error: null });
  },

  fetchAttendance: async () => {
    set({ isLoading: true, error: null });
    try {
      const records = await attendanceService.getAll();
      set({ attendance: records, isLoading: false });
      return records;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch attendance';
      set({ error: msg, isLoading: false });
      return get().attendance;
    }
  },

  fetchByStudent: async (studentId: string) => {
    try {
      return await attendanceService.getByStudent(studentId);
    } catch (err) {
      console.warn('Failed to fetch student attendance:', err);
      return [];
    }
  },

  fetchByDateAndClass: async (date: string, classId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const records = await attendanceService.getByDateAndClass(date, undefined, classId);
      set((state) => {
        const copy = [...state.attendance];
        records.forEach((r) => {
          const idx = copy.findIndex((item) => item.studentId === r.studentId && item.date === r.date);
          if (idx > -1) {
            copy[idx] = r;
          } else {
            copy.unshift(r);
          }
        });
        return { attendance: copy, isLoading: false };
      });
      return records;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch attendance for class and date';
      set({ error: msg, isLoading: false });
      return [];
    }
  },

  markAttendance: async (studentId, date, status, teacherId, remarks, classId) => {
    set({ isLoading: true, error: null });
    try {
      const record = await attendanceService.markAttendance(studentId, date, status, teacherId, remarks, classId);
      set((state) => {
        const idx = state.attendance.findIndex((r) => r.studentId === studentId && r.date === date);
        if (idx > -1) {
          const copy = [...state.attendance];
          copy[idx] = record;
          return { attendance: copy, isLoading: false };
        }
        return { attendance: [record, ...state.attendance], isLoading: false };
      });
      return record;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to mark attendance';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  batchMarkAttendance: async (updates, teacherId, classId) => {
    set({ isLoading: true, error: null });
    try {
      const updatedRecords = await attendanceService.batchMarkAttendance(updates, teacherId, classId);
      set((state) => {
        const copy = [...state.attendance];
        updatedRecords.forEach((u) => {
          const idx = copy.findIndex((r) => r.studentId === u.studentId && r.date === u.date);
          if (idx > -1) {
            copy[idx] = u;
          } else {
            copy.unshift(u);
          }
        });
        return { attendance: copy, isLoading: false };
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to batch mark attendance';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  reset: () => {
    set({
      attendance: [],
      selectedDate: new Date().toISOString().split('T')[0],
      isLoading: false,
      error: null,
    });
  },
}));
