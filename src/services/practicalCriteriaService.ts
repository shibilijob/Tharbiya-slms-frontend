import { AkhlaqCategoryMeta } from '../data/madrasaCurriculum';
import { api } from '../lib/axios';

const BASE_STORAGE_KEY = 'tharbiyah_practical_criteria';

const getStorageKey = (classId?: string) => {
  if (!classId || classId.toUpperCase() === 'ALL') {
    return BASE_STORAGE_KEY;
  }
  const cleanClass = String(classId).replace(/^Class\s*/i, '').trim();
  return `${BASE_STORAGE_KEY}_class_${cleanClass}`;
};

export const practicalCriteriaService = {
  getAll: (classId?: string): AkhlaqCategoryMeta[] => {
    const key = getStorageKey(classId);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load practical criteria from localStorage', e);
    }
    return [];
  },

  async fetchFromApi(classId?: string): Promise<AkhlaqCategoryMeta[]> {
    const cleanClass = classId && classId.toUpperCase() !== 'ALL'
      ? String(classId).replace(/^Class\s*/i, '').trim()
      : undefined;

    const url = cleanClass
      ? `/muallim/practical-subjects/class/${encodeURIComponent(cleanClass)}`
      : '/muallim/practical-subjects';

    const res = await api.get<any>(url);
    const rawList = Array.isArray(res.data?.data)
      ? res.data.data
      : (Array.isArray(res.data) ? res.data : []);

    const mapped: AkhlaqCategoryMeta[] = rawList.map((p: any) => ({
      id: p.id || p._id,
      title: p.name,
      titleMalayalam: p.nameMalayalam || p.titleMalayalam || p.name,
      description: p.description || p.name,
      maxScore: Number(p.maxScore ?? 5),
      icon: 'Sparkles',
    }));

    this.saveAll(mapped, cleanClass);
    return mapped;
  },

  saveAll: (criteria: AkhlaqCategoryMeta[], classId?: string): void => {
    const key = getStorageKey(classId);
    try {
      localStorage.setItem(key, JSON.stringify(criteria));
    } catch (e) {
      console.error('Failed to save practical criteria to localStorage', e);
    }
  },

  async addCriteria(newCriterion: AkhlaqCategoryMeta, classId: string): Promise<AkhlaqCategoryMeta[]> {
    const cleanClass = String(classId).replace(/^Class\s*/i, '').trim();
    if (!cleanClass) {
      throw new Error("Class is required to create a practical subject");
    }

    const validatedMaxScore = Math.max(1, Math.min(100, Number(newCriterion.maxScore) || 5));

    const payload = {
      name: newCriterion.title.trim(),
      classId: cleanClass,
      maxScore: validatedMaxScore,
    };

    const res = await api.post<any>('/muallim/practical-subjects', payload);
    const createdData = res.data?.data || res.data;
    const createdId = createdData?.id || createdData?._id;

    if (createdId) {
      newCriterion.id = createdId;
      newCriterion.maxScore = Number(createdData?.maxScore ?? validatedMaxScore);
    }

    const list = this.getAll(cleanClass);
    const updated = [
      ...list.filter((c) => c.id !== newCriterion.id && c.title.toLowerCase() !== newCriterion.title.toLowerCase()),
      newCriterion,
    ];
    this.saveAll(updated, cleanClass);
    return updated;
  },

  async updateCriteria(
    id: string,
    updatedCriterion: AkhlaqCategoryMeta,
    classId: string
  ): Promise<AkhlaqCategoryMeta[]> {
    const cleanClass = String(classId).replace(/^Class\s*/i, '').trim();

    const payload: any = {
      name: updatedCriterion.title.trim(),
      classId: cleanClass,
    };

    if (updatedCriterion.maxScore !== undefined) {
      payload.maxScore = Math.max(1, Math.min(100, Number(updatedCriterion.maxScore) || 5));
    }

    if (id && !id.startsWith('akhlaq-') && !id.startsWith('temp-')) {
      const res = await api.patch<any>(`/muallim/practical-subjects/${id}`, payload);
      const updatedData = res.data?.data || res.data;
      if (updatedData) {
        if (updatedData.name) {
          updatedCriterion.title = updatedData.name;
        }
        if (updatedData.maxScore !== undefined) {
          updatedCriterion.maxScore = Number(updatedData.maxScore);
        }
        if (updatedData.id || updatedData._id) {
          updatedCriterion.id = updatedData.id || updatedData._id;
        }
      }
    }

    const list = this.getAll(cleanClass);
    const updated = list.some((c) => c.id === id)
      ? list.map((c) => (c.id === id ? { ...c, ...updatedCriterion } : c))
      : [...list, updatedCriterion];
    this.saveAll(updated, cleanClass);
    return updated;
  },

  async deleteCriteria(id: string, classId: string): Promise<AkhlaqCategoryMeta[]> {
    const cleanClass = String(classId).replace(/^Class\s*/i, '').trim();

    if (id && !id.startsWith('akhlaq-') && !id.startsWith('temp-')) {
      await api.delete(`/muallim/practical-subjects/${id}`);
    }

    const list = this.getAll(cleanClass);
    const updated = list.filter((c) => c.id !== id);
    this.saveAll(updated, cleanClass);
    return updated;
  },
};

