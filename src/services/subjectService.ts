import { SubjectMeta } from '../data/madrasaCurriculum';
import { api } from '../lib/axios';

const SUBJECTS_STORAGE_KEY = 'tharbiyah_subjects_list';

export const subjectService = {
  getAll(): SubjectMeta[] {
    const data = localStorage.getItem(SUBJECTS_STORAGE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
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
      const url = classId ? `/muallim/subjects/class/${classId}` : '/muallim/subjects';
      const res = await api.get<any[]>(url);
      if (res.data && Array.isArray(res.data)) {
        const mapped: SubjectMeta[] = res.data.map((s: any) => ({
          id: s.id || s._id || s.name,
          name: s.name,
          malayalamName: s.malayalamTitle || s.nameMalayalam || s.malayalamName || s.name,
          arabicName: s.arabicTitle || s.arabicName || s.name,
          icon: s.icon || 'BookOpen',
          color: s.color || '#0F6B50',
          description: s.description || s.name
        }));
        this.saveAll(mapped);
        return mapped;
      }
    } catch (err) {
      console.error("Failed to fetch subjects from backend:", err);
    }
    return this.getAll();
  },

  saveAll(subjects: SubjectMeta[]): void {
    localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(subjects));
  },

  async addSubject(subjectData: SubjectMeta, classId?: string): Promise<SubjectMeta[]> {
    try {
      const payload: any = {
        name: subjectData.name,
        arabicTitle: subjectData.arabicName,
        malayalamTitle: subjectData.malayalamName,
        description: subjectData.description,
        color: subjectData.color,
        icon: subjectData.icon || 'BookOpen',
      };
      if (classId) payload.classId = classId;

      const res = await api.post<any>('/muallim/subjects', payload);
      if (res.data?.id) {
        subjectData.id = res.data.id;
      }
    } catch (err) {
      console.error("Failed to add subject on backend:", err);
    }

    const list = this.getAll();
    const existingIdx = list.findIndex(s => s.id === subjectData.id || s.name.toLowerCase() === subjectData.name.toLowerCase());
    let updated: SubjectMeta[];
    if (existingIdx > -1) {
      updated = [...list];
      updated[existingIdx] = subjectData;
    } else {
      updated = [...list, subjectData];
    }
    this.saveAll(updated);
    return updated;
  },

  async updateSubject(id: string, updates: Partial<SubjectMeta>): Promise<SubjectMeta[]> {
    try {
      if (id && !id.startsWith('Subject-') && !id.startsWith('subj-')) {
        await api.patch(`/muallim/subjects/${id}`, {
          name: updates.name,
          arabicTitle: updates.arabicName,
          malayalamTitle: updates.malayalamName,
          description: updates.description,
          color: updates.color,
          icon: updates.icon,
        });
      }
    } catch (err) {
      console.error("Failed to update subject on backend:", err);
    }

    const list = this.getAll();
    const index = list.findIndex(s => s.id === id);
    if (index === -1) return list;
    const updated = [...list];
    updated[index] = { ...updated[index], ...updates };
    this.saveAll(updated);
    return updated;
  },

  async deleteSubject(id: string): Promise<SubjectMeta[]> {
    try {
      if (id && !id.startsWith('Subject-') && !id.startsWith('subj-')) {
        await api.delete(`/muallim/subjects/${id}`);
      }
    } catch (err) {
      console.error("Failed to delete subject on backend:", err);
    }

    const list = this.getAll();
    const updated = list.filter(s => s.id !== id);
    this.saveAll(updated);
    return updated;
  }
};
