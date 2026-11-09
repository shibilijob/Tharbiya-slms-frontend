import {
  Student,
  AttendanceRecord,
  AcademicAssessment,
  QuranProgress,
  AkhlaqRecord,
  TeacherRemark,
  Achievement,
  StudentGoal,
  StudentSummary,
  MonthlyAttendanceBacklogRecord
} from '../types';
import { getGradeColor } from './gradeCalculator';

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatTimeAgo(timestamp?: string): string {
  if (!timestamp) return 'recently';
  try {
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  } catch {
    return 'recently';
  }
}

export function calculateAttendancePercentage(
  studentId: string,
  records: AttendanceRecord[],
  backlogs?: MonthlyAttendanceBacklogRecord[]
): number {
  const studentRecords = records.filter(r => String(r.studentId) === String(studentId));
  const studentBacklogs = backlogs ? backlogs.filter(b => String(b.studentId) === String(studentId)) : [];

  const dailyPresent = studentRecords.filter(r => r.status === 'PRESENT').length;
  const dailyWorking = studentRecords.filter(r => r.status !== 'HOLIDAY').length;

  const backlogAttended = studentBacklogs.reduce((sum, b) => sum + (Number(b.attendedDays) || 0), 0);
  const backlogWorking = studentBacklogs.reduce((sum, b) => sum + (Number(b.totalWorkingDays) || 0), 0);

  const totalAttended = dailyPresent + backlogAttended;
  const totalWorking = dailyWorking + backlogWorking;

  if (totalWorking === 0) {
    return studentRecords.length === 0 && studentBacklogs.length === 0 ? 0 : 100;
  }
  return Math.round((totalAttended / totalWorking) * 100);
}

export function calculateStudiesScore(studentId: string, assessments: AcademicAssessment[]): number {
  const studentAssessments = assessments.filter(a => String(a.studentId) === String(studentId));
  if (studentAssessments.length === 0) return 0;
  const totalObtained = studentAssessments.reduce((acc, curr) => acc + (curr.obtainedMarks / curr.maxMarks) * 100, 0);
  return Math.round(totalObtained / studentAssessments.length);
}

export function computeStudentSummary(
  student: Student,
  allAttendance: AttendanceRecord[],
  allAssessments: AcademicAssessment[],
  allQuran: QuranProgress[],
  allAkhlaq: AkhlaqRecord[],
  allRemarks: TeacherRemark[],
  allAchievements: Achievement[],
  allGoals: StudentGoal[],
  allBacklogs?: MonthlyAttendanceBacklogRecord[]
): StudentSummary {
  const targetId = String(student.id || (student as any)._id || '');
  const attendancePct = calculateAttendancePercentage(targetId, allAttendance, allBacklogs);
  const studiesScore = calculateStudiesScore(targetId, allAssessments);
  
  const quranRec = allQuran.find(q => String(q.studentId) === targetId);
  const quranScore = quranRec ? Math.min(98, Math.max(0, 75 + (quranRec.hifzSurahsCount * 0.8) - (quranRec.mistakesCount * 3))) : 0;

  const akhlaqRec = allAkhlaq.find(a => String(a.studentId) === targetId);
  const akhlaqScore = akhlaqRec ? akhlaqRec.overallScore : 0;

  const overall = Math.round((quranScore * 0.35) + (studiesScore * 0.3) + (attendancePct * 0.2) + (akhlaqScore * 0.15));

  const studentRemarks = allRemarks.filter(r => String((r.studentId as any)?._id || r.studentId) === targetId);
  const studentAchievements = allAchievements.filter(a => String((a.studentId as any)?._id || a.studentId) === targetId);
  const studentGoals = allGoals.filter(g => String((g.studentId as any)?._id || g.studentId) === targetId);

  return {
    student,
    overallProgress: Math.min(100, Math.max(0, overall)),
    quranProgress: Math.round(quranScore),
    studiesProgress: studiesScore,
    attendancePercentage: attendancePct,
    akhlaqScore,
    latestRemark: studentRemarks[0],
    latestAchievement: studentAchievements[0],
    activeGoals: studentGoals
  };
}

export function getStatusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case 'PRESENT':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'LEAVE':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'ABSENT':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'HOLIDAY':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'ACTIVE':
      return 'bg-[#DDEDE5] text-[#084C3A] border-[#bbdcd0]';
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getGradeBadgeClass(grade: string): string {
  return getGradeColor(grade);
}
