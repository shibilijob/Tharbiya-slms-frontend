import apiClient, { api } from "../lib/axios";
import type { Achievement } from "../types";
import type { HifzTarget } from "./hifzService";
import { getBlobDownloadErrorMessage, saveBlobAsFile } from "../utils/downloadFile";

const unwrapApiData = <T>(response: any): T => {
  return response?.data !== undefined ? response.data : response;
};

export interface ParentProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  madrasaName: string;
  children: ParentChildSummary[];
}

export interface ParentChildSummary {
  id: string;
  name: string;
  admissionNumber: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth?: string;
  classId?: string;
  className: string;
  classDivision?: string;
  teacherId?: string;
  teacherName?: string;
  teacherPhone?: string;
}

export interface ChildProfile {
  id: string;
  admissionNumber: string;
  name: string;
  gender: "MALE" | "FEMALE";
  dateOfBirth?: string;
  address?: string;
  admissionDate: string;
  classId: string;
  className: string;
  classDivision?: string;
  teacherName: string;
  teacherPhone?: string;
  teacherDesignation?: string;
  attendancePercentage: number;
  hifzSummary: {
    studentId: string;
    totalMemorizedSurahs: number;
    currentSurah: string;
    currentAyah: number;
    averageRating: number;
    recentLogs: any[];
  };
  practicalAverageScore: number;
  recentAchievements: Achievement[];
}

export interface ChildAttendanceResponse {
  studentId: string;
  studentName: string;
  className: string;
  summary: {
    studentId: string;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    holidayDays: number;
    percentage: number;
  };
  records: any[];
}

export interface ChildHifzResponse {
  studentId: string;
  studentName: string;
  student?: {
    id: string;
    name: string;
    classId: string;
    className: string;
  };
  className: string;
  summary: {
    studentId: string;
    totalMemorizedSurahs: number;
    currentSurah: string;
    currentAyah: number;
    averageRating: number;
    recentLogs: any[];
  };
  target: HifzTarget | null;
  targets: Array<{
    target: HifzTarget;
    completedAyahs: number[];
    progressPercentage: number;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
    logs: any[];
  }>;
  completedAyahs: number[];
  logs: any[];
}

export interface ChildPracticalResponse {
  studentId: string;
  studentName: string;
  className: string;
  report: {
    studentId: string;
    averageScore: number;
    totalEvaluations: number;
    categoryBreakdown: Record<string, number>;
    recentEvaluations: any[];
  };
  evaluations: any[];
}

export interface ChildTimetableResponse {
  classId: string;
  className: string;
  classDivision?: string;
  teacherName?: string;
  schedules: Record<string, any[]>;
}

export interface ChildAchievementsResponse {
  studentId: string;
  studentName: string;
  className: string;
  totalCount: number;
  achievements: Achievement[];
}

export const parentService = {
  /**
   * Get Parent Profile & Linked Children list
   */
  async getProfile(): Promise<ParentProfile> {
    const res = await api.get<ParentProfile>("/parent/profile");
    return unwrapApiData<ParentProfile>(res);
  },

  /**
   * Get list of children linked to current parent
   */
  async getChildren(): Promise<ParentChildSummary[]> {
    const res = await api.get<ParentChildSummary[]>("/parent/children");
    return unwrapApiData<ParentChildSummary[]>(res);
  },

  /**
   * Get comprehensive Child Profile
   */
  async getChildProfile(studentId: string): Promise<ChildProfile> {
    const res = await api.get<ChildProfile>(`/parent/children/${studentId}`);
    return unwrapApiData<ChildProfile>(res);
  },

  /**
   * Get Child Daily Attendance Calendar & Stats
   */
  async getChildAttendance(
    studentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ChildAttendanceResponse> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const res = await api.get<ChildAttendanceResponse>(
      `/parent/children/${studentId}/attendance`,
      { params }
    );
    return unwrapApiData<ChildAttendanceResponse>(res);
  },

  /**
   * Get Child Quran Recitation and Hifz Progress History
   */
  async getChildHifz(studentId: string, limit = 30): Promise<ChildHifzResponse> {
    const res = await api.get<ChildHifzResponse>(
      `/parent/children/${studentId}/hifz`,
      { params: { limit } }
    );
    return unwrapApiData<ChildHifzResponse>(res);
  },

  /**
   * Get Child Practical & Adab Score Report Card
   */
  async getChildPractical(studentId: string): Promise<ChildPracticalResponse> {
    const res = await api.get<ChildPracticalResponse>(
      `/parent/children/${studentId}/practical`
    );
    return unwrapApiData<ChildPracticalResponse>(res);
  },

  /**
   * Get Child Class Timetable Schedule
   */
  async getChildTimetable(studentId: string): Promise<ChildTimetableResponse> {
    const res = await api.get<ChildTimetableResponse>(
      `/parent/children/${studentId}/timetable`
    );
    return unwrapApiData<ChildTimetableResponse>(res);
  },

  /**
   * Get Child Awards & Achievements
   */
  async getChildAchievements(studentId: string): Promise<ChildAchievementsResponse> {
    const res = await api.get<ChildAchievementsResponse>(
      `/parent/children/${studentId}/achievements`
    );
    return unwrapApiData<ChildAchievementsResponse>(res);
  },

  /**
   * ==========================================
   * Sadhr Muallim Parent Management
   * ==========================================
   */

  /**
   * Get all registered parents
   */
  async getAllParents(): Promise<any[]> {
    const res = await api.get<any[]>("/sadhr/parents");
    return res.data || [];
  },

  /**
   * Register a new Parent in the database
   */
  async createParent(data: { name: string; phone: string; email?: string }): Promise<any> {
    const res = await api.post<any>("/sadhr/parents", data);
    return res.data;
  },

  /**
   * Download current active parent credential cards as a PDF.
   */
  async downloadAllParentDetails(): Promise<void> {
    try {
      const res = await apiClient.get("/sadhr/parents/export", {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      });

      saveBlobAsFile(res.data, "parent-details.pdf", "application/pdf");
    } catch (error: any) {
      throw new Error(
        await getBlobDownloadErrorMessage(error, "Failed to download parent details PDF.")
      );
    }
  },

  /**
   * Update Parent details
   */
  async updateParent(id: string, data: { name?: string; phone?: string; email?: string; password?: string }): Promise<any> {
    const res = await api.patch<any>(`/sadhr/parents/${id}`, data);
    return res.data;
  },

  /**
   * Delete Parent
   */
  async deleteParent(id: string): Promise<any> {
    const res = await api.delete<any>(`/sadhr/parents/${id}`);
    return res.data;
  },
};

export default parentService;
