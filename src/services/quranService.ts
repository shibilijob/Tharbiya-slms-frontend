import { QuranProgress } from '../types';
import { api } from '../lib/axios';

const STORAGE_KEY = 'tharbiyah_quran_progress';

export const quranService = {
  async getAll(): Promise<QuranProgress[]> {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse stored Quran records", e);
      }
    }
    return [];
  },

  async getByStudent(studentId: string): Promise<QuranProgress | null> {
    try {
      const res = await api.get<{ summary: any; logs: any[] }>(`/hifz/student/${studentId}`);
      if (res.data?.summary) {
        const s = res.data.summary;
        const latestLog = res.data.logs?.[0];
        return {
          id: `quran-${studentId}`,
          studentId,
          currentSurahNumber: latestLog?.surahNumber || 1,
          currentSurahName: s.currentSurah || latestLog?.surahName || "Al-Mulk",
          currentAyahStart: latestLog?.fromAyah || 1,
          currentAyahEnd: s.currentAyah || latestLog?.toAyah || 15,
          hifzSurahsCount: s.totalMemorizedSurahs || 0,
          sabaqLesson: `Surah ${s.currentSurah || 'Al-Mulk'} (Ayah ${latestLog?.fromAyah || 1}-${latestLog?.toAyah || 15})`,
          sabaqiRevision: "Recent Sabaqi revisions",
          manzilRevision: "Weekly Manzil recitation",
          tajweedLevel: s.averageRating >= 4.5 ? "Proficient" : "Good",
          mistakesCount: latestLog?.mistakesCount || 0,
          lessonStatus: "In Progress",
          lastUpdated: latestLog?.date ? new Date(latestLog.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          teacherRemarks: latestLog?.remarks || "Good progress",
          teacherId: latestLog?.teacherId || ""
        };
      }
    } catch {
      // Offline fallback
    }

    const records = await this.getAll();
    return records.find(r => r.studentId === studentId) || null;
  },

  async updateProgress(
    studentId: string,
    updates: Partial<QuranProgress>,
    teacherId: string,
    classId?: string
  ): Promise<QuranProgress> {
    try {
      if (classId) {
        await api.post('/hifz', {
          studentId,
          classId,
          sessionType: "SABAQ",
          surahNumber: updates.currentSurahNumber || 67,
          surahName: updates.currentSurahName || "Al-Mulk",
          fromAyah: updates.currentAyahStart || 1,
          toAyah: updates.currentAyahEnd || 15,
          rating: 5,
          mistakesCount: updates.mistakesCount || 0,
          remarks: updates.teacherRemarks || "Recited with Tajweed",
        });
      }
    } catch {
      // Offline fallback
    }

    const records = await this.getAll();
    const idx = records.findIndex(r => r.studentId === studentId);

    const now = new Date().toISOString().split('T')[0];

    if (idx > -1) {
      records[idx] = {
        ...records[idx],
        ...updates,
        teacherId,
        lastUpdated: now
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return records[idx];
    } else {
      const newRec: QuranProgress = {
        id: `quran-${studentId}-${Date.now()}`,
        studentId,
        currentSurahNumber: updates.currentSurahNumber || 1,
        currentSurahName: updates.currentSurahName || "Al-Fatihah",
        currentAyahStart: updates.currentAyahStart || 1,
        currentAyahEnd: updates.currentAyahEnd || 7,
        hifzSurahsCount: updates.hifzSurahsCount || 0,
        sabaqLesson: updates.sabaqLesson || "Surah Al-Fatihah",
        sabaqiRevision: updates.sabaqiRevision || "",
        manzilRevision: updates.manzilRevision || "",
        tajweedLevel: updates.tajweedLevel || "Developing",
        mistakesCount: updates.mistakesCount || 0,
        lessonStatus: updates.lessonStatus || "In Progress",
        lastUpdated: now,
        teacherRemarks: updates.teacherRemarks,
        teacherId
      };
      const updated = [newRec, ...records];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newRec;
    }
  }
};

