export type UserRole = 'PARENT' | 'TEACHER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  phone: string;
  avatar?: string;
  madrasaName: string;
}

export interface ParentUser extends User {
  role: 'PARENT';
  studentIds: string[];
}

export interface TeacherUser extends User {
  role: 'TEACHER';
  assignedClasses: string[]; // e.g. ["5A", "4B"]
  assignedSubjects: string[];
  designation: string; // e.g. "Senior Usthad / Quran Instructor"
}

export interface AdminUser extends User {
  role: 'ADMIN';
  designation: string; // e.g. "Sadhr Muallim (Sadhr Mudarris) & Class 7 Mentor"
  assignedClasses: string[]; // e.g. ["7", "6"]
  assignedSubjects: string[]; // e.g. ["Fiqh", "Quran", "Islamic Studies"]
}

export type Gender = 'MALE' | 'FEMALE';
export type StudentStatus = 'ACTIVE' | 'INACTIVE';

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  malayalamName?: string;
  gender: Gender;
  dob: string;
  class: string; // e.g. "5"
  division?: string; // Optional legacy division
  parentId: string;
  parentName: string;
  parentPhone: string;
  assignedTeacherId: string;
  teacherName: string;
  admissionDate: string;
  status: StudentStatus;
  avatar?: string;
  address?: string;
  bloodGroup?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  remarks?: string;
  markedByTeacherId: string;
}

export type SubjectName =
  | 'Quran'
  | 'Hifz'
  | 'Tajweed'
  | 'Arabic'
  | 'Islamic Studies'
  | 'Fiqh'
  | 'Akhlaq';

export type ExamTerm = 'Half Yearly' | 'Annual';

export interface AcademicAssessment {
  id: string;
  studentId: string;
  subject: SubjectName;
  examTerm: ExamTerm;
  date: string;
  maxMarks: number;
  obtainedMarks: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  remarks?: string;
  teacherId: string;
}

export type TajweedLevel = 'Beginner' | 'Developing' | 'Good' | 'Proficient' | 'Mastery';
export type LessonStatus = 'In Progress' | 'Completed' | 'Revision Needed';

export interface QuranProgress {
  id: string;
  studentId: string;
  currentSurahNumber: number;
  currentSurahName: string;
  currentAyahStart: number;
  currentAyahEnd: number;
  hifzSurahsCount: number; // Completed surahs
  sabaqLesson: string; // e.g. "Surah Al-Mulk: 1-10"
  sabaqiRevision: string; // e.g. "Surah Al-Waqi'ah"
  manzilRevision: string; // e.g. "Juz 29"
  tajweedLevel: TajweedLevel;
  mistakesCount: number; // e.g. 1
  lessonStatus: LessonStatus;
  lastUpdated: string;
  teacherRemarks?: string;
  teacherId: string;
}

export type AkhlaqCategory =
  | 'Discipline'
  | 'Respect'
  | 'Cleanliness'
  | 'Cooperation'
  | 'Responsibility'
  | 'Participation'
  | string;

export type AkhlaqLevel =
  | 'Needs Attention'
  | 'Developing'
  | 'Good'
  | 'Very Good'
  | 'Excellent';

export interface AkhlaqScore {
  category: string;
  categoryMalayalam: string;
  level: AkhlaqLevel;
  score: number; // e.g. 5, 10, etc.
  maxScore?: number; // e.g. 5, 10, 20, 25, 50, 100
  remarks?: string;
}

export interface AkhlaqRecord {
  id: string;
  studentId: string;
  evaluatedDate: string;
  overallScore: number; // percentage, e.g. 90
  scores: Record<string, AkhlaqScore>;
  teacherRemarks?: string;
  teacherId: string;
}

export type AchievementCategory =
  | 'Weekly Hifz Completion'
  | 'Monthly Practical Score Topper'
  | 'Monthly Attendance Topper';

export interface Achievement {
  id: string;
  studentId: string;
  title: string;
  titleMalayalam?: string;
  category: AchievementCategory;
  description: string;
  badgeIcon: string;
  date: string;
  awardedByTeacherName: string;
}

export interface TeacherRemark {
  id: string;
  studentId: string;
  teacherId: string;
  teacherName: string;
  category: 'Quran' | 'Studies' | 'Attendance' | 'Akhlaq' | 'General';
  remark: string;
  date: string;
  isImportant?: boolean;
}

export interface StudentGoal {
  id: string;
  studentId: string;
  title: string;
  category: 'Quran' | 'Tajweed' | 'Attendance' | 'Academic' | 'Akhlaq';
  targetDate: string;
  status: 'In Progress' | 'Achieved';
  progressPercentage: number;
}

export interface StudentSummary {
  student: Student;
  overallProgress: number; // e.g. 86
  quranProgress: number;   // e.g. 91
  studiesProgress: number; // e.g. 86
  attendancePercentage: number; // e.g. 94
  akhlaqScore: number;     // e.g. 90
  latestRemark?: TeacherRemark;
  latestAchievement?: Achievement;
  activeGoals: StudentGoal[];
}

export interface Notification {
  id: string;
  userId: string; // Or studentId for parents
  title: string;
  message: string;
  category: 'ATTENDANCE' | 'QURAN' | 'REMARK' | 'ACHIEVEMENT' | 'ANNOUNCEMENT' | 'ASSESSMENT';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  targetAudience: 'ALL' | 'PARENTS' | 'TEACHERS';
  authorName: string;
  important: boolean;
}

export interface ClassInfo {
  id: string;
  name: string; // e.g. "Class 5"
  division?: string;
  classTeacherId: string;
  classTeacherName: string;
  studentCount: number;
  averageAttendance: number;
  averageProgress: number;
}
