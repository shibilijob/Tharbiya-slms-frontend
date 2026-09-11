import { create } from 'zustand';
import { SubjectMeta } from '../data/madrasaCurriculum';
import { subjectService } from '../services/subjectService';

interface SubjectState {
  subjects: SubjectMeta[];
  currentClass: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentClass: (classId: string) => void;
  fetchSubjects: (classId?: string) => Promise<SubjectMeta[]>;
  addSubject: (data: SubjectMeta, classId?: string) => Promise<SubjectMeta[]>;
  updateSubject: (id: string, updates: Partial<SubjectMeta>, classId?: string) => Promise<SubjectMeta[]>;
  deleteSubject: (id: string, classId?: string) => Promise<SubjectMeta[]>;
  clearError: () => void;
  reset: () => void;
}

export const useSubjectStore = create<SubjectState>((set, get) => ({
  subjects: [],
  currentClass: '5',
  isLoading: false,
  error: null,

  setCurrentClass: (currentClass: string) => {
    set({ currentClass });
  },

  clearError: () => {
    set({ error: null });
  },

  fetchSubjects: async (classId?: string) => {
    const targetClass = classId || get().currentClass || '5';
    set({ isLoading: true, error: null });
    try {
      const data = await subjectService.fetchFromApi(targetClass);
      set({ subjects: data, isLoading: false });
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to load subjects';
      set({ error: msg, isLoading: false });
      return get().subjects;
    }
  },

  addSubject: async (data: SubjectMeta, classId?: string) => {
    const targetClass = classId || get().currentClass || '5';
    set({ isLoading: true, error: null });
    try {
      const updatedList = await subjectService.addSubject(data, targetClass);
      set({ subjects: updatedList, isLoading: false });
      return updatedList;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.data?.message || err.message || 'Failed to add subject';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  updateSubject: async (id: string, updates: Partial<SubjectMeta>, classId?: string) => {
    const targetClass = classId || get().currentClass || '5';
    set({ isLoading: true, error: null });
    try {
      const updatedList = await subjectService.updateSubject(id, updates, targetClass);
      set({ subjects: updatedList, isLoading: false });
      return updatedList;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update subject';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  deleteSubject: async (id: string, classId?: string) => {
    const targetClass = classId || get().currentClass || '5';
    set({ isLoading: true, error: null });
    try {
      const updatedList = await subjectService.deleteSubject(id, targetClass);
      set({ subjects: updatedList, isLoading: false });
      return updatedList;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete subject';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  reset: () => {
    set({
      subjects: [],
      currentClass: '5',
      isLoading: false,
      error: null,
    });
  },
}));
