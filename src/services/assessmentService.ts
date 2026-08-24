import { AcademicAssessment } from '../types';

const STORAGE_KEY = 'tharbiyah_assessments';

export const assessmentService = {
  async getAll(): Promise<AcademicAssessment[]> {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse stored assessments", e);
      }
    }
    return [];
  },

  async getByStudent(studentId: string): Promise<AcademicAssessment[]> {
    const records = await this.getAll();
    return records.filter(r => r.studentId === studentId);
  },

  async save(assessment: Omit<AcademicAssessment, 'id'> & { id?: string }): Promise<AcademicAssessment> {
    const records = await this.getAll();
    if (assessment.id) {
      const idx = records.findIndex(r => r.id === assessment.id);
      if (idx > -1) {
        records[idx] = assessment as AcademicAssessment;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        return records[idx];
      }
    }

    const newRecord: AcademicAssessment = {
      ...assessment,
      id: `ass-${Date.now()}`
    };
    const updated = [newRecord, ...records];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  },

  async delete(id: string): Promise<boolean> {
    const records = await this.getAll();
    const updated = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  }
};
