import { api } from '../lib/axios';
import { MyAttendanceData } from '../types';

export const myAttendanceService = {
  /**
   * Get personal attendance records & monthly summary for the authenticated Muallim
   * Secure endpoint: strictly derives user identity from session/token
   */
  async getMyAttendance(year?: number, month?: number): Promise<MyAttendanceData> {
    const res = await api.get<any>('/muallim/my-attendance', {
      params: { year, month },
    });
    return res.data?.data || res.data;
  },

  /**
   * Download personal monthly attendance PDF for the authenticated Muallim
   */
  async downloadMyAttendancePdf(year?: number, month?: number): Promise<Blob> {
    const res = await api.get('/muallim/my-attendance/export-pdf', {
      params: { year, month },
      responseType: 'blob',
    });
    return res.data;
  },
};

