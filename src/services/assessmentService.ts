import { AcademicAssessment } from '../types';
import { api } from '../lib/axios';

const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;

export interface StudentMarksSubject {
  id: string;
  name: string;
  code: string;
  arabicTitle?: string;
  malayalamTitle?: string;
  color?: string;
  icon?: string;
}

export interface StudentMarkRecord {
  id?: string;
  subjectId: string;
  subject?: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string;
  isAbsent?: boolean;
  remarks?: string;
}

export interface GetStudentMarksResponse {
  classId: string;
  className: string;
  assessmentId: string;
  student: {
    id: string;
    name: string;
    admissionNo: string;
    class: string;
  };
  subjects: StudentMarksSubject[];
  marks: StudentMarkRecord[];
}

export interface SaveStudentMarksPayload {
  classId: string;
  assessmentId: string;
  studentId: string;
  marks: Array<{
    subjectId: string;
    subjectName?: string;
    marksObtained: number;
    maxMarks: number;
    isAbsent?: boolean;
    remarks?: string;
  }>;
}

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

  async getStudentMarks(classId: string, assessmentId: string, studentId: string): Promise<GetStudentMarksResponse> {
    const response = await api.get('/assessment/student-marks', {
      params: { classId, assessmentId, studentId },
    });
    return unwrap(response);
  },

  async saveStudentMarks(payload: SaveStudentMarksPayload): Promise<any> {
    const response = await api.post('/assessment/student-marks/save', payload);
    return unwrap(response);
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
