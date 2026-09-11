import { create } from 'zustand';
import { classService, ClassItem, TeacherOption, CreateClassPayload } from '../services/classService';

// Natural sort helper: "Class 1", "Class 2" ... "Class 10"
const sortClassesInOrder = (list: ClassItem[]): ClassItem[] => {
  return [...list].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
};

interface ClassState {
  classes: ClassItem[];
  teachersList: TeacherOption[];
  teacherAssignedClasses: string[];
  selectedClass: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedClass: (cls: string) => void;
  fetchClasses: () => Promise<ClassItem[]>;
  fetchTeachersList: () => Promise<TeacherOption[]>;
  fetchAssignedClassesForTeacher: (user: any) => Promise<string[]>;
  createClass: (payload: CreateClassPayload) => Promise<any>;
  updateClass: (id: string, payload: Partial<CreateClassPayload>) => Promise<any>;
  deleteClass: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useClassStore = create<ClassState>((set, get) => ({
  classes: [],
  teachersList: [],
  teacherAssignedClasses: [],
  selectedClass: '',
  isLoading: false,
  error: null,

  setSelectedClass: (selectedClass: string) => {
    set({ selectedClass });
  },

  clearError: () => {
    set({ error: null });
  },

  fetchClasses: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await classService.getAll();
      const sorted = sortClassesInOrder(data);
      set({ classes: sorted, isLoading: false });
      return sorted;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to load classes';
      set({ error: msg, isLoading: false });
      return get().classes;
    }
  },

  fetchTeachersList: async () => {
    try {
      const teachers = await classService.getTeachersList();
      set({ teachersList: teachers });
      return teachers;
    } catch (err: any) {
      console.error('Failed to load teachers list for classes:', err);
      return get().teachersList;
    }
  },

  fetchAssignedClassesForTeacher: async (user: any) => {
    try {
      const assigned = await classService.getAssignedClassesForTeacher(user);
      if (assigned.length > 0) {
        set((state) => ({
          teacherAssignedClasses: assigned,
          selectedClass: assigned.includes(state.selectedClass) ? state.selectedClass : assigned[0],
        }));
        return assigned;
      }
    } catch (err) {
      console.warn('Could not query teacher assigned classes:', err);
    }
    return get().teacherAssignedClasses;
  },

  createClass: async (payload: CreateClassPayload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await classService.create(payload);
      await get().fetchClasses();
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create class';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  updateClass: async (id: string, payload: Partial<CreateClassPayload>) => {
    set({ isLoading: true, error: null });
    try {
      const res = await classService.update(id, payload);
      await get().fetchClasses();
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update class';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  deleteClass: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await classService.delete(id);
      set((state) => ({
        classes: state.classes.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete class';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  reset: () => {
    set({
      classes: [],
      teachersList: [],
      teacherAssignedClasses: [],
      selectedClass: '',
      isLoading: false,
      error: null,
    });
  },
}));
