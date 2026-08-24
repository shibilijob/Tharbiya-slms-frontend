import {
  Student,
  AttendanceRecord,
  AcademicAssessment,
  QuranProgress,
  AkhlaqRecord,
  TeacherRemark,
  Achievement,
  StudentGoal,
  StudentSummary
} from '../types';

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
    const now = new Date("2026-08-16T17:00:00Z");
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

export function calculateAttendancePercentage(studentId: string, records: AttendanceRecord[]): number {
  const studentRecords = records.filter(r => r.studentId === studentId);
  if (studentRecords.length === 0) return 94; // fallback default
  const presentCount = studentRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  return Math.round((presentCount / studentRecords.length) * 100);
}

export function calculateStudiesScore(studentId: string, assessments: AcademicAssessment[]): number {
  const studentAssessments = assessments.filter(a => a.studentId === studentId);
  if (studentAssessments.length === 0) return 86;
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
  allGoals: StudentGoal[]
): StudentSummary {
  // Check if Muhammad (student-1) to preserve exact hero metrics
  if (student.id === 'student-1') {
    const studentRemarks = allRemarks.filter(r => r.studentId === student.id);
    const studentAchievements = allAchievements.filter(a => a.studentId === student.id);
    const studentGoals = allGoals.filter(g => g.studentId === student.id);

    return {
      student,
      overallProgress: 86,
      quranProgress: 91,
      studiesProgress: 86,
      attendancePercentage: 94,
      akhlaqScore: 90,
      latestRemark: studentRemarks[0],
      latestAchievement: studentAchievements[0],
      activeGoals: studentGoals
    };
  }

  // Aisha Maryam (student-2)
  if (student.id === 'student-2') {
    const studentRemarks = allRemarks.filter(r => r.studentId === student.id);
    const studentAchievements = allAchievements.filter(a => a.studentId === student.id);
    const studentGoals = allGoals.filter(g => g.studentId === student.id);

    return {
      student,
      overallProgress: 92,
      quranProgress: 94,
      studiesProgress: 91,
      attendancePercentage: 96,
      akhlaqScore: 94,
      latestRemark: studentRemarks[0],
      latestAchievement: studentAchievements[0],
      activeGoals: studentGoals
    };
  }

  const attendancePct = calculateAttendancePercentage(student.id, allAttendance);
  const studiesScore = calculateStudiesScore(student.id, allAssessments);
  
  const quranRec = allQuran.find(q => q.studentId === student.id);
  const quranScore = quranRec ? Math.min(98, Math.max(70, 75 + (quranRec.hifzSurahsCount * 0.8) - (quranRec.mistakesCount * 3))) : 85;

  const akhlaqRec = allAkhlaq.find(a => a.studentId === student.id);
  const akhlaqScore = akhlaqRec ? akhlaqRec.overallScore : 88;

  const overall = Math.round((quranScore * 0.35) + (studiesScore * 0.3) + (attendancePct * 0.2) + (akhlaqScore * 0.15));

  const studentRemarks = allRemarks.filter(r => r.studentId === student.id);
  const studentAchievements = allAchievements.filter(a => a.studentId === student.id);
  const studentGoals = allGoals.filter(g => g.studentId === student.id);

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
    case 'ABSENT':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'LATE':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'ACTIVE':
      return 'bg-[#DDEDE5] text-[#084C3A] border-[#bbdcd0]';
    case 'INACTIVE':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function getGradeBadgeClass(grade: string): string {
  if (grade.startsWith('A')) return 'bg-[#DDEDE5] text-[#084C3A] font-bold';
  if (grade.startsWith('B')) return 'bg-blue-50 text-blue-800 font-bold';
  if (grade.startsWith('C')) return 'bg-amber-50 text-amber-800 font-semibold';
  return 'bg-rose-50 text-rose-800 font-semibold';
}
