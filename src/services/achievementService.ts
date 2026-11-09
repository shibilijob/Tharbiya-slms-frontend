import { Achievement } from '../types';
import { api } from '../lib/axios';

export const achievementService = {
  async getAll(): Promise<Achievement[]> {
    try {
      const res = await api.get<any>('/muallim/achievements');
      const list = Array.isArray(res.data)
        ? res.data
        : (Array.isArray(res.data?.data) ? res.data.data : []);

      return list.map((a: any) => ({
        id: a.id || a._id,
        studentId: a.studentId?._id ? a.studentId._id.toString() : (a.studentId?.toString() || a.studentId),
        title: a.title,
        titleMalayalam: a.titleMalayalam,
        category: a.category,
        description: a.description,
        badgeIcon: a.badgeIcon || '🏆',
        date: typeof a.date === 'string' ? a.date.split('T')[0] : new Date(a.date).toISOString().split('T')[0],
        awardedByTeacherName: a.awardedByName || a.awardedByTeacherName || 'Usthad'
      }));
    } catch (err) {
      console.warn("Failed to fetch achievements from backend:", err);
    }
    return [];
  },

  async getByStudent(studentId: string): Promise<Achievement[]> {
    try {
      const res = await api.get<any>(`/muallim/achievements/student/${studentId}`);
      const list = Array.isArray(res.data)
        ? res.data
        : (Array.isArray(res.data?.data) ? res.data.data : []);

      return list.map((a: any) => ({
        id: a.id || a._id,
        studentId: a.studentId?._id ? a.studentId._id.toString() : (a.studentId?.toString() || a.studentId),
        title: a.title,
        titleMalayalam: a.titleMalayalam,
        category: a.category,
        description: a.description,
        badgeIcon: a.badgeIcon || '🏆',
        date: typeof a.date === 'string' ? a.date.split('T')[0] : new Date(a.date).toISOString().split('T')[0],
        awardedByTeacherName: a.awardedByName || a.awardedByTeacherName || 'Usthad'
      }));
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

      const data = res.data?.data || res.data;
      if (data) {
        const created: Achievement = {
          id: data.id || data._id,
          studentId: data.studentId?._id ? data.studentId._id.toString() : (data.studentId?.toString() || data.studentId),
          title: data.title,
          titleMalayalam: data.titleMalayalam,
          category: data.category,
          description: data.description,
          badgeIcon: data.badgeIcon || '🏆',
          date: typeof data.date === 'string' ? data.date.split('T')[0] : new Date(data.date).toISOString().split('T')[0],
          awardedByTeacherName: data.awardedByName || data.awardedByTeacherName || achievement.awardedByTeacherName || 'Usthad'
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
