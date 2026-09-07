import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  AttendanceStatus
} from '../types';
import { studentService } from '../services/studentService';
import { attendanceService } from '../services/attendanceService';
import { assessmentService } from '../services/assessmentService';
import { quranService } from '../services/quranService';
import { behaviourService } from '../services/behaviourService';
import { achievementService } from '../services/achievementService';
import { announcementService } from '../services/announcementService';
import { computeStudentSummary } from '../utils/formatters';

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
  markAttendance: (studentId: string, date: string, status: AttendanceStatus, teacherId: string, remarks?: string) => Promise<AttendanceRecord>;
  batchMarkAttendance: (updates: Array<{ studentId: string; date: string; status: AttendanceStatus; remarks?: string }>, teacherId: string) => Promise<void>;
  saveAssessment: (assessment: Omit<AcademicAssessment, 'id'> & { id?: string }) => Promise<AcademicAssessment>;
  updateQuranProgress: (studentId: string, updates: Partial<QuranProgress>, teacherId: string) => Promise<QuranProgress>;
  saveAkhlaq: (record: AkhlaqRecord) => Promise<AkhlaqRecord>;
  addRemark: (remark: Omit<TeacherRemark, 'id' | 'date'>) => Promise<TeacherRemark>;
  awardAchievement: (achievement: Omit<Achievement, 'id' | 'date'>) => Promise<Achievement>;
  saveGoal: (goal: Omit<StudentGoal, 'id'> & { id?: string }) => Promise<StudentGoal>;
  addAnnouncement: (ann: Omit<Announcement, 'id' | 'date'>) => Promise<Announcement>;
  deleteAnnouncement: (id: string) => Promise<boolean>;
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [assessments, setAssessments] = useState<AcademicAssessment[]>([]);
  const [quranRecords, setQuranRecords] = useState<QuranProgress[]>([]);
  const [akhlaqRecords, setAkhlaqRecords] = useState<AkhlaqRecord[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [remarks, setRemarks] = useState<TeacherRemark[]>([]);
  const [goals, setGoals] = useState<StudentGoal[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("student-1");
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [
        studList,
        attList,
        assList,
        qurList,
        akhList,
        achList,
        remList,
        goalList,
        annList
      ] = await Promise.all([
        studentService.getAll(),
        attendanceService.getAll(),
        assessmentService.getAll(),
        quranService.getAll(),
        behaviourService.getAkhlaqAll(),
        achievementService.getAll(),
        behaviourService.getRemarksAll(),
        behaviourService.getGoalsAll(),
        announcementService.getAll()
      ]);

      setStudents(studList);
      if (studList.length > 0) {
        setSelectedChildId(prev => {
          const exists = studList.some(s => s.id === prev);
          return exists ? prev : studList[0].id;
        });
      }
      setAttendance(attList);
      setAssessments(assList);
      setQuranRecords(qurList);
      setAkhlaqRecords(akhList);
      setAchievements(achList);
      setRemarks(remList);
      setGoals(goalList);
      setAnnouncements(annList);
    } catch (e) {
      console.error("Failed to load madrasa data", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStudentById = useCallback((studentId: string) => {
    return students.find(s => s.id === studentId) || students[0];
  }, [students]);

  const getStudentSummary = useCallback((studentId: string): StudentSummary | null => {
    const student = students.find(s => s.id === studentId) || students[0];
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
  }, [students, attendance, assessments, quranRecords, akhlaqRecords, remarks, achievements, goals]);

  // Mutations
  const addStudent = async (data: Omit<Student, 'id'>) => {
    const newStudent = await studentService.create(data);
    setStudents(prev => [newStudent, ...prev]);
    return newStudent;
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    const updated = await studentService.update(id, updates);
    setStudents(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  };

  const deleteStudent = async (id: string) => {
    await studentService.delete(id);
    setStudents(prev => prev.filter(s => s.id !== id));
    return true;
  };

  const markAttendance = async (studentId: string, date: string, status: AttendanceStatus, teacherId: string, remarksText?: string) => {
    const record = await attendanceService.markAttendance(studentId, date, status, teacherId, remarksText);
    setAttendance(prev => {
      const idx = prev.findIndex(r => r.studentId === studentId && r.date === date);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [record, ...prev];
    });
    return record;
  };

  const batchMarkAttendance = async (updates: Array<{ studentId: string; date: string; status: AttendanceStatus; remarks?: string }>, teacherId: string) => {
    const updatedRecords = await attendanceService.batchMarkAttendance(updates, teacherId);
    setAttendance(prev => {
      const copy = [...prev];
      updatedRecords.forEach(u => {
        const idx = copy.findIndex(r => r.studentId === u.studentId && r.date === u.date);
        if (idx > -1) {
          copy[idx] = u;
        } else {
          copy.unshift(u);
        }
      });
      return copy;
    });
  };

  const saveAssessment = async (assessment: Omit<AcademicAssessment, 'id'> & { id?: string }) => {
    const saved = await assessmentService.save(assessment);
    setAssessments(prev => {
      const idx = prev.findIndex(a => a.id === saved.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const updateQuranProgress = async (studentId: string, updates: Partial<QuranProgress>, teacherId: string) => {
    const updated = await quranService.updateProgress(studentId, updates, teacherId);
    setQuranRecords(prev => {
      const idx = prev.findIndex(q => q.studentId === studentId);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
    return updated;
  };

  const saveAkhlaq = async (record: AkhlaqRecord) => {
    const saved = await behaviourService.saveAkhlaq(record);
    setAkhlaqRecords(prev => {
      const idx = prev.findIndex(a => a.studentId === record.studentId);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const addRemark = async (remarkData: Omit<TeacherRemark, 'id' | 'date'>) => {
    const saved = await behaviourService.addRemark(remarkData);
    setRemarks(prev => [saved, ...prev]);
    return saved;
  };

  const awardAchievement = async (achievementData: Omit<Achievement, 'id' | 'date'>) => {
    const saved = await achievementService.awardAchievement(achievementData);
    setAchievements(prev => [saved, ...prev]);
    return saved;
  };

  const saveGoal = async (goalData: Omit<StudentGoal, 'id'> & { id?: string }) => {
    const saved = await behaviourService.saveGoal(goalData);
    setGoals(prev => {
      const idx = prev.findIndex(g => g.id === saved.id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const addAnnouncement = async (annData: Omit<Announcement, 'id' | 'date'>) => {
    const saved = await announcementService.create(annData);
    setAnnouncements(prev => [saved, ...prev]);
    return saved;
  };

  const deleteAnnouncement = async (id: string) => {
    await announcementService.delete(id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    return true;
  };

  return (
    <DataContext.Provider
      value={{
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
        refreshAll: loadData
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
