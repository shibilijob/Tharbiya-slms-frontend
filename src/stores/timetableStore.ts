import { create } from 'zustand';
import { MadrasaDay, TimetablePeriod } from '../types';
import { timetableService } from '../services/timetableService';

interface TimetableState {
  classSchedule: Record<MadrasaDay, TimetablePeriod[]>;
  currentClass: string;
  selectedDay: MadrasaDay;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedDay: (day: MadrasaDay) => void;
  setCurrentClass: (classId: string) => void;
  fetchSchedule: (classId?: string) => Promise<Record<MadrasaDay, TimetablePeriod[]>>;
  addPeriod: (classId: string, day: MadrasaDay, period: TimetablePeriod) => Promise<TimetablePeriod[]>;
  updatePeriod: (classId: string, day: MadrasaDay, period: TimetablePeriod) => Promise<TimetablePeriod[]>;
  deletePeriod: (classId: string, day: MadrasaDay, periodId: string) => Promise<TimetablePeriod[]>;
  clearError: () => void;
  reset: () => void;
}

const INITIAL_SCHEDULE: Record<MadrasaDay, TimetablePeriod[]> = {
  Sunday: [],
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
};

export const useTimetableStore = create<TimetableState>((set, get) => ({
  classSchedule: { ...INITIAL_SCHEDULE },
  currentClass: '5',
  selectedDay: 'Sunday',
  isLoading: false,
  error: null,

  setSelectedDay: (selectedDay: MadrasaDay) => {
    set({ selectedDay });
  },

  setCurrentClass: (currentClass: string) => {
    set({ currentClass });
  },

  clearError: () => {
    set({ error: null });
  },

  fetchSchedule: async (classId?: string) => {
    const targetClass = classId || get().currentClass || '5';
    set({ isLoading: true, error: null });
    try {
      const apiSchedule = await timetableService.fetchClassScheduleFromApi(targetClass);
      set({ classSchedule: apiSchedule, isLoading: false });
      return apiSchedule;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch schedule';
      set({ error: msg, isLoading: false });
      return get().classSchedule;
    }
  },

  addPeriod: async (classId, day, period) => {
    set({ isLoading: true, error: null });
    try {
      const savedPeriod = await timetableService.updatePeriod(classId, day, period);
      const currentDayPeriods = get().classSchedule[day] || [];
      const index = currentDayPeriods.findIndex((p) => p.id === savedPeriod.id);
      let updatedDayPeriods: TimetablePeriod[];
      if (index > -1) {
        updatedDayPeriods = [...currentDayPeriods];
        updatedDayPeriods[index] = savedPeriod;
      } else {
        updatedDayPeriods = [...currentDayPeriods, savedPeriod];
      }
      updatedDayPeriods.sort((a, b) => a.periodNumber - b.periodNumber);

      const newSchedule = {
        ...get().classSchedule,
        [day]: updatedDayPeriods,
      };
      set({ classSchedule: newSchedule, isLoading: false });
      return updatedDayPeriods;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to add period';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  updatePeriod: async (classId, day, period) => {
    set({ isLoading: true, error: null });
    try {
      const savedPeriod = await timetableService.updatePeriod(classId, day, period);
      const currentDayPeriods = get().classSchedule[day] || [];
      const index = currentDayPeriods.findIndex((p) => p.id === savedPeriod.id || p.id === period.id);
      let updatedDayPeriods: TimetablePeriod[];
      if (index > -1) {
        updatedDayPeriods = [...currentDayPeriods];
        updatedDayPeriods[index] = savedPeriod;
      } else {
        updatedDayPeriods = [...currentDayPeriods, savedPeriod];
      }
      updatedDayPeriods.sort((a, b) => a.periodNumber - b.periodNumber);

      const newSchedule = {
        ...get().classSchedule,
        [day]: updatedDayPeriods,
      };
      set({ classSchedule: newSchedule, isLoading: false });
      return updatedDayPeriods;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update period';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  deletePeriod: async (classId, day, periodId) => {
    set({ isLoading: true, error: null });
    try {
      await timetableService.deletePeriod(classId, day, periodId);
      const currentDayPeriods = get().classSchedule[day] || [];
      const updatedDayPeriods = currentDayPeriods.filter((p) => p.id !== periodId);
      const newSchedule = {
        ...get().classSchedule,
        [day]: updatedDayPeriods,
      };
      set({ classSchedule: newSchedule, isLoading: false });
      return updatedDayPeriods;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete period';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  reset: () => {
    set({
      classSchedule: { ...INITIAL_SCHEDULE },
      currentClass: '5',
      selectedDay: 'Sunday',
      isLoading: false,
      error: null,
    });
  },
}));
