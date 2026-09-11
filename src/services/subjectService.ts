import { SubjectMeta } from '../data/madrasaCurriculum';
import { api } from '../lib/axios';

const BASE_STORAGE_KEY = 'tharbiyah_subjects_list';

const getCurrentUserId = (): string => {
  try {
    const raw = localStorage.getItem('tharbiyah_auth_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.id || parsed?._id || 'guest';
    }
  } catch {}
  return 'guest';
};

const getStorageKey = (classId?: string) => {
  const userId = getCurrentUserId();
  if (!classId || classId.toUpperCase() === 'ALL') {
    return `${BASE_STORAGE_KEY}_user_${userId}`;
  }
  const cleanClass = classId.replace(/^Class\s*/i, '').trim();
  return `${BASE_STORAGE_KEY}_user_${userId}_class_${cleanClass}`;
};

export const subjectService = {
  getAll(classId?: string): SubjectMeta[] {
    const key = getStorageKey(classId);
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse stored subjects", e);
      }
    }

    return [];
  },

  async fetchFromApi(classId?: string): Promise<SubjectMeta[]> {
    try {
      const cleanClass = classId && classId.toUpperCase() !== 'ALL'
        ? String(classId).replace(/^Class\s*/i, '').trim()
        : undefined;

      const url = cleanClass 
        ? `/muallim/subjects/class/${encodeURIComponent(cleanClass)}` 
        : '/muallim/subjects';
      const res = await api.get<any>(url);
      const rawData = res.data?.data !== undefined && Array.isArray(res.data.data)
        ? res.data.data
        : (Array.isArray(res.data) ? res.data : null);

      if (rawData !== null) {
        const mapped: SubjectMeta[] = rawData.map((s: any) => ({
          id: s.id || s._id || s.name,
          name: s.name,
          malayalamName: s.malayalamTitle || s.nameMalayalam || s.malayalamName || s.name,
          arabicName: s.arabicTitle || s.arabicName || s.name,
          icon: s.icon || 'BookOpen',
          color: s.color || '#0F6B50',
          description: s.description || s.name,
          classId: s.classId || cleanClass || classId,
          className: s.className,
        }));
        this.saveAll(mapped, cleanClass);
        return mapped;
      }
    } catch (err) {
      console.error("Failed to fetch subjects from backend:", err);
      throw err;
    }
    return [];
  },

  saveAll(subjects: SubjectMeta[], classId?: string): void {
    const key = getStorageKey(classId);
    localStorage.setItem(key, JSON.stringify(subjects));
    if (!classId || classId.toUpperCase() === 'ALL') {
      localStorage.setItem(BASE_STORAGE_KEY, JSON.stringify(subjects));
    }
  },

  async addSubject(subjectData: SubjectMeta, classId?: string): Promise<SubjectMeta[]> {
    const cleanClass = classId && classId.toUpperCase() !== 'ALL'
      ? String(classId).replace(/^Class\s*/i, '').trim()
      : undefined;

    const payload: any = {
      name: subjectData.name.trim(),
      arabicTitle: subjectData.arabicName?.trim() || '',
      malayalamTitle: subjectData.malayalamName?.trim() || '',
      description: subjectData.description?.trim() || '',
      color: subjectData.color || '#0F6B50',
      icon: subjectData.icon || 'BookOpen',
    };
    if (cleanClass) payload.classId = cleanClass;

    // Execute backend creation. Do NOT silently catch or swallow errors.
    // If backend rejects (401, 403, 409, 500), the error propagates to store and UI.
    const res = await api.post<any>('/muallim/subjects', payload);
    const createdData = res.data?.data || res.data;
    const createdId = createdData?.id || createdData?._id;

    if (!createdId) {
      throw new Error('Backend failed to return created subject ID');
    }

    const persistedSubject: SubjectMeta = {
      ...subjectData,
      id: createdId,
      name: createdData.name || subjectData.name,
      arabicName: createdData.arabicTitle || subjectData.arabicName,
      malayalamName: createdData.malayalamTitle || subjectData.malayalamName,
      description: createdData.description ?? subjectData.description,
      color: createdData.color || subjectData.color,
      icon: createdData.icon || subjectData.icon || 'BookOpen',
      classId: cleanClass || subjectData.classId,
      className: createdData.className || subjectData.className,
    };

    // Update localStorage cache ONLY after confirmed backend persistence
    const list = this.getAll(cleanClass);
    const existingIdx = list.findIndex(
      (s) => s.id === persistedSubject.id || s.name.toLowerCase() === persistedSubject.name.toLowerCase()
    );
    let updated: SubjectMeta[];
    if (existingIdx > -1) {
      updated = [...list];
      updated[existingIdx] = persistedSubject;
    } else {
      updated = [...list, persistedSubject];
    }
    this.saveAll(updated, cleanClass);
    return updated;
  },

  async updateSubject(id: string, updates: Partial<SubjectMeta>, classId?: string): Promise<SubjectMeta[]> {
    const cleanClass = classId && classId.toUpperCase() !== 'ALL'
      ? String(classId).replace(/^Class\s*/i, '').trim()
      : undefined;

    if (id && !id.startsWith('Subject-') && !id.startsWith('subj-')) {
      await api.patch(`/muallim/subjects/${id}`, {
        name: updates.name,
        arabicTitle: updates.arabicName,
        malayalamTitle: updates.malayalamName,
        description: updates.description,
        color: updates.color,
        icon: updates.icon,
        classId: cleanClass,
      });
    }

    const list = this.getAll(cleanClass);
    const index = list.findIndex(s => s.id === id);
    if (index === -1) return list;
    const updated = [...list];
    updated[index] = { ...updated[index], ...updates };
    this.saveAll(updated, cleanClass);
    return updated;
  },

  async deleteSubject(id: string, classId?: string): Promise<SubjectMeta[]> {
    const cleanClass = classId && classId.toUpperCase() !== 'ALL'
      ? String(classId).replace(/^Class\s*/i, '').trim()
      : undefined;

    if (id && !id.startsWith('Subject-') && !id.startsWith('subj-')) {
      await api.delete(`/muallim/subjects/${id}`);
    }

    const list = this.getAll(cleanClass);
    const updated = list.filter(s => s.id !== id);
    this.saveAll(updated, cleanClass);
    return updated;
  }
};
