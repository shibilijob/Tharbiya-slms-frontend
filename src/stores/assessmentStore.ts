import { create } from 'zustand';
import { AcademicAssessment } from '../types';
import { assessmentService } from '../services/assessmentService';

interface AssessmentState {
  assessments: AcademicAssessment[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAssessments: () => Promise<AcademicAssessment[]>;
  saveAssessment: (assessment: Omit<AcademicAssessment, 'id'> & { id?: string }) => Promise<AcademicAssessment>;
  setAssessments: (assessments: AcademicAssessment[]) => void;
  clearError: () => void;
  reset: () => void;
}

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  assessments: [],
  isLoading: false,
  error: null,

  setAssessments: (assessments: AcademicAssessment[]) => {
    set({ assessments });
  },

  clearError: () => {
    set({ error: null });
  },

  fetchAssessments: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await assessmentService.getAll();
      set({ assessments: data, isLoading: false });
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch assessments';
      set({ error: msg, isLoading: false });
      return get().assessments;
    }
  },

  saveAssessment: async (assessment) => {
    set({ isLoading: true, error: null });
    try {
      const saved = await assessmentService.save(assessment);
      set((state) => {
        const idx = state.assessments.findIndex((a) => a.id === saved.id);
        if (idx > -1) {
          const copy = [...state.assessments];
          copy[idx] = saved;
          return { assessments: copy, isLoading: false };
        }
        return { assessments: [saved, ...state.assessments], isLoading: false };
      });
      return saved;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save assessment';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  reset: () => {
    set({
      assessments: [],
      isLoading: false,
      error: null,
    });
  },
}));
