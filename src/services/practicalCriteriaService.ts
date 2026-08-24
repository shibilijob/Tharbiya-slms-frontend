import { AkhlaqCategoryMeta, AKHLAQ_CATEGORIES } from '../data/madrasaCurriculum';
import { api } from '../lib/axios';

const STORAGE_KEY = 'tharbiyah_practical_criteria';

export const practicalCriteriaService = {
  getAll: (): AkhlaqCategoryMeta[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load practical criteria from localStorage', e);
    }
    return [...AKHLAQ_CATEGORIES];
  },

  async fetchFromApi(classId?: string): Promise<AkhlaqCategoryMeta[]> {
    try {
      const url = classId ? `/muallim/practical-subjects/class/${classId}` : '/muallim/practical-subjects';
      const res = await api.get<any[]>(url);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: AkhlaqCategoryMeta[] = res.data.map((p: any) => ({
          id: p.id || p._id,
          title: p.name,
          titleMalayalam: p.nameMalayalam || p.name,
          description: p.name,
          maxScore: 5,
          icon: 'ShieldCheck'
        }));
        this.saveAll(mapped);
        return mapped;
      }
    } catch {
      // Offline fallback
    }
    return this.getAll();
  },

  saveAll: (criteria: AkhlaqCategoryMeta[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(criteria));
    } catch (e) {
      console.error('Failed to save practical criteria to localStorage', e);
    }
  },

  addCriteria: (newCriterion: AkhlaqCategoryMeta, classId?: string): AkhlaqCategoryMeta[] => {
    if (classId) {
      api.post('/muallim/practical-subjects', { name: newCriterion.title, classId }).catch(() => {});
    }

    const list = practicalCriteriaService.getAll();
    const exists = list.some(c => c.id.toLowerCase() === newCriterion.id.toLowerCase());
    if (exists) {
      newCriterion.id = `${newCriterion.id}-${Date.now()}`;
    }
    const updated = [...list, newCriterion];
    practicalCriteriaService.saveAll(updated);
    return updated;
  },

  updateCriteria: (id: string, updatedCriterion: AkhlaqCategoryMeta): AkhlaqCategoryMeta[] => {
    if (id && !id.startsWith('akhlaq-')) {
      api.patch(`/muallim/practical-subjects/${id}`, { name: updatedCriterion.title }).catch(() => {});
    }

    const list = practicalCriteriaService.getAll();
    const updated = list.map(c => c.id === id ? updatedCriterion : c);
    practicalCriteriaService.saveAll(updated);
    return updated;
  },

  deleteCriteria: (id: string): AkhlaqCategoryMeta[] => {
    if (id && !id.startsWith('akhlaq-')) {
      api.delete(`/muallim/practical-subjects/${id}`).catch(() => {});
    }

    const list = practicalCriteriaService.getAll();
    const updated = list.filter(c => c.id !== id);
    practicalCriteriaService.saveAll(updated);
    return updated;
  },

  resetToDefault: (): AkhlaqCategoryMeta[] => {
    practicalCriteriaService.saveAll(AKHLAQ_CATEGORIES);
    return [...AKHLAQ_CATEGORIES];
  }
};

