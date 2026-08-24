import { Achievement } from '../types';
import { api } from '../lib/axios';

const STORAGE_KEY = 'tharbiyah_achievements';

export const achievementService = {
  async getAll(): Promise<Achievement[]> {
    try {
      const res = await api.get<any[]>('/muallim/achievements');
      if (res.data && Array.isArray(res.data)) {
        return res.data.map((a: any) => ({
          id: a.id || a._id,
          studentId: a.studentId,
          title: a.title,
          titleMalayalam: a.titleMalayalam,
          category: a.category,
          description: a.description,
          badgeIcon: a.badgeIcon || '🏆',
          date: typeof a.date === 'string' ? a.date.split('T')[0] : new Date(a.date).toISOString().split('T')[0],
          awardedByTeacherName: a.awardedByName || 'Usthad'
        }));
      }
    } catch {
      // Offline fallback
    }

    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse stored achievements", e);
      }
    }
    return [];
  },

  async getByStudent(studentId: string): Promise<Achievement[]> {
    try {
      const res = await api.get<any[]>(`/muallim/achievements/student/${studentId}`);
      if (res.data && Array.isArray(res.data)) {
        return res.data.map((a: any) => ({
          id: a.id || a._id,
          studentId: a.studentId,
          title: a.title,
          titleMalayalam: a.titleMalayalam,
          category: a.category,
          description: a.description,
          badgeIcon: a.badgeIcon || '🏆',
          date: typeof a.date === 'string' ? a.date.split('T')[0] : new Date(a.date).toISOString().split('T')[0],
          awardedByTeacherName: a.awardedByName || 'Usthad'
        }));
      }
    } catch {
      // Offline fallback
    }

    const records = await this.getAll();
    return records.filter(r => r.studentId === studentId);
  },

  async awardAchievement(
    achievement: Omit<Achievement, 'id' | 'date'>,
    classId?: string
  ): Promise<Achievement> {
    try {
      const res = await api.post<any>('/muallim/achievements', {
        studentId: achievement.studentId,
        classId,
        title: achievement.title,
        titleMalayalam: achievement.titleMalayalam,
        category: achievement.category,
        description: achievement.description,
        badgeIcon: achievement.badgeIcon,
      });

      if (res.data) {
        const created: Achievement = {
          id: res.data.id || res.data._id,
          studentId: res.data.studentId,
          title: res.data.title,
          titleMalayalam: res.data.titleMalayalam,
          category: res.data.category,
          description: res.data.description,
          badgeIcon: res.data.badgeIcon || '🏆',
          date: typeof res.data.date === 'string' ? res.data.date.split('T')[0] : new Date(res.data.date).toISOString().split('T')[0],
          awardedByTeacherName: res.data.awardedByName || achievement.awardedByTeacherName || 'Usthad'
        };

        const records = await this.getAll();
        localStorage.setItem(STORAGE_KEY, JSON.stringify([created, ...records]));
        return created;
      }
    } catch {
      // Offline fallback
    }

    const records = await this.getAll();
    const newRecord: Achievement = {
      ...achievement,
      id: `ach-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newRecord, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  },

  async deleteAchievement(id: string): Promise<boolean> {
    try {
      await api.delete(`/muallim/achievements/${id}`);
    } catch {
      // Offline fallback
    }

    const records = await this.getAll();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }
};

