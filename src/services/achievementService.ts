import { Achievement } from '../types';
import { api } from '../lib/axios';

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
    } catch (err) {
      console.warn("Failed to fetch achievements from backend:", err);
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
    } catch (err) {
      console.warn(`Failed to fetch achievements for student ${studentId}:`, err);
    }
    return [];
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

        return created;
      }
    } catch (err) {
      console.error("Backend error awarding achievement:", err);
      throw err;
    }

    throw new Error('Backend failed to return created achievement');
  },

  async deleteAchievement(id: string): Promise<boolean> {
    try {
      await api.delete(`/muallim/achievements/${id}`);
    } catch (err) {
      console.error("Backend error deleting achievement:", err);
      throw err;
    }
    return true;
  }
};
