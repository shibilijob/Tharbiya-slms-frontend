import { Notification } from '../types';

const STORAGE_KEY = 'tharbiyah_notifications';

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }
    return [];
  },

  async getByUser(userId: string): Promise<Notification[]> {
    const records = await this.getAll();
    return records.filter(r => r.userId === userId);
  },

  async markAsRead(id: string): Promise<boolean> {
    const records = await this.getAll();
    const idx = records.findIndex(r => r.id === id);
    if (idx > -1) {
      records[idx].read = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return true;
    }
    return false;
  },

  async markAllAsRead(userId: string): Promise<boolean> {
    const records = await this.getAll();
    records.forEach(r => {
      if (r.userId === userId) r.read = true;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  },

  async addNotification(notif: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<Notification> {
    const records = await this.getAll();
    const newRecord: Notification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    const updated = [newRecord, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  }
};
