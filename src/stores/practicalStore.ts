import { create } from 'zustand';
import { AkhlaqCategoryMeta } from '../data/madrasaCurriculum';
import { practicalCriteriaService } from '../services/practicalCriteriaService';
import { muallimService, RecordPracticalPayload } from '../services/muallimService';
import {
  practicalScoreService,
  PracticalScore,
  SaveScorePayload,
} from '../services/practicalScoreService';

const now = new Date();

interface PracticalState {
  criteriaList: AkhlaqCategoryMeta[];
  currentClass: string;
  selectedMonth: number; // 1 - 12
  selectedYear: number;  // e.g. 2026
  selectedPracticalSubjectId: string; // 'ALL' or subject ObjectId
  scoresByMonth: Record<string, PracticalScore[]>; // Key: `${classId}_${subjectId}_${year}_${month}`
  studentHistories: Record<string, PracticalScore[]>; // Key: studentId
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentClass: (classId: string) => void;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  setSelectedPracticalSubjectId: (subjectId: string) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  fetchCriteria: (classId?: string) => Promise<AkhlaqCategoryMeta[]>;
  addCriterion: (data: AkhlaqCategoryMeta, classId?: string) => Promise<AkhlaqCategoryMeta[]>;
  updateCriterion: (id: string, updates: Partial<AkhlaqCategoryMeta>, classId?: string) => Promise<AkhlaqCategoryMeta[]>;
  deleteCriterion: (id: string, classId?: string) => Promise<AkhlaqCategoryMeta[]>;
  recordEvaluation: (data: RecordPracticalPayload) => Promise<any>;
  fetchMonthlyScores: (classId?: string, practicalSubjectId?: string, month?: number, year?: number) => Promise<PracticalScore[]>;
  saveMonthlyScore: (payload: SaveScorePayload) => Promise<PracticalScore>;
  fetchStudentHistory: (studentId: string) => Promise<PracticalScore[]>;
  deleteMonthlyScore: (id: string, classId?: string, practicalSubjectId?: string, month?: number, year?: number) => Promise<void>;
  clearError: () => void;
}

const buildScoreKey = (classId: string, practicalSubjectId: string | undefined, year: number, month: number) => {
  const cleanClass = String(classId).replace(/^Class\s*/i, '').trim();
  const subj = practicalSubjectId || 'ALL';
  const m = String(month).padStart(2, '0');
  return `${cleanClass}_${subj}_${year}_${m}`;
};

export const usePracticalStore = create<PracticalState>((set, get) => ({
  criteriaList: [],
  currentClass: '5',
  selectedMonth: now.getMonth() + 1,
  selectedYear: now.getFullYear(),
  selectedPracticalSubjectId: 'ALL',
  scoresByMonth: {},
  studentHistories: {},
  isLoading: false,
  error: null,

  setCurrentClass: (currentClass: string) => {
    set({ currentClass });
  },

  setSelectedMonth: (selectedMonth: number) => {
    set({ selectedMonth });
  },

  setSelectedYear: (selectedYear: number) => {
    set({ selectedYear });
  },

  setSelectedPracticalSubjectId: (selectedPracticalSubjectId: string) => {
    set({ selectedPracticalSubjectId });
  },

  goToPreviousMonth: () => {
    const { selectedMonth, selectedYear } = get();
    if (selectedMonth === 1) {
      set({ selectedMonth: 12, selectedYear: selectedYear - 1 });
    } else {
      set({ selectedMonth: selectedMonth - 1 });
    }
  },

  goToNextMonth: () => {
    const { selectedMonth, selectedYear } = get();
    if (selectedMonth === 12) {
      set({ selectedMonth: 1, selectedYear: selectedYear + 1 });
    } else {
      set({ selectedMonth: selectedMonth + 1 });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  fetchCriteria: async (classId?: string) => {
    const targetClass = classId || get().currentClass || '5';
    set({ isLoading: true, error: null });
    try {
      const data = await practicalCriteriaService.fetchFromApi(targetClass);
      set({ criteriaList: data, isLoading: false });
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to load practical criteria';
      set({ error: msg, isLoading: false });
      return get().criteriaList;
    }
  },

  addCriterion: async (data: AkhlaqCategoryMeta, classId?: string) => {
    const targetClass = classId || get().currentClass || '5';
    set({ isLoading: true, error: null });
    try {
      const updatedList = await practicalCriteriaService.addCriteria(data, targetClass);
      set({ criteriaList: updatedList, isLoading: false });
      return updatedList;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to add criterion';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  updateCriterion: async (id: string, updates: Partial<AkhlaqCategoryMeta>, classId?: string) => {
    const targetClass = classId || get().currentClass || '5';
    set({ isLoading: true, error: null });
    try {
      const updatedList = await practicalCriteriaService.updateCriteria(id, updates as any, targetClass);
      set({ criteriaList: updatedList, isLoading: false });
      return updatedList;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update criterion';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  deleteCriterion: async (id: string, classId?: string) => {
    const targetClass = classId || get().currentClass || '5';
    set({ isLoading: true, error: null });
    try {
      const updatedList = await practicalCriteriaService.deleteCriteria(id, targetClass);
      set({ criteriaList: updatedList, isLoading: false });
      return updatedList;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete criterion';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  recordEvaluation: async (data: RecordPracticalPayload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await muallimService.recordPracticalEvaluation(data);
      set({ isLoading: false });
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to record evaluation';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  /**
   * Fetch month-wise practical scores from backend
   */
  fetchMonthlyScores: async (classId?: string, practicalSubjectId?: string, month?: number, year?: number) => {
    const targetClass = classId || get().currentClass || '5';
    const targetMonth = month !== undefined ? month : get().selectedMonth;
    const targetYear = year !== undefined ? year : get().selectedYear;
    const targetSubject = practicalSubjectId !== undefined ? practicalSubjectId : get().selectedPracticalSubjectId;

    set({ isLoading: true, error: null });
    try {
      const scores = await practicalScoreService.getMonthlyScores({
        classId: targetClass,
        practicalSubjectId: targetSubject,
        month: targetMonth,
        year: targetYear,
      });

      const key = buildScoreKey(targetClass, targetSubject, targetYear, targetMonth);
      set((state) => ({
        scoresByMonth: {
          ...state.scoresByMonth,
          [key]: scores,
        },
        isLoading: false,
      }));

      return scores;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch monthly practical scores';
      set({ error: msg, isLoading: false });
      return [];
    }
  },

  /**
   * Record or update a single monthly score
   */
  saveMonthlyScore: async (payload: SaveScorePayload) => {
    set({ isLoading: true, error: null });
    try {
      const saved = await practicalScoreService.saveMonthlyScore(payload);

      // Update in-memory state for both specific subject and ALL
      const keySpecific = buildScoreKey(payload.classId, payload.practicalSubjectId, payload.year, payload.month);
      const keyAll = buildScoreKey(payload.classId, 'ALL', payload.year, payload.month);

      set((state) => {
        const updateList = (existingList: PracticalScore[] = []) => {
          const idx = existingList.findIndex(
            (s) => s.studentId === payload.studentId && s.practicalSubjectId === payload.practicalSubjectId
          );
          if (idx >= 0) {
            const copy = [...existingList];
            copy[idx] = saved;
            return copy;
          }
          return [...existingList, saved];
        };

        return {
          scoresByMonth: {
            ...state.scoresByMonth,
            [keySpecific]: updateList(state.scoresByMonth[keySpecific]),
            [keyAll]: updateList(state.scoresByMonth[keyAll]),
          },
          isLoading: false,
        };
      });

      return saved;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save practical score';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  /**
   * Fetch all monthly history for a student across all months
   */
  fetchStudentHistory: async (studentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const history = await practicalScoreService.getStudentHistory(studentId);
      set((state) => ({
        studentHistories: {
          ...state.studentHistories,
          [studentId]: history,
        },
        isLoading: false,
      }));
      return history;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch student history';
      set({ error: msg, isLoading: false });
      return [];
    }
  },

  /**
   * Delete a monthly score
   */
  deleteMonthlyScore: async (id: string, classId?: string, practicalSubjectId?: string, month?: number, year?: number) => {
    set({ isLoading: true, error: null });
    try {
      await practicalScoreService.deleteScore(id);

      const targetClass = classId || get().currentClass;
      const targetMonth = month || get().selectedMonth;
      const targetYear = year || get().selectedYear;
      const targetSubj = practicalSubjectId || get().selectedPracticalSubjectId;

      const keySpecific = buildScoreKey(targetClass, targetSubj, targetYear, targetMonth);
      const keyAll = buildScoreKey(targetClass, 'ALL', targetYear, targetMonth);

      set((state) => ({
        scoresByMonth: {
          ...state.scoresByMonth,
          [keySpecific]: (state.scoresByMonth[keySpecific] || []).filter((s) => s.id !== id),
          [keyAll]: (state.scoresByMonth[keyAll] || []).filter((s) => s.id !== id),
        },
        isLoading: false,
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete practical score';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },
}));

