import { api } from "../lib/axios";

export interface MarkAttendancePayload {
  classId: string;
  date?: string;
  records: Array<{
    studentId: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
    remark?: string;
  }>;
}

export interface RecordHifzPayload {
  studentId: string;
  classId?: string;
  sessionType: "SABAQ" | "SABQI" | "MANZIL" | "REVISION";
  surahNumber: number;
  surahName: string;
  fromAyah: number;
  toAyah: number;
  rating: 1 | 2 | 3 | 4 | 5;
  mistakesCount?: number;
  remarks?: string;
  date?: string;
}

export interface RecordPracticalPayload {
  studentId: string;
  classId?: string;
  scores: Array<{
    category: string;
    score: number;
    remarks?: string;
  }>;
  overallScore: number;
  overallRemarks?: string;
  term?: string;
  month?: string;
  date?: string;
}

export interface SubjectPayload {
  name: string;
  classId: string;
}

export interface AchievementPayload {
  studentId: string;
  classId?: string;
  title: string;
  titleMalayalam?: string;
  category?: string;
  description: string;
  badgeIcon?: string;
  date?: string;
}

export interface TimetablePeriodPayload {
  classId: string;
  day: "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject: string;
  subjectMalayalam?: string;
  teacherName?: string;
  teacherId?: string;
  room?: string;
  notes?: string;
}

export const muallimService = {
  /**
   * Workspace Dashboard Overview Stats
   */
  async getDashboard() {
    const res = await api.get("/muallim/dashboard");
    return res.data;
  },

  /**
   * Class Roster & Student Details
   */
  async getClassRoster(classId: string) {
    const res = await api.get(`/muallim/classes/${classId}/roster`);
    return res.data;
  },

  /**
   * Attendance Operations
   */
  async markClassAttendance(data: MarkAttendancePayload) {
    const res = await api.post("/muallim/attendance", data);
    return res.data;
  },

  async getClassAttendance(classId: string, date?: string) {
    const params = date ? { date } : {};
    const res = await api.get(`/muallim/attendance/class/${classId}`, { params });
    return res.data;
  },

  async getStudentAttendance(studentId: string, startDate?: string, endDate?: string) {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await api.get(`/muallim/attendance/student/${studentId}`, { params });
    return res.data;
  },

  /**
   * Quran / Hifz Progress Operations
   */
  async recordHifzLog(data: RecordHifzPayload) {
    const res = await api.post("/muallim/hifz", data);
    return res.data;
  },

  async getStudentHifzHistory(studentId: string, limit?: number) {
    const params = limit ? { limit } : {};
    const res = await api.get(`/muallim/hifz/student/${studentId}`, { params });
    return res.data;
  },

  /**
   * Practical Evaluation Operations
   */
  async recordPracticalEvaluation(data: RecordPracticalPayload) {
    const res = await api.post("/muallim/practical", data);
    return res.data;
  },

  async getStudentPracticalReport(studentId: string) {
    const res = await api.get(`/muallim/practical/student/${studentId}/report`);
    return res.data;
  },

  /**
   * Academic Subject Operations
   */
  async addSubject(data: SubjectPayload) {
    const res = await api.post("/muallim/subjects", data);
    return res.data;
  },

  async getSubjects(classId?: string) {
    const url = classId ? `/muallim/subjects/class/${classId}` : "/muallim/subjects";
    const res = await api.get(url);
    return res.data;
  },

  async updateSubject(id: string, data: Partial<SubjectPayload>) {
    const res = await api.patch(`/muallim/subjects/${id}`, data);
    return res.data;
  },

  async removeSubject(id: string) {
    const res = await api.delete(`/muallim/subjects/${id}`);
    return res.data;
  },

  /**
   * Practical Subject Operations
   */
  async addPracticalSubject(data: SubjectPayload) {
    const res = await api.post("/muallim/practical-subjects", data);
    return res.data;
  },

  async getPracticalSubjects(classId?: string) {
    const url = classId
      ? `/muallim/practical-subjects/class/${classId}`
      : "/muallim/practical-subjects";
    const res = await api.get(url);
    return res.data;
  },

  async updatePracticalSubject(id: string, data: Partial<SubjectPayload>) {
    const res = await api.patch(`/muallim/practical-subjects/${id}`, data);
    return res.data;
  },

  async removePracticalSubject(id: string) {
    const res = await api.delete(`/muallim/practical-subjects/${id}`);
    return res.data;
  },

  /**
   * Awards & Achievements Operations
   */
  async createAchievement(data: AchievementPayload) {
    const res = await api.post("/muallim/achievements", data);
    return res.data;
  },

  async getAchievements(studentId?: string, classId?: string) {
    const params: Record<string, string> = {};
    if (studentId) params.studentId = studentId;
    if (classId) params.classId = classId;
    const res = await api.get("/muallim/achievements", { params });
    return res.data;
  },

  async deleteAchievement(id: string) {
    const res = await api.delete(`/muallim/achievements/${id}`);
    return res.data;
  },

  /**
   * Timetable Periods Operations
   */
  async addPeriod(data: TimetablePeriodPayload) {
    const res = await api.post("/muallim/timetable/periods", data);
    return res.data;
  },

  async getPeriods(classId?: string, day?: string) {
    const params: Record<string, string> = {};
    if (classId) params.classId = classId;
    if (day) params.day = day;
    const res = await api.get("/muallim/timetable/periods", { params });
    return res.data;
  },

  async updatePeriod(id: string, data: Partial<TimetablePeriodPayload>) {
    const res = await api.patch(`/muallim/timetable/periods/${id}`, data);
    return res.data;
  },

  async deletePeriod(id: string) {
    const res = await api.delete(`/muallim/timetable/periods/${id}`);
    return res.data;
  },
};

export default muallimService;
