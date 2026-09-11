import { create } from 'zustand';
import { AkhlaqRecord, TeacherRemark, StudentGoal, Achievement } from '../types';
import { behaviourService } from '../services/behaviourService';
import { achievementService } from '../services/achievementService';

interface BehaviourState {
  akhlaqRecords: AkhlaqRecord[];
  remarks: TeacherRemark[];
  goals: StudentGoal[];
  achievements: Achievement[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBehaviourData: () => Promise<void>;
  saveAkhlaq: (record: AkhlaqRecord) => Promise<AkhlaqRecord>;
  addRemark: (remarkData: Omit<TeacherRemark, 'id' | 'date'>) => Promise<TeacherRemark>;
  saveGoal: (goalData: Omit<StudentGoal, 'id'> & { id?: string }) => Promise<StudentGoal>;
  awardAchievement: (achievementData: Omit<Achievement, 'id' | 'date'>) => Promise<Achievement>;
  deleteAchievement: (id: string) => Promise<boolean>;
  setAkhlaqRecords: (records: AkhlaqRecord[]) => void;
  setRemarks: (remarks: TeacherRemark[]) => void;
  setGoals: (goals: StudentGoal[]) => void;
  setAchievements: (achievements: Achievement[]) => void;
  clearError: () => void;
  reset: () => void;
}

export const useBehaviourStore = create<BehaviourState>((set) => ({
  akhlaqRecords: [],
  remarks: [],
  goals: [],
  achievements: [],
  isLoading: false,
  error: null,

  setAkhlaqRecords: (akhlaqRecords) => set({ akhlaqRecords }),
  setRemarks: (remarks) => set({ remarks }),
  setGoals: (goals) => set({ goals }),
  setAchievements: (achievements) => set({ achievements }),
  clearError: () => set({ error: null }),

  fetchBehaviourData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [akh, rem, goa, ach] = await Promise.all([
        behaviourService.getAkhlaqAll(),
        behaviourService.getRemarksAll(),
        behaviourService.getGoalsAll(),
        achievementService.getAll(),
      ]);
      set({
        akhlaqRecords: akh,
        remarks: rem,
        goals: goa,
        achievements: ach,
        isLoading: false,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch behaviour data';
      set({ error: msg, isLoading: false });
    }
  },

  saveAkhlaq: async (record) => {
    set({ isLoading: true, error: null });
    try {
      const saved = await behaviourService.saveAkhlaq(record);
      set((state) => {
        const idx = state.akhlaqRecords.findIndex((a) => a.studentId === record.studentId);
        if (idx > -1) {
          const copy = [...state.akhlaqRecords];
          copy[idx] = saved;
          return { akhlaqRecords: copy, isLoading: false };
        }
        return { akhlaqRecords: [saved, ...state.akhlaqRecords], isLoading: false };
      });
      return saved;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save Akhlaq';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  addRemark: async (remarkData) => {
    set({ isLoading: true, error: null });
    try {
      const saved = await behaviourService.addRemark(remarkData);
      set((state) => ({
        remarks: [saved, ...state.remarks],
        isLoading: false,
      }));
      return saved;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to add remark';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  saveGoal: async (goalData) => {
    set({ isLoading: true, error: null });
    try {
      const saved = await behaviourService.saveGoal(goalData);
      set((state) => {
        const idx = state.goals.findIndex((g) => g.id === saved.id);
        if (idx > -1) {
          const copy = [...state.goals];
          copy[idx] = saved;
          return { goals: copy, isLoading: false };
        }
        return { goals: [saved, ...state.goals], isLoading: false };
      });
      return saved;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save goal';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  awardAchievement: async (achievementData) => {
    set({ isLoading: true, error: null });
    try {
      const saved = await achievementService.awardAchievement(achievementData);
      set((state) => ({
        achievements: [saved, ...state.achievements],
        isLoading: false,
      }));
      return saved;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to award achievement';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  deleteAchievement: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await achievementService.deleteAchievement(id);
      set((state) => ({
        achievements: state.achievements.filter((a) => a.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete achievement';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  reset: () => {
    set({
      akhlaqRecords: [],
      remarks: [],
      goals: [],
      achievements: [],
      isLoading: false,
      error: null,
    });
  },
}));
