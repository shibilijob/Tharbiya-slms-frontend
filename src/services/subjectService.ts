import { MADRASA_SUBJECTS, SubjectMeta } from '../data/madrasaCurriculum';
import { api } from '../lib/axios';

const SUBJECTS_STORAGE_KEY = 'tharbiyah_subjects_list';

export const subjectService = {
  getAll(): SubjectMeta[] {
    const data = localStorage.getItem(SUBJECTS_STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse stored subjects", e);
      }
    }
    return MADRASA_SUBJECTS;
  },

  async fetchFromApi(classId?: string): Promise<SubjectMeta[]> {
    try {
      const url = classId ? `/muallim/subjects/class/${classId}` : '/muallim/subjects';
      const res = await api.get<any[]>(url);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: SubjectMeta[] = res.data.map((s: any) => ({
          id: (s.name as any),
          name: s.name,
          malayalamName: s.nameMalayalam || s.name,
          arabicName: s.name,
          icon: 'BookOpen',
          color: '#0F6B50',
          description: s.name
        }));
        this.saveAll(mapped);
        return mapped;
      }
    } catch {
      // Offline fallback
    }
    return this.getAll();
  },

  saveAll(subjects: SubjectMeta[]): void {
    localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(subjects));
  },

  addSubject(subjectData: SubjectMeta, classId?: string): SubjectMeta[] {
    if (classId) {
      api.post('/muallim/subjects', { name: subjectData.name, classId }).catch(() => {});
    }

    const list = this.getAll();
    const existingIdx = list.findIndex(s => s.id === subjectData.id);
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

  updateSubject(id: string, updates: Partial<SubjectMeta>): SubjectMeta[] {
    if (id && !id.startsWith('subj-')) {
      api.patch(`/muallim/subjects/${id}`, { name: updates.name }).catch(() => {});
    }

    const list = this.getAll();
    const index = list.findIndex(s => s.id === id);
    if (index === -1) return list;
    const updated = [...list];
    updated[index] = { ...updated[index], ...updates };
    this.saveAll(updated);
    return updated;
  },

  deleteSubject(id: string): SubjectMeta[] {
    if (id && !id.startsWith('subj-')) {
      api.delete(`/muallim/subjects/${id}`).catch(() => {});
    }

    const list = this.getAll();
    const updated = list.filter(s => s.id !== id);
    this.saveAll(updated);
    return updated;
  },

  resetToDefault(): SubjectMeta[] {
    this.saveAll(MADRASA_SUBJECTS);
    return MADRASA_SUBJECTS;
  }
};

