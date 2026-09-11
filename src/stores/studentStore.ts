import { create } from 'zustand';
import { Student } from '../types';
import { studentService } from '../services/studentService';

const SELECTED_CHILD_KEY = 'tharbiyah_selected_child_id';

interface StudentState {
  students: Student[];
  selectedChildId: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedChildId: (id: string) => void;
  fetchStudents: (params?: { page?: number; limit?: number; search?: string; classId?: string; status?: string }) => Promise<Student[]>;
  addStudent: (data: Omit<Student, 'id'>) => Promise<Student>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<Student>;
  deleteStudent: (id: string) => Promise<boolean>;
  getStudentById: (studentId: string) => Student | undefined;
  clearError: () => void;
  setStudents: (students: Student[]) => void;
  reset: () => void;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  selectedChildId: localStorage.getItem(SELECTED_CHILD_KEY) || '',
  isLoading: false,
  error: null,

  setSelectedChildId: (selectedChildId: string) => {
    if (selectedChildId) {
      localStorage.setItem(SELECTED_CHILD_KEY, selectedChildId);
    } else {
      localStorage.removeItem(SELECTED_CHILD_KEY);
    }
    set({ selectedChildId });
  },

  setStudents: (students: Student[]) => {
    set({ students });
  },

  clearError: () => {
    set({ error: null });
  },

  getStudentById: (studentId: string) => {
    const list = get().students;
    return list.find((s) => s.id === studentId);
  },

  fetchStudents: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const data = await studentService.getAll(params);
      const uniqueStudents = Array.from(new Map(data.map((s) => [s.id, s])).values());
      set((state) => ({
        students: uniqueStudents,
        isLoading: false,
        selectedChildId: uniqueStudents.length > 0 && !uniqueStudents.some((s) => s.id === state.selectedChildId)
          ? uniqueStudents[0].id
          : uniqueStudents.length === 0
          ? ''
          : state.selectedChildId,
      }));
      const nextSelected = get().selectedChildId;
      if (nextSelected) {
        localStorage.setItem(SELECTED_CHILD_KEY, nextSelected);
      } else {
        localStorage.removeItem(SELECTED_CHILD_KEY);
      }
      return uniqueStudents;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch students';
      set({ error: msg, isLoading: false });
      return get().students;
    }
  },

  addStudent: async (data: Omit<Student, 'id'>) => {
    set({ isLoading: true, error: null });
    try {
      const newStudent = await studentService.create(data);
      set((state) => ({
        students: [newStudent, ...state.students.filter((s) => s.id !== newStudent.id)],
        isLoading: false,
      }));
      return newStudent;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create student';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  updateStudent: async (id: string, updates: Partial<Student>) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await studentService.update(id, updates);
      set((state) => ({
        students: state.students.map((s) => (s.id === id ? updated : s)),
        isLoading: false,
      }));
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update student';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  deleteStudent: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await studentService.delete(id);
      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete student';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  reset: () => {
    set({
      students: [],
      selectedChildId: '',
      isLoading: false,
      error: null,
    });
    localStorage.removeItem(SELECTED_CHILD_KEY);
  },
}));
