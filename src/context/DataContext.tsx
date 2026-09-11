import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Student,
  AttendanceRecord,
  AcademicAssessment,
  QuranProgress,
  AkhlaqRecord,
  Achievement,
  TeacherRemark,
  StudentGoal,
  Announcement,
  StudentSummary,
  AttendanceStatus,
} from '../types';
import { computeStudentSummary } from '../utils/formatters';
import { useAuth } from './AuthContext';
import {
  useStudentStore,
  useAttendanceStore,
  useAssessmentStore,
  useHifzStore,
  useBehaviourStore,
  useAnnouncementStore,
} from '../stores';
import parentService from '../services/parentService';
import type { ChildHifzResponse, ChildPracticalResponse } from '../services/parentService';

interface DataContextType {
  students: Student[];
  attendance: AttendanceRecord[];
  assessments: AcademicAssessment[];
  quranRecords: QuranProgress[];
  akhlaqRecords: AkhlaqRecord[];
  achievements: Achievement[];
  remarks: TeacherRemark[];
  goals: StudentGoal[];
  announcements: Announcement[];
  selectedChildId: string;
  isLoading: boolean;

  setSelectedChildId: (id: string) => void;
  getStudentSummary: (studentId: string) => StudentSummary | null;
  getStudentById: (studentId: string) => Student | undefined;

  // Mutations
  addStudent: (data: Omit<Student, 'id'>) => Promise<Student>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<Student>;
  deleteStudent: (id: string) => Promise<boolean>;
  markAttendance: (
    studentId: string,
    date: string,
    status: AttendanceStatus,
    teacherId: string,
    remarks?: string,
    classId?: string
  ) => Promise<AttendanceRecord>;
  batchMarkAttendance: (
    updates: Array<{ studentId: string; date: string; status: AttendanceStatus; remarks?: string }>,
    teacherId: string,
    classId?: string
  ) => Promise<void>;
  saveAssessment: (assessment: Omit<AcademicAssessment, 'id'> & { id?: string }) => Promise<AcademicAssessment>;
  updateQuranProgress: (studentId: string, updates: Partial<QuranProgress>, teacherId: string) => Promise<QuranProgress>;
  saveAkhlaq: (record: AkhlaqRecord) => Promise<AkhlaqRecord>;
  addRemark: (remark: Omit<TeacherRemark, 'id' | 'date'>) => Promise<TeacherRemark>;
  awardAchievement: (achievement: Omit<Achievement, 'id' | 'date'>) => Promise<Achievement>;
  saveGoal: (goal: Omit<StudentGoal, 'id'> & { id?: string }) => Promise<StudentGoal>;
  addAnnouncement: (ann: Omit<Announcement, 'id' | 'date'>) => Promise<Announcement>;
  deleteAnnouncement: (id: string) => Promise<boolean>;
  refreshAll: () => Promise<void>;
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const mapParentHifzToQuranProgress = (data: ChildHifzResponse): QuranProgress => {
  const latestLog = data.logs?.[0] || data.summary?.recentLogs?.[0];
  return {
    id: `quran-${data.studentId}`,
    studentId: data.studentId,
    currentSurahNumber: latestLog?.surahNumber || 1,
    currentSurahName: data.summary.currentSurah || latestLog?.surahName || '',
    currentAyahStart: latestLog?.fromAyah || data.summary.currentAyah || 1,
    currentAyahEnd: latestLog?.toAyah || data.summary.currentAyah || 1,
    hifzSurahsCount: data.summary.totalMemorizedSurahs || 0,
    sabaqLesson: data.summary.currentSurah
      ? `Surah ${data.summary.currentSurah} (Ayah ${data.summary.currentAyah || 1})`
      : '',
    sabaqiRevision: '',
    manzilRevision: '',
    tajweedLevel: data.summary.averageRating >= 4.5 ? 'Proficient' : 'Good',
    mistakesCount: latestLog?.mistakesCount || 0,
    lessonStatus: latestLog?.status === 'COMPLETED' ? 'Completed' : 'In Progress',
    lastUpdated: latestLog?.date ? new Date(latestLog.date).toISOString().split('T')[0] : '',
    teacherRemarks: latestLog?.remarks || '',
    teacherId: latestLog?.recordedBy?._id || latestLog?.recordedBy || '',
  };
};

const mapParentPracticalToAkhlaq = (data: ChildPracticalResponse): AkhlaqRecord | null => {
  const latest = data.evaluations?.[0] || data.report.recentEvaluations?.[0];
  if (!latest && data.report.totalEvaluations === 0) return null;

  const scores = (latest?.scores || []).reduce((acc: Record<string, any>, item: any) => {
    const key = item.category || item.practicalSubjectId || 'Practical';
    acc[key] = {
      category: key,
      categoryMalayalam: '',
      level: 'Good',
      score: item.score || 0,
      remarks: item.remarks || '',
    };
    return acc;
  }, {});

  return {
    id: latest?._id?.toString?.() || latest?.id || `practical-${data.studentId}`,
    studentId: data.studentId,
    evaluatedDate: latest?.date ? new Date(latest.date).toISOString().split('T')[0] : '',
    overallScore: data.report.averageScore || latest?.overallScore || 0,
    scores,
    teacherRemarks: latest?.overallRemarks || '',
    teacherId: latest?.evaluatedById?._id || latest?.evaluatedById || '',
  };
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Subscribe to Zustand stores
  const students = useStudentStore((s) => s.students);
  const selectedChildId = useStudentStore((s) => s.selectedChildId);
  const attendance = useAttendanceStore((s) => s.attendance);
  const assessments = useAssessmentStore((s) => s.assessments);
  const quranRecords = useHifzStore((s) => s.quranRecords);
  const akhlaqRecords = useBehaviourStore((s) => s.akhlaqRecords);
  const achievements = useBehaviourStore((s) => s.achievements);
  const remarks = useBehaviourStore((s) => s.remarks);
  const goals = useBehaviourStore((s) => s.goals);
  const announcements = useAnnouncementStore((s) => s.announcements);

  // Store loading states
  const studentLoading = useStudentStore((s) => s.isLoading);
  const attendanceLoading = useAttendanceStore((s) => s.isLoading);
  const assessmentLoading = useAssessmentStore((s) => s.isLoading);
  const hifzLoading = useHifzStore((s) => s.isLoading);
  const behaviourLoading = useBehaviourStore((s) => s.isLoading);
  const announcementLoading = useAnnouncementStore((s) => s.isLoading);

  const isLoading = isInitialLoading || studentLoading || attendanceLoading || assessmentLoading || hifzLoading || behaviourLoading || announcementLoading;

  const resetData = useCallback(() => {
    useStudentStore.getState().reset();
    useAttendanceStore.getState().reset();
    useAssessmentStore.getState().reset();
    useHifzStore.getState().reset();
    useBehaviourStore.getState().reset();
    useAnnouncementStore.getState().reset();
    setIsInitialLoading(false);
  }, []);

  const refreshAll = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      if (user?.role === 'PARENT') {
        const children = await useStudentStore.getState().fetchStudents();
        const childIds = children.map((child) => child.id);

        const [attendanceResults, hifzResults, practicalResults, achievementResults] = await Promise.all([
          Promise.allSettled(childIds.map((id) => parentService.getChildAttendance(id))),
          Promise.allSettled(childIds.map((id) => parentService.getChildHifz(id))),
          Promise.allSettled(childIds.map((id) => parentService.getChildPractical(id))),
          Promise.allSettled(childIds.map((id) => parentService.getChildAchievements(id))),
        ]);

        const parentAttendance = attendanceResults.flatMap((result) =>
          result.status === 'fulfilled'
            ? result.value.records.map((record: any) => ({
                id: record._id?.toString?.() || record.id,
                studentId: record.studentId?._id?.toString?.() || record.studentId?.toString?.() || record.studentId,
                date: typeof record.date === 'string'
                  ? record.date.split('T')[0]
                  : new Date(record.date).toISOString().split('T')[0],
                status: record.status === 'EXCUSED' ? 'LEAVE' : record.status === 'UNEXCUSED' ? 'ABSENT' : record.status === 'LATE' ? 'PRESENT' : record.status,
                remarks: record.remark || record.remarks || '',
                markedByTeacherId: record.markedById?._id?.toString?.() || record.markedById?.toString?.() || record.markedById || '',
              }))
            : []
        );

        const parentHifz = hifzResults.flatMap((result) =>
          result.status === 'fulfilled' ? [mapParentHifzToQuranProgress(result.value)] : []
        );

        const parentPractical = practicalResults.flatMap((result) => {
          if (result.status !== 'fulfilled') return [];
          const mapped = mapParentPracticalToAkhlaq(result.value);
          return mapped ? [mapped] : [];
        });

        const parentAchievements = achievementResults.flatMap((result) =>
          result.status === 'fulfilled'
            ? result.value.achievements.map((achievement: any) => ({
                id: achievement.id || achievement._id,
                studentId: achievement.studentId,
                title: achievement.title,
                titleMalayalam: achievement.titleMalayalam,
                category: achievement.category,
                description: achievement.description,
                badgeIcon: achievement.badgeIcon || '',
                date: typeof achievement.date === 'string'
                  ? achievement.date.split('T')[0]
                  : new Date(achievement.date).toISOString().split('T')[0],
                awardedByTeacherName: achievement.awardedByName || achievement.awardedByTeacherName || '',
              }))
            : []
        );

        useAttendanceStore.getState().setAttendance(parentAttendance);
        useHifzStore.getState().setQuranRecords(parentHifz);
        useBehaviourStore.getState().setAkhlaqRecords(parentPractical);
        useBehaviourStore.getState().setAchievements(parentAchievements);
        await useAnnouncementStore.getState().fetchAnnouncements();
        return;
      }

      await Promise.allSettled([
        useStudentStore.getState().fetchStudents(),
        useAttendanceStore.getState().fetchAttendance(),
        useAssessmentStore.getState().fetchAssessments(),
        useHifzStore.getState().fetchQuranRecords(),
        useBehaviourStore.getState().fetchBehaviourData(),
        useAnnouncementStore.getState().fetchAnnouncements(),
      ]);
    } catch (e) {
      console.error('Failed to load madrasa data', e);
    } finally {
      setIsInitialLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user) {
      refreshAll();
    } else {
      resetData();
    }
  }, [user, refreshAll, resetData]);

  const setSelectedChildId = useCallback((id: string) => {
    useStudentStore.getState().setSelectedChildId(id);
  }, []);

  const getStudentById = useCallback((studentId: string) => {
    return useStudentStore.getState().getStudentById(studentId);
  }, []);

  const getStudentSummary = useCallback(
    (studentId: string): StudentSummary | null => {
      const student = students.find((s) => s.id === studentId);
      if (!student) return null;

      return computeStudentSummary(
        student,
        attendance,
        assessments,
        quranRecords,
        akhlaqRecords,
        remarks,
        achievements,
        goals
      );
    },
    [students, attendance, assessments, quranRecords, akhlaqRecords, remarks, achievements, goals]
  );

  const addStudent = useCallback(async (data: Omit<Student, 'id'>) => {
    return useStudentStore.getState().addStudent(data);
  }, []);

  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    return useStudentStore.getState().updateStudent(id, updates);
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    return useStudentStore.getState().deleteStudent(id);
  }, []);

  const markAttendance = useCallback(
    async (
      studentId: string,
      date: string,
      status: AttendanceStatus,
      teacherId: string,
      remarksText?: string,
      classId?: string
    ) => {
      return useAttendanceStore.getState().markAttendance(studentId, date, status, teacherId, remarksText, classId);
    },
    []
  );

  const batchMarkAttendance = useCallback(
    async (
      updates: Array<{ studentId: string; date: string; status: AttendanceStatus; remarks?: string }>,
      teacherId: string,
      classId?: string
    ) => {
      return useAttendanceStore.getState().batchMarkAttendance(updates, teacherId, classId);
    },
    []
  );

  const saveAssessment = useCallback(async (assessment: Omit<AcademicAssessment, 'id'> & { id?: string }) => {
    return useAssessmentStore.getState().saveAssessment(assessment);
  }, []);

  const updateQuranProgress = useCallback(
    async (studentId: string, updates: Partial<QuranProgress>, teacherId: string) => {
      return useHifzStore.getState().updateQuranProgress(studentId, updates, teacherId);
    },
    []
  );

  const saveAkhlaq = useCallback(async (record: AkhlaqRecord) => {
    return useBehaviourStore.getState().saveAkhlaq(record);
  }, []);

  const addRemark = useCallback(async (remarkData: Omit<TeacherRemark, 'id' | 'date'>) => {
    return useBehaviourStore.getState().addRemark(remarkData);
  }, []);

  const awardAchievement = useCallback(async (achievementData: Omit<Achievement, 'id' | 'date'>) => {
    return useBehaviourStore.getState().awardAchievement(achievementData);
  }, []);

  const saveGoal = useCallback(async (goalData: Omit<StudentGoal, 'id'> & { id?: string }) => {
    return useBehaviourStore.getState().saveGoal(goalData);
  }, []);

  const addAnnouncement = useCallback(async (annData: Omit<Announcement, 'id' | 'date'>) => {
    return useAnnouncementStore.getState().addAnnouncement(annData);
  }, []);

  const deleteAnnouncement = useCallback(async (id: string) => {
    return useAnnouncementStore.getState().deleteAnnouncement(id);
  }, []);

  const contextValue = useMemo(
    () => ({
      students,
      attendance,
      assessments,
      quranRecords,
      akhlaqRecords,
      achievements,
      remarks,
      goals,
      announcements,
      selectedChildId,
      isLoading,
      setSelectedChildId,
      getStudentSummary,
      getStudentById,
      addStudent,
      updateStudent,
      deleteStudent,
      markAttendance,
      batchMarkAttendance,
      saveAssessment,
      updateQuranProgress,
      saveAkhlaq,
      addRemark,
      awardAchievement,
      saveGoal,
      addAnnouncement,
      deleteAnnouncement,
      refreshAll,
      resetData,
    }),
    [
      students,
      attendance,
      assessments,
      quranRecords,
      akhlaqRecords,
      achievements,
      remarks,
      goals,
      announcements,
      selectedChildId,
      isLoading,
      setSelectedChildId,
      getStudentSummary,
      getStudentById,
      addStudent,
      updateStudent,
      deleteStudent,
      markAttendance,
      batchMarkAttendance,
      saveAssessment,
      updateQuranProgress,
      saveAkhlaq,
      addRemark,
      awardAchievement,
      saveGoal,
      addAnnouncement,
      deleteAnnouncement,
      refreshAll,
      resetData,
    ]
  );

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
