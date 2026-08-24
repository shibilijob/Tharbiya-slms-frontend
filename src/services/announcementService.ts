import { Announcement } from '../types';

const STORAGE_KEY = 'tharbiyah_announcements';

export const announcementService = {
  async getAll(): Promise<Announcement[]> {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse announcements", e);
      }
    }
    return [];
  },

  async create(announcement: Omit<Announcement, 'id' | 'date'>): Promise<Announcement> {
    const records = await this.getAll();
    const newRecord: Announcement = {
      ...announcement,
      id: `ann-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newRecord, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  },

  async delete(id: string): Promise<boolean> {
    const records = await this.getAll();
    const updated = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  }
};
