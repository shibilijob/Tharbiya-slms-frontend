import { create } from 'zustand';
import {
  HifzTarget,
  HifzRecord,
  CreateHifzTargetInput,
  CreateHifzRecordInput,
  hifzService,
} from '../services/hifzService';
import { QuranProgress } from '../types';
import { quranService } from '../services/quranService';

interface HifzState {
  targets: HifzTarget[];
  selectedTarget: HifzTarget | null;
  activeTarget: HifzTarget | null; // backward compatibility alias
  records: HifzRecord[];
  quranRecords: QuranProgress[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedTarget: (target: HifzTarget | null) => void;
  fetchTargets: (classId?: string) => Promise<HifzTarget[]>;
  fetchActiveTarget: (classId: string) => Promise<HifzTarget | null>;
  createTarget: (data: CreateHifzTargetInput) => Promise<HifzTarget>;
  updateTarget: (id: string, data: Partial<CreateHifzTargetInput>) => Promise<HifzTarget>;
  deleteTarget: (id: string) => Promise<void>;

  fetchRecords: (params?: { targetId?: string; classId?: string; studentId?: string; date?: string }) => Promise<HifzRecord[]>;
  createRecord: (data: CreateHifzRecordInput) => Promise<HifzRecord>;
  updateRecord: (id: string, data: Partial<CreateHifzRecordInput>) => Promise<HifzRecord>;
  deleteRecord: (id: string) => Promise<void>;

  fetchQuranRecords: () => Promise<QuranProgress[]>;
  updateQuranProgress: (studentId: string, updates: Partial<QuranProgress>, teacherId: string, classId?: string) => Promise<QuranProgress>;
  setQuranRecords: (records: QuranProgress[]) => void;
  clearError: () => void;
  reset: () => void;
}

export const useHifzStore = create<HifzState>((set, get) => ({
  targets: [],
  selectedTarget: null,
  activeTarget: null,
  records: [],
  quranRecords: [],
  isLoading: false,
  error: null,

  clearError: () => {
    set({ error: null });
  },

  setSelectedTarget: (target: HifzTarget | null) => {
    set({ selectedTarget: target, activeTarget: target });
  },

  setQuranRecords: (quranRecords: QuranProgress[]) => {
    set({ quranRecords });
  },

  fetchTargets: async (classId) => {
    set({ isLoading: true, error: null });
    try {
      const list = await hifzService.fetchTargets(classId);
      const currentSelected = get().selectedTarget;
      const stillExists = currentSelected ? list.find((t) => t.id === currentSelected.id) : null;
      const newSelected = stillExists || list[0] || null;

      set({
        targets: list,
        selectedTarget: newSelected,
        activeTarget: newSelected,
        isLoading: false,
      });
      return list;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch targets';
      set({ error: msg, isLoading: false });
      return get().targets;
    }
  },

  fetchActiveTarget: async (classId) => {
    try {
      const target = await hifzService.fetchActiveTarget(classId);
      set({ activeTarget: target, selectedTarget: target || get().selectedTarget });
      return target;
    } catch {
      return null;
    }
  },

  createTarget: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const created = await hifzService.createTarget(data);
      set((state) => ({
        targets: [created, ...state.targets],
        selectedTarget: created,
        activeTarget: created,
        isLoading: false,
      }));
      return created;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to create target';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  updateTarget: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await hifzService.updateTarget(id, data);
      set((state) => ({
        targets: state.targets.map((t) => (t.id === id ? updated : t)),
        selectedTarget: state.selectedTarget?.id === id ? updated : state.selectedTarget,
        activeTarget: state.activeTarget?.id === id ? updated : state.activeTarget,
        isLoading: false,
      }));
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update target';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  deleteTarget: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await hifzService.deleteTarget(id);
      set((state) => {
        const remaining = state.targets.filter((t) => t.id !== id);
        const newSelected = state.selectedTarget?.id === id ? remaining[0] || null : state.selectedTarget;
        return {
          targets: remaining,
          selectedTarget: newSelected,
          activeTarget: newSelected,
          isLoading: false,
        };
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete target';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  fetchRecords: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const recs = await hifzService.fetchRecords(params);
      set({ records: recs, isLoading: false });
      return recs;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch Hifz records';
      set({ error: msg, isLoading: false });
      return get().records;
    }
  },

  createRecord: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const created = await hifzService.createRecord(data);
      set((state) => {
        // Replace existing record if matching same student + target
        const filtered = state.records.filter(
          (r) => !(r.studentId === created.studentId && r.hifzTargetId === created.hifzTargetId)
        );
        return {
          records: [created, ...filtered],
          isLoading: false,
        };
      });
      return created;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save Hifz record';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  updateRecord: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await hifzService.updateRecord(id, data);
      set((state) => ({
        records: state.records.map((r) => (r.id === id ? updated : r)),
        isLoading: false,
      }));
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update Hifz record';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  deleteRecord: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await hifzService.deleteRecord(id);
      set((state) => ({
        records: state.records.filter((r) => r.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete Hifz record';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  fetchQuranRecords: async () => {
    try {
      const recs = await quranService.getAll();
      set({ quranRecords: recs });
      return recs;
    } catch {
      return get().quranRecords;
    }
  },

  updateQuranProgress: async (studentId, updates, teacherId, classId) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await quranService.updateProgress(studentId, updates, teacherId, classId);
      set((state) => {
        const idx = state.quranRecords.findIndex((q) => q.studentId === studentId);
        if (idx > -1) {
          const copy = [...state.quranRecords];
          copy[idx] = updated;
          return { quranRecords: copy, isLoading: false };
        }
        return { quranRecords: [updated, ...state.quranRecords], isLoading: false };
      });
      return updated;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update Quran progress';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  reset: () => {
    set({
      targets: [],
      selectedTarget: null,
      activeTarget: null,
      records: [],
      quranRecords: [],
      isLoading: false,
      error: null,
    });
  },
}));
