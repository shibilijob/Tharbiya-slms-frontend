import { api } from '../lib/axios';

export type HifzRecordStatus = 'COMPLETED' | 'PARTIAL' | 'NOT_COMPLETED';
export type TargetStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface HifzSchedule {
  dateFrom: string;
  dateTo: string;
  ayahFrom: number;
  ayahTo: number;
}

export interface HifzRange {
  ayahFrom: number;
  ayahTo: number;
}

export interface HifzTarget {
  id: string;
  classId: string;
  className?: string;
  academicYearId: string;
  academicYearName?: string;
  criteria: string;
  juzNumber?: number;
  surahNumber?: number;
  surahName?: string;
  totalAyahsToMemorize?: number;
  fromAyah?: number;
  toAyah?: number;
  schedules: HifzSchedule[];
  startDate: string;
  endDate: string;
  status: TargetStatus;
  isActive: boolean;
  createdById: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHifzTargetInput {
  classId: string;
  criteria: string;
  juzNumber?: number;
  surahNumber?: number;
  surahName?: string;
  totalAyahsToMemorize?: number;
  fromAyah?: number;
  toAyah?: number;
  schedules?: HifzSchedule[];
  startDate: string;
  endDate: string;
  status?: TargetStatus;
  isActive?: boolean;
}

export interface HifzRecord {
  id: string;
  studentId: string;
  studentName?: string;
  admissionNumber?: string;
  classId: string;
  className?: string;
  hifzTargetId: string;
  targetCriteria?: string;
  date: string;
  progress: string;
  completedAyahFrom?: number;
  completedAyahTo?: number;
  completedRanges: HifzRange[];
  status: HifzRecordStatus;
  remark?: string;
  recordedById: string;
  recordedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHifzRecordInput {
  studentId: string;
  classId: string;
  hifzTargetId: string;
  date?: string;
  progress: string;
  completedAyahFrom?: number;
  completedAyahTo?: number;
  completedRanges?: HifzRange[];
  status?: HifzRecordStatus | string;
  remark?: string;
}

export const hifzService = {
  // =========================================================================
  // TARGET METHODS
  // =========================================================================

  async fetchTargets(classId?: string): Promise<HifzTarget[]> {
    const params = classId ? { classId } : {};
    const res = await api.get<HifzTarget[]>('/hifz/targets', { params });
    const payload = res?.data !== undefined ? res.data : res;
    return Array.isArray(payload) ? payload : (payload as any)?.data || [];
  },

  async fetchActiveTarget(classId: string): Promise<HifzTarget | null> {
    try {
      const res = await api.get<HifzTarget | null>(`/hifz/targets/active/${classId}`);
      if (!res) return null;
      const payload = res?.data !== undefined ? res.data : res;
      if (!payload) return null;
      if (typeof payload === 'object' && ('id' in payload || '_id' in payload || 'criteria' in payload)) {
        return payload as HifzTarget;
      }
      return null;
    } catch {
      return null;
    }
  },

  async createTarget(data: CreateHifzTargetInput): Promise<HifzTarget> {
    const res = await api.post<HifzTarget>('/hifz/targets', data);
    const payload = res?.data !== undefined ? res.data : res;
    return payload as HifzTarget;
  },

  async updateTarget(id: string, data: Partial<CreateHifzTargetInput>): Promise<HifzTarget> {
    const res = await api.patch<HifzTarget>(`/hifz/targets/${id}`, data);
    const payload = res?.data !== undefined ? res.data : res;
    return payload as HifzTarget;
  },

  async deleteTarget(id: string): Promise<void> {
    await api.delete(`/hifz/targets/${id}`);
  },

  // =========================================================================
  // RECORD METHODS
  // =========================================================================

  async fetchRecords(params?: { targetId?: string; classId?: string; studentId?: string; date?: string }): Promise<HifzRecord[]> {
    const res = await api.get<HifzRecord[]>('/hifz/records', { params });
    const payload = res?.data !== undefined ? res.data : res;
    return Array.isArray(payload) ? payload : (payload as any)?.data || [];
  },

  async createRecord(data: CreateHifzRecordInput): Promise<HifzRecord> {
    const res = await api.post<HifzRecord>('/hifz/records', data);
    const payload = res?.data !== undefined ? res.data : res;
    return payload as HifzRecord;
  },

  async updateRecord(id: string, data: Partial<CreateHifzRecordInput>): Promise<HifzRecord> {
    const res = await api.patch<HifzRecord>(`/hifz/records/${id}`, data);
    const payload = res?.data !== undefined ? res.data : res;
    return payload as HifzRecord;
  },

  async deleteRecord(id: string): Promise<void> {
    await api.delete(`/hifz/records/${id}`);
  },
};
