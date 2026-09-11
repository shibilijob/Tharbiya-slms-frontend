import { create } from 'zustand';
import { Announcement } from '../types';
import { announcementService } from '../services/announcementService';

interface AnnouncementState {
  announcements: Announcement[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAnnouncements: () => Promise<Announcement[]>;
  addAnnouncement: (annData: Omit<Announcement, 'id' | 'date'>) => Promise<Announcement>;
  deleteAnnouncement: (id: string) => Promise<boolean>;
  setAnnouncements: (announcements: Announcement[]) => void;
  clearError: () => void;
  reset: () => void;
}

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  announcements: [],
  isLoading: false,
  error: null,

  setAnnouncements: (announcements) => set({ announcements }),
  clearError: () => set({ error: null }),

  fetchAnnouncements: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await announcementService.getAll();
      set({ announcements: data, isLoading: false });
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to fetch announcements';
      set({ error: msg, isLoading: false });
      return get().announcements;
    }
  },

  addAnnouncement: async (annData) => {
    set({ isLoading: true, error: null });
    try {
      const saved = await announcementService.create(annData);
      set((state) => ({
        announcements: [saved, ...state.announcements],
        isLoading: false,
      }));
      return saved;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to add announcement';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  deleteAnnouncement: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await announcementService.delete(id);
      set((state) => ({
        announcements: state.announcements.filter((a) => a.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete announcement';
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  reset: () => {
    set({
      announcements: [],
      isLoading: false,
      error: null,
    });
  },
}));
