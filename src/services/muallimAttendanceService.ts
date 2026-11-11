import { api } from '../lib/axios';
import {
  MuallimAttendanceRecord,
  MuallimMonthlySummary,
  MuallimShiftId,
  MuallimAttendanceStatusType,
  TeacherUser,
} from '../types';

export interface DailyAttendanceResponse {
  date: string;
  muallims: TeacherUser[];
  records: MuallimAttendanceRecord[];
}

export interface MonthlyReportResponse {
  year: number;
  month: number;
  monthName: string;
  daysInMonth: number;
  markedDatesCount: number;
  summaries: MuallimMonthlySummary[];
}

export const muallimAttendanceService = {
  /**
   * Get daily attendance for all active Muallims for a date
   */
  async getDailyAttendance(date: string): Promise<DailyAttendanceResponse> {
    const res = await api.get<any>('/institutional/muallim-attendance', {
      params: { date },
    });
    return res.data?.data || res.data;
  },

  /**
   * Save bulk daily attendance for multiple Muallims
   */
  async saveBulkAttendance(
    date: string,
    records: Array<{
      userId: string;
      shiftId: MuallimShiftId;
      status: MuallimAttendanceStatusType | '' | null;
      remarks?: string;
      holidayReason?: string | null;
    }>
  ): Promise<DailyAttendanceResponse> {
    const res = await api.post<any>('/institutional/muallim-attendance/bulk', {
      date,
      records,
    });
    return res.data?.data || res.data;
  },

  /**
   * Declare a shift as institutional holiday for all active Muallims
   */
  async declareShiftHoliday(
    date: string,
    shiftId: MuallimShiftId,
    holidayReason?: string,
    remarks?: string
  ): Promise<DailyAttendanceResponse> {
    const res = await api.post<any>('/institutional/muallim-attendance/shift-holiday', {
      date,
      shiftId,
      holidayReason,
      remarks,
    });
    return res.data?.data || res.data;
  },

  /**
   * Declare full day (all 3 shifts) as holiday for all active Muallims
   */
  async declareFullDayHoliday(
    date: string,
    holidayReason?: string,
    remarks?: string
  ): Promise<DailyAttendanceResponse> {
    const res = await api.post<any>('/institutional/muallim-attendance/full-day-holiday', {
      date,
      holidayReason,
      remarks,
    });
    return res.data?.data || res.data;
  },

  /**
   * Get monthly attendance report & summaries
   */
  async getMonthlyReport(
    year: number,
    month: number,
    userId?: string
  ): Promise<MonthlyReportResponse> {
    const res = await api.get<any>('/institutional/muallim-attendance/monthly', {
      params: { year, month, userId },
    });
    return res.data?.data || res.data;
  },

  /**
   * Download monthly register PDF
   */
  async downloadPdf(year: number, month: number, userId?: string): Promise<Blob> {
    const res = await api.get('/institutional/muallim-attendance/export-pdf', {
      params: { year, month, userId },
      responseType: 'blob',
    });
    return res.data;
  },
};

