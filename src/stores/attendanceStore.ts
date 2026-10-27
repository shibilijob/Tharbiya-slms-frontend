import { create } from 'zustand';
import {
  AttendanceRecord,
  AttendanceStatus,
  MonthlyAttendanceBacklogRecord,
  SaveMonthlyBacklogPayload,
  StudentAttendanceCardStat,
} from '../types';
import { attendanceService } from '../services/attendanceService';

interface AttendanceState {
  attendance: AttendanceRecord[];
  selectedDate: string;
  isLoading: boolean;
  error: string | null;
  studentAttendanceStats: Record<string, StudentAttendanceCardStat>;
  monthlyBacklog: MonthlyAttendanceBacklogRecord[];

  // Actions
  setSelectedDate: (date: string) => void;
  setAttendance: (records: AttendanceRecord[]) => void;
  fetchAttendance: () => Promise<AttendanceRecord[]>;
  fetchByStudent: (studentId: string) => Promise<AttendanceRecord[]>;
  fetchByDateAndClass: (date: string, classId?: string) => Promise<AttendanceRecord[]>;
  fetchClassAttendanceStats: (classId: string, date?: string) => Promise<Record<string, StudentAttendanceCardStat>>;
  fetchMonthlyBacklog: (classId: string, year?: number, month?: number) => Promise<MonthlyAttendanceBacklogRecord[]>;
  saveMonthlyBacklog: (payload: SaveMonthlyBacklogPayload) => Promise<any>;
  markAttendance: (studentId: string, date: string, status: AttendanceStatus, teacherId: string, remarks?: string, classId?: string) => Promise<AttendanceRecord>;
  batchMarkAttendance: (updates: Array<{ studentId: string; date: string; status: AttendanceStatus; remarks?: string }>, teacherId: string, classId?: string) => Promise<void>;
  updateOptimisticAttendanceStat: (studentId: string, oldStatus: AttendanceStatus, newStatus: AttendanceStatus) => void;
  batchUpdateOptimisticAttendanceStats: (updates: Array<{ studentId: string; oldStatus: AttendanceStatus; newStatus: AttendanceStatus }>) => void;
  clearError: () => void;
  reset: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  attendance: [],
  selectedDate: new Date().toISOString().split('T')[0],
  isLoading: false,
  error: null,
  studentAttendanceStats: {},
  monthlyBacklog: [],

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

  fetchClassAttendanceStats: async (classId: string, date?: string) => {
    try {
      const res: any = await attendanceService.fetchClassAttendanceStats(classId, date);
      const rawStats = (res && typeof res === 'object' && res.stats && typeof res.stats === 'object')
        ? res.stats
        : (res && typeof res === 'object' && res.data && typeof res.data === 'object')
        ? res.data
        : (res && typeof res === 'object')
        ? res
        : {};

      console.log(`[attendanceStore] fetchClassAttendanceStats for class ${classId}:`, rawStats);

      set((state) => ({
        studentAttendanceStats: {
          ...state.studentAttendanceStats,
          ...rawStats,
        },
      }));
      return rawStats;
    } catch (err: any) {
      console.warn('Failed to fetch class attendance stats:', err);
      return get().studentAttendanceStats;
    }
  },

  updateOptimisticAttendanceStat: (studentId: string, oldStatus: AttendanceStatus, newStatus: AttendanceStatus) => {
    if (oldStatus === newStatus) return;
    set((state) => {
      const currentStat = state.studentAttendanceStats[studentId];
      const baseStat = currentStat || {
        studentId,
        currentMonth: '0/0',
        prevMonths: '0/0',
        totalAttendance: '0/0',
        currentMonthPercent: 0,
        prevMonthsPercent: 0,
        totalPercent: 0,
        currentAttended: 0,
        currentWorking: 0,
        prevAttended: 0,
        prevWorking: 0,
        totalAttended: 0,
        totalWorking: 0,
      };

      const curAttended = typeof baseStat.currentAttended === 'number'
        ? baseStat.currentAttended
        : parseInt(baseStat.currentMonth?.split('/')[0] || '0', 10) || 0;
      const curWorking = typeof baseStat.currentWorking === 'number'
        ? baseStat.currentWorking
        : parseInt(baseStat.currentMonth?.split('/')[1] || '0', 10) || 0;
      const prevAttended = typeof baseStat.prevAttended === 'number'
        ? baseStat.prevAttended
        : parseInt(baseStat.prevMonths?.split('/')[0] || '0', 10) || 0;
      const prevWorking = typeof baseStat.prevWorking === 'number'
        ? baseStat.prevWorking
        : parseInt(baseStat.prevMonths?.split('/')[1] || '0', 10) || 0;

      let deltaAttended = 0;
      if (oldStatus !== 'PRESENT' && newStatus === 'PRESENT') {
        deltaAttended = 1;
      } else if (oldStatus === 'PRESENT' && newStatus !== 'PRESENT') {
        deltaAttended = -1;
      }

      let deltaWorking = 0;
      if (oldStatus === 'HOLIDAY' && newStatus !== 'HOLIDAY') {
        deltaWorking = 1;
      } else if (oldStatus !== 'HOLIDAY' && newStatus === 'HOLIDAY') {
        deltaWorking = -1;
      }

      const newCurAttended = Math.max(0, curAttended + deltaAttended);
      const newCurWorking = Math.max(newCurAttended, curWorking + deltaWorking);

      const newTotAttended = Math.max(0, prevAttended + newCurAttended);
      const newTotWorking = Math.max(newTotAttended, prevWorking + newCurWorking);

      const updatedStat: StudentAttendanceCardStat = {
        ...baseStat,
        currentAttended: newCurAttended,
        currentWorking: newCurWorking,
        currentMonth: `${newCurAttended}/${newCurWorking}`,
        currentMonthPercent: newCurWorking > 0 ? Math.round((newCurAttended / newCurWorking) * 100) : 0,
        totalAttended: newTotAttended,
        totalWorking: newTotWorking,
        totalAttendance: `${newTotAttended}/${newTotWorking}`,
        totalPercent: newTotWorking > 0 ? Math.round((newTotAttended / newTotWorking) * 100) : 0,
      };

      return {
        studentAttendanceStats: {
          ...state.studentAttendanceStats,
          [studentId]: updatedStat,
        },
      };
    });
  },

  batchUpdateOptimisticAttendanceStats: (updates: Array<{ studentId: string; oldStatus: AttendanceStatus; newStatus: AttendanceStatus }>) => {
    set((state) => {
      const nextStats = { ...state.studentAttendanceStats };
      let changed = false;

      for (const { studentId, oldStatus, newStatus } of updates) {
        if (oldStatus === newStatus) continue;
        const baseStat = nextStats[studentId] || {
          studentId,
          currentMonth: '0/0',
          prevMonths: '0/0',
          totalAttendance: '0/0',
          currentMonthPercent: 0,
          prevMonthsPercent: 0,
          totalPercent: 0,
          currentAttended: 0,
          currentWorking: 0,
          prevAttended: 0,
          prevWorking: 0,
          totalAttended: 0,
          totalWorking: 0,
        };

        const curAttended = typeof baseStat.currentAttended === 'number'
          ? baseStat.currentAttended
          : parseInt(baseStat.currentMonth?.split('/')[0] || '0', 10) || 0;
        const curWorking = typeof baseStat.currentWorking === 'number'
          ? baseStat.currentWorking
          : parseInt(baseStat.currentMonth?.split('/')[1] || '0', 10) || 0;
        const prevAttended = typeof baseStat.prevAttended === 'number'
          ? baseStat.prevAttended
          : parseInt(baseStat.prevMonths?.split('/')[0] || '0', 10) || 0;
        const prevWorking = typeof baseStat.prevWorking === 'number'
          ? baseStat.prevWorking
          : parseInt(baseStat.prevMonths?.split('/')[1] || '0', 10) || 0;

        let deltaAttended = 0;
        if (oldStatus !== 'PRESENT' && newStatus === 'PRESENT') {
          deltaAttended = 1;
        } else if (oldStatus === 'PRESENT' && newStatus !== 'PRESENT') {
          deltaAttended = -1;
        }

        let deltaWorking = 0;
        if (oldStatus === 'HOLIDAY' && newStatus !== 'HOLIDAY') {
          deltaWorking = 1;
        } else if (oldStatus !== 'HOLIDAY' && newStatus === 'HOLIDAY') {
          deltaWorking = -1;
        }

        const newCurAttended = Math.max(0, curAttended + deltaAttended);
        const newCurWorking = Math.max(newCurAttended, curWorking + deltaWorking);

        const newTotAttended = Math.max(0, prevAttended + newCurAttended);
        const newTotWorking = Math.max(newTotAttended, prevWorking + newCurWorking);

        nextStats[studentId] = {
          ...baseStat,
          currentAttended: newCurAttended,
          currentWorking: newCurWorking,
          currentMonth: `${newCurAttended}/${newCurWorking}`,
          currentMonthPercent: newCurWorking > 0 ? Math.round((newCurAttended / newCurWorking) * 100) : 0,
          totalAttended: newTotAttended,
          totalWorking: newTotWorking,
          totalAttendance: `${newTotAttended}/${newTotWorking}`,
          totalPercent: newTotWorking > 0 ? Math.round((newTotAttended / newTotWorking) * 100) : 0,
        };
        changed = true;
      }

      return changed ? { studentAttendanceStats: nextStats } : state;
    });
  },

  fetchMonthlyBacklog: async (classId: string, year?: number, month?: number) => {
    try {
      const records = await attendanceService.fetchMonthlyBacklog(classId, year, month);
      set({ monthlyBacklog: records });
      return records;
    } catch (err: any) {
      console.warn('Failed to fetch monthly backlog:', err);
      return [];
    }
  },

  saveMonthlyBacklog: async (payload: SaveMonthlyBacklogPayload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await attendanceService.saveMonthlyBacklog(payload);
      // Immediately refresh stats for the class
      await get().fetchClassAttendanceStats(payload.classId);
      set({ isLoading: false });
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save monthly backlog';
      set({ error: msg, isLoading: false });
      throw err;
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

      // Post-save re-fetch of card stats if classId is known
      if (classId) {
        await get().fetchClassAttendanceStats(classId);
      }
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
      studentAttendanceStats: {},
      monthlyBacklog: [],
    });
  },
}));
