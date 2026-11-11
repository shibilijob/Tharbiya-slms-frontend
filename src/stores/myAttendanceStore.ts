import { create } from 'zustand';
import { MyAttendanceData } from '../types';
import { myAttendanceService } from '../services/myAttendanceService';

interface MyAttendanceState {
  selectedYear: number;
  selectedMonth: number;
  data: MyAttendanceData | null;
  isLoading: boolean;
  isDownloadingPdf: boolean;
  error: string | null;

  setSelectedYearMonth: (year: number, month: number) => void;
  fetchMyAttendance: (year?: number, month?: number) => Promise<void>;
  downloadPdf: (year?: number, month?: number) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useMyAttendanceStore = create<MyAttendanceState>((set, get) => ({
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1,
  data: null,
  isLoading: false,
  isDownloadingPdf: false,
  error: null,

  setSelectedYearMonth: (year: number, month: number) => {
    set({ selectedYear: year, selectedMonth: month });
    get().fetchMyAttendance(year, month);
  },

  fetchMyAttendance: async (yearParam?: number, monthParam?: number) => {
    const year = yearParam || get().selectedYear;
    const month = monthParam || get().selectedMonth;
    set({ isLoading: true, error: null });

    try {
      const data = await myAttendanceService.getMyAttendance(year, month);
      set({
        data,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.message || err?.message || 'Failed to load attendance records',
      });
    }
  },

  downloadPdf: async (yearParam?: number, monthParam?: number) => {
    const year = yearParam || get().selectedYear;
    const month = monthParam || get().selectedMonth;
    set({ isDownloadingPdf: true, error: null });

    try {
      const blob = await myAttendanceService.downloadMyAttendancePdf(year, month);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `My_Attendance_${year}_${month}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      set({ isDownloadingPdf: false });
    } catch (err: any) {
      set({
        isDownloadingPdf: false,
        error: err?.response?.data?.message || err?.message || 'Failed to download attendance PDF',
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth() + 1,
      data: null,
      isLoading: false,
      isDownloadingPdf: false,
      error: null,
    }),
}));

