import { create } from 'zustand';
import {
  TeacherUser,
  MuallimShiftId,
  MuallimAttendanceStatusType,
} from '../types';
import {
  muallimAttendanceService,
  MonthlyReportResponse,
} from '../services/muallimAttendanceService';

const getTodayDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export type ShiftMatrix = Record<string, Record<MuallimShiftId, MuallimAttendanceStatusType | ''>>;
export type ShiftReasonMatrix = Record<string, Record<MuallimShiftId, string>>;

interface MuallimAttendanceState {
  selectedDate: string;
  muallims: TeacherUser[];
  matrix: ShiftMatrix;
  originalMatrix: ShiftMatrix;
  reasonMatrix: ShiftReasonMatrix;
  originalReasonMatrix: ShiftReasonMatrix;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Monthly Report
  selectedYear: number;
  selectedMonth: number;
  monthlyReport: MonthlyReportResponse | null;
  isLoadingMonthly: boolean;

  // Actions
  setSelectedDate: (date: string) => void;
  fetchDailyAttendance: (date?: string) => Promise<void>;
  setShiftStatus: (
    userId: string,
    shiftId: MuallimShiftId,
    status: MuallimAttendanceStatusType | '',
    holidayReason?: string | null
  ) => void;
  setShiftHolidayReason: (
    userId: string,
    shiftId: MuallimShiftId,
    reason: string
  ) => void;
  markAllPresent: (shiftId: MuallimShiftId) => void;
  declareShiftHoliday: (
    shiftId: MuallimShiftId,
    holidayReason?: string,
    remarks?: string
  ) => Promise<void>;
  declareFullDayHoliday: (
    holidayReason?: string,
    remarks?: string
  ) => Promise<void>;
  saveDailyAttendance: () => Promise<void>;

  // Monthly Actions
  setSelectedYearMonth: (year: number, month: number) => void;
  fetchMonthlyReport: (year?: number, month?: number) => Promise<void>;
  downloadPdf: (year?: number, month?: number, userId?: string) => Promise<void>;

  clearError: () => void;
  reset: () => void;
}

export const useMuallimAttendanceStore = create<MuallimAttendanceState>((set, get) => ({
  selectedDate: getTodayDateStr(),
  muallims: [],
  matrix: {},
  originalMatrix: {},
  reasonMatrix: {},
  originalReasonMatrix: {},
  isDirty: false,
  isLoading: false,
  isSaving: false,
  error: null,

  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1,
  monthlyReport: null,
  isLoadingMonthly: false,

  setSelectedDate: (selectedDate: string) => {
    set({ selectedDate });
    get().fetchDailyAttendance(selectedDate);
  },

  fetchDailyAttendance: async (dateParam?: string) => {
    const targetDate = dateParam || get().selectedDate;
    set({ isLoading: true, error: null });

    try {
      const res = await muallimAttendanceService.getDailyAttendance(targetDate);
      const muallims = res.muallims || [];
      const records = res.records || [];

      // Build initial matrix for all active muallims
      const newMatrix: ShiftMatrix = {};
      const newReasonMatrix: ShiftReasonMatrix = {};

      for (const m of muallims) {
        newMatrix[m.id] = {
          SHIFT_1: '',
          SHIFT_2: '',
          SHIFT_3: '',
        };
        newReasonMatrix[m.id] = {
          SHIFT_1: '',
          SHIFT_2: '',
          SHIFT_3: '',
        };
      }

      // Populate from existing records
      for (const r of records) {
        if (newMatrix[r.userId]) {
          newMatrix[r.userId][r.shiftId] = r.status;
          newReasonMatrix[r.userId][r.shiftId] =
            r.status === 'HOLIDAY' ? (r.holidayReason || '') : '';
        }
      }

      // Clone for original tracking
      const orig: ShiftMatrix = JSON.parse(JSON.stringify(newMatrix));
      const origReasons: ShiftReasonMatrix = JSON.parse(JSON.stringify(newReasonMatrix));

      set({
        muallims,
        matrix: newMatrix,
        originalMatrix: orig,
        reasonMatrix: newReasonMatrix,
        originalReasonMatrix: origReasons,
        isDirty: false,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.message || err?.message || 'Failed to load attendance',
      });
    }
  },

  setShiftStatus: (
    userId: string,
    shiftId: MuallimShiftId,
    status: MuallimAttendanceStatusType | '',
    holidayReason?: string | null
  ) => {
    const { matrix, reasonMatrix } = get();
    const userShifts = matrix[userId] || { SHIFT_1: '', SHIFT_2: '', SHIFT_3: '' };
    const userReasons = reasonMatrix[userId] || { SHIFT_1: '', SHIFT_2: '', SHIFT_3: '' };

    // Update only the target shift
    const updatedUserShifts = {
      ...userShifts,
      [shiftId]: status,
    };

    let updatedReason = '';
    if (status === 'HOLIDAY') {
      if (holidayReason !== undefined && holidayReason !== null) {
        updatedReason = holidayReason;
      } else {
        updatedReason = userReasons[shiftId] || '';
      }
    } else {
      // Clear holiday reason if status is changed away from HOLIDAY
      updatedReason = '';
    }

    const updatedUserReasons = {
      ...userReasons,
      [shiftId]: updatedReason,
    };

    const updatedMatrix: ShiftMatrix = {
      ...matrix,
      [userId]: updatedUserShifts,
    };

    const updatedReasonMatrix: ShiftReasonMatrix = {
      ...reasonMatrix,
      [userId]: updatedUserReasons,
    };

    set({
      matrix: updatedMatrix,
      reasonMatrix: updatedReasonMatrix,
      isDirty: true,
    });
  },

  setShiftHolidayReason: (
    userId: string,
    shiftId: MuallimShiftId,
    reason: string
  ) => {
    const { reasonMatrix, matrix } = get();
    const userReasons = reasonMatrix[userId] || { SHIFT_1: '', SHIFT_2: '', SHIFT_3: '' };
    const userShifts = matrix[userId] || { SHIFT_1: '', SHIFT_2: '', SHIFT_3: '' };

    const updatedUserReasons = {
      ...userReasons,
      [shiftId]: reason,
    };

    const updatedUserShifts = {
      ...userShifts,
      [shiftId]: 'HOLIDAY' as MuallimAttendanceStatusType,
    };

    set({
      matrix: { ...matrix, [userId]: updatedUserShifts },
      reasonMatrix: { ...reasonMatrix, [userId]: updatedUserReasons },
      isDirty: true,
    });
  },

  markAllPresent: (shiftId: MuallimShiftId) => {
    const { matrix, reasonMatrix, muallims } = get();
    const updatedMatrix: ShiftMatrix = { ...matrix };
    const updatedReasonMatrix: ShiftReasonMatrix = { ...reasonMatrix };

    for (const m of muallims) {
      const current = updatedMatrix[m.id] || { SHIFT_1: '', SHIFT_2: '', SHIFT_3: '' };
      updatedMatrix[m.id] = {
        ...current,
        [shiftId]: 'PRESENT',
      };
      const currentReasons = updatedReasonMatrix[m.id] || { SHIFT_1: '', SHIFT_2: '', SHIFT_3: '' };
      updatedReasonMatrix[m.id] = {
        ...currentReasons,
        [shiftId]: '',
      };
    }

    set({
      matrix: updatedMatrix,
      reasonMatrix: updatedReasonMatrix,
      isDirty: true,
    });
  },

  declareShiftHoliday: async (
    shiftId: MuallimShiftId,
    holidayReason?: string,
    remarks?: string
  ) => {
    const { selectedDate } = get();
    set({ isSaving: true, error: null });

    try {
      await muallimAttendanceService.declareShiftHoliday(
        selectedDate,
        shiftId,
        holidayReason,
        remarks
      );
      await get().fetchDailyAttendance(selectedDate);
      set({ isSaving: false });
    } catch (err: any) {
      set({
        isSaving: false,
        error: err?.response?.data?.message || err?.message || 'Failed to declare shift holiday',
      });
      throw err;
    }
  },

  declareFullDayHoliday: async (
    holidayReason?: string,
    remarks?: string
  ) => {
    const { selectedDate } = get();
    set({ isSaving: true, error: null });

    try {
      await muallimAttendanceService.declareFullDayHoliday(
        selectedDate,
        holidayReason,
        remarks
      );
      await get().fetchDailyAttendance(selectedDate);
      set({ isSaving: false });
    } catch (err: any) {
      set({
        isSaving: false,
        error: err?.response?.data?.message || err?.message || 'Failed to declare full day holiday',
      });
      throw err;
    }
  },

  saveDailyAttendance: async () => {
    const { selectedDate, matrix, reasonMatrix, muallims } = get();
    set({ isSaving: true, error: null });

    const records: Array<{
      userId: string;
      shiftId: MuallimShiftId;
      status: MuallimAttendanceStatusType | '' | null;
      holidayReason?: string | null;
    }> = [];

    const shiftKeys: MuallimShiftId[] = ['SHIFT_1', 'SHIFT_2', 'SHIFT_3'];

    for (const m of muallims) {
      const shifts = matrix[m.id];
      const reasons = reasonMatrix[m.id];
      if (!shifts) continue;

      for (const sId of shiftKeys) {
        const status = shifts[sId] || '';
        records.push({
          userId: m.id,
          shiftId: sId,
          status,
          holidayReason: status === 'HOLIDAY' ? (reasons?.[sId] || null) : null,
        });
      }
    }

    try {
      await muallimAttendanceService.saveBulkAttendance(selectedDate, records);
      await get().fetchDailyAttendance(selectedDate);
      set({ isSaving: false, isDirty: false });
    } catch (err: any) {
      set({
        isSaving: false,
        error: err?.response?.data?.message || err?.message || 'Failed to save attendance',
      });
      throw err;
    }
  },

  setSelectedYearMonth: (year: number, month: number) => {
    set({ selectedYear: year, selectedMonth: month });
    get().fetchMonthlyReport(year, month);
  },

  fetchMonthlyReport: async (yearParam?: number, monthParam?: number) => {
    const y = yearParam || get().selectedYear;
    const m = monthParam || get().selectedMonth;
    set({ isLoadingMonthly: true, error: null });

    try {
      const report = await muallimAttendanceService.getMonthlyReport(y, m);
      set({
        monthlyReport: report,
        isLoadingMonthly: false,
      });
    } catch (err: any) {
      set({
        isLoadingMonthly: false,
        error: err?.response?.data?.message || err?.message || 'Failed to load monthly report',
      });
    }
  },

  downloadPdf: async (yearParam?: number, monthParam?: number, userId?: string) => {
    const y = yearParam || get().selectedYear;
    const m = monthParam || get().selectedMonth;

    try {
      const blob = await muallimAttendanceService.downloadPdf(y, m, userId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Muallim_Attendance_${y}_${m}${userId ? `_${userId}` : ''}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Failed to download PDF:', err);
      throw err;
    }
  },

  clearError: () => set({ error: null }),
  reset: () => {
    set({
      selectedDate: getTodayDateStr(),
      muallims: [],
      matrix: {},
      originalMatrix: {},
      reasonMatrix: {},
      originalReasonMatrix: {},
      isDirty: false,
      isLoading: false,
      isSaving: false,
      error: null,
      monthlyReport: null,
      isLoadingMonthly: false,
    });
  },
}));

