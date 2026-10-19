import { AcademicAssessment } from '../types';
import { api } from '../lib/axios';

const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;

export const assessmentService = {
  async getAll(classId?: string): Promise<AcademicAssessment[]> {
    const response = await api.get('/muallim/assessments', { params: classId ? { classId } : {} });
    const rows = unwrap(response);
    return Array.isArray(rows) ? rows : [];
  },

  async getByStudent(studentId: string): Promise<AcademicAssessment[]> {
    const records = await this.getAll();
    return records.filter(r => r.studentId === studentId);
  },

  async save(assessment: Omit<AcademicAssessment, 'id'> & { id?: string }): Promise<AcademicAssessment> {
    const response = await api.post('/muallim/assessments', assessment);
    return unwrap(response) as AcademicAssessment;
  },

  async delete(id: string): Promise<boolean> {
    await api.delete(`/muallim/assessments/${id}`);
    return true;
  }
};
