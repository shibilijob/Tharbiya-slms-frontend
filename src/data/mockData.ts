import {
  Student,
  ParentUser,
  MuallimUser,
  TeacherUser,
  SadhrMuallimUser,
  AdminUser,
  AttendanceRecord,
  AcademicAssessment,
  QuranProgress,
  AkhlaqRecord,
  Achievement,
  TeacherRemark,
  StudentGoal,
  Notification,
  Announcement,
  ClassInfo
} from '../types';

export const CURRENT_MADRASA_NAME = "Darunnajath Mundambra";

export const MOCK_ADMIN: SadhrMuallimUser = {
  id: "admin-1",
  name: "Shihabudheen Saadi",
  role: "SADHR_MUALLIM",
  email: "sadhrmuallim@darunnajath.edu",
  phone: "9847001122",
  designation: "Sadhr Muallim (Sadhr Mudarris) & Class 7 Mentor",
  assignedClasses: ["7", "6"],
  madrasaName: CURRENT_MADRASA_NAME
};

export const MOCK_SADHR = MOCK_ADMIN;
export const MOCK_TEACHERS: MuallimUser[] = [];
export const MOCK_MUALLIMS: MuallimUser[] = MOCK_TEACHERS;

export const MOCK_PARENTS: ParentUser[] = [];

export const MOCK_STUDENTS: Student[] = [];

export const MOCK_CLASSES: ClassInfo[] = [];

export const MOCK_QURAN_RECORDS: QuranProgress[] = [];

export const MOCK_ASSESSMENTS: AcademicAssessment[] = [];

export const MOCK_AKHLAQ_RECORDS: AkhlaqRecord[] = [];

export const MOCK_REMARKS: TeacherRemark[] = [];

export const MOCK_GOALS: StudentGoal[] = [];

export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [];

export const MOCK_ACHIEVEMENTS: Achievement[] = [];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [];

export const MOCK_NOTIFICATIONS: Notification[] = [];
