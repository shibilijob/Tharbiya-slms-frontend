import { api } from "../lib/axios";

export interface PracticalScore {
  id: string;
  studentId: string;
  studentName?: string;
  admissionNumber?: string;
  classId: string;
  className?: string;
  practicalSubjectId: string;
  practicalSubjectName?: string;
  month: number; // 1 to 12
  year: number; // e.g. 2026
  score: number;
  maxScore: number;
  percentage?: number;
  remarks?: string;
  evaluatedById: string;
  evaluatedByName?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveScorePayload {
  studentId: string;
  classId: string;
  practicalSubjectId: string;
  month: number;
  year: number;
  score: number;
  remarks?: string;
  date?: string;
}

export interface QueryScoresParams {
  classId: string;
  practicalSubjectId?: string;
  month: number;
  year: number;
}

const getCacheKey = (classId: string, practicalSubjectId: string | undefined, year: number, month: number) => {
  const cleanClass = String(classId).replace(/^Class\s*/i, "").trim();
  const subj = practicalSubjectId || "ALL";
  const m = String(month).padStart(2, "0");
  return `practical_scores_${cleanClass}_${subj}_${year}_${m}`;
};

/**
 * Normalizes API response which might be wrapped as:
 * - PracticalScore[]
 * - { success: boolean, data: PracticalScore[] }
 * - { data: { success: boolean, data: PracticalScore[] } }
 */
const normalizeList = (res: any): PracticalScore[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

/**
 * Normalizes single score API response
 */
const normalizeObj = (res: any): PracticalScore => {
  if (!res) return {} as PracticalScore;
  if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
    if (res.data.data && typeof res.data.data === 'object' && !Array.isArray(res.data.data)) {
      return res.data.data;
    }
    return res.data;
  }
  return res;
};

export const practicalScoreService = {
  /**
   * Fetch monthly scores for a class, subject, month, and year from MongoDB backend
   */
  async getMonthlyScores(params: QueryScoresParams): Promise<PracticalScore[]> {
    const cleanClass = String(params.classId).replace(/^Class\s*/i, "").trim();
    const queryParams: any = {
      classId: cleanClass,
      month: params.month,
      year: params.year,
    };
    if (params.practicalSubjectId && params.practicalSubjectId !== "ALL") {
      queryParams.practicalSubjectId = params.practicalSubjectId;
    }

    try {
      const res = await api.get<PracticalScore[]>("/muallim/practical-scores", {
        params: queryParams,
      });

      const scores = normalizeList(res);

      // Update cache
      try {
        const cacheKey = getCacheKey(cleanClass, params.practicalSubjectId, params.year, params.month);
        localStorage.setItem(cacheKey, JSON.stringify(scores));
      } catch (e) {
        console.warn("Failed to write practical scores cache", e);
      }

      return scores;
    } catch (err) {
      // Offline fallback: try reading from cache
      try {
        const cacheKey = getCacheKey(cleanClass, params.practicalSubjectId, params.year, params.month);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {
        console.warn("Failed to read practical scores cache", e);
      }
      throw err;
    }
  },

  /**
   * Record or update a single monthly practical score (Upsert)
   */
  async saveMonthlyScore(payload: SaveScorePayload): Promise<PracticalScore> {
    const cleanClass = String(payload.classId).replace(/^Class\s*/i, "").trim();
    const cleanPayload = {
      ...payload,
      classId: cleanClass,
      month: Number(payload.month),
      year: Number(payload.year),
      score: Number(payload.score),
    };

    const res = await api.post<PracticalScore>(
      "/muallim/practical-scores",
      cleanPayload
    );

    const saved = normalizeObj(res);

    // Invalidate/update cache
    try {
      const cacheKey = getCacheKey(cleanClass, payload.practicalSubjectId, payload.year, payload.month);
      const cached = localStorage.getItem(cacheKey);
      let list: PracticalScore[] = cached ? JSON.parse(cached) : [];
      const index = list.findIndex((s) => s.studentId === payload.studentId && s.practicalSubjectId === payload.practicalSubjectId);
      if (index >= 0) {
        list[index] = saved;
      } else {
        list.push(saved);
      }
      localStorage.setItem(cacheKey, JSON.stringify(list));

      // Also update "ALL" cache key
      const allCacheKey = getCacheKey(cleanClass, "ALL", payload.year, payload.month);
      const allCached = localStorage.getItem(allCacheKey);
      if (allCached) {
        let allList: PracticalScore[] = JSON.parse(allCached);
        const allIdx = allList.findIndex((s) => s.studentId === payload.studentId && s.practicalSubjectId === payload.practicalSubjectId);
        if (allIdx >= 0) allList[allIdx] = saved;
        else allList.push(saved);
        localStorage.setItem(allCacheKey, JSON.stringify(allList));
      }
    } catch (e) {
      console.warn("Failed to update practical score cache on save", e);
    }

    return saved;
  },

  /**
   * Bulk record scores for multiple students & practical subjects in a class for a month
   */
  async recordBulkMonthlyScores(payload: {
    classId: string;
    month: number;
    year: number;
    entries: Array<{
      studentId: string;
      practicalSubjectId: string;
      score: number;
      remarks?: string;
    }>;
  }): Promise<PracticalScore[]> {
    const cleanClass = String(payload.classId).replace(/^Class\s*/i, "").trim();
    const cleanPayload = {
      ...payload,
      classId: cleanClass,
      month: Number(payload.month),
      year: Number(payload.year),
    };

    const res = await api.post<PracticalScore[]>(
      "/muallim/practical-scores/bulk",
      cleanPayload
    );

    const savedList = normalizeList(res);

    // Invalidate/refresh local cache for this month & class
    try {
      const cacheKey = getCacheKey(cleanClass, "ALL", payload.year, payload.month);
      localStorage.setItem(cacheKey, JSON.stringify(savedList));
    } catch (e) {
      console.warn("Failed to update bulk practical scores cache", e);
    }

    return savedList;
  },

  /**
   * Get student's monthly history across all months
   */
  async getStudentHistory(studentId: string): Promise<PracticalScore[]> {
    const res = await api.get<PracticalScore[]>(
      `/muallim/practical-scores/student/${studentId}/history`
    );
    return normalizeList(res);
  },

  /**
   * Delete a monthly score
   */
  async deleteScore(scoreId: string): Promise<void> {
    await api.delete(`/muallim/practical-scores/${scoreId}`);
  },
};
