import { AkhlaqRecord, TeacherRemark, StudentGoal } from '../types';

const AKHLAQ_KEY = 'tharbiyah_akhlaq';
const REMARKS_KEY = 'tharbiyah_remarks';
const GOALS_KEY = 'tharbiyah_goals';

export const behaviourService = {
  // Akhlaq evaluations
  async getAkhlaqAll(): Promise<AkhlaqRecord[]> {
    const data = localStorage.getItem(AKHLAQ_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse stored akhlaq", e);
      }
    }
    return [];
  },

  async getAkhlaqByStudent(studentId: string): Promise<AkhlaqRecord | null> {
    const records = await this.getAkhlaqAll();
    return records.find(r => r.studentId === studentId) || null;
  },

  async saveAkhlaq(record: AkhlaqRecord): Promise<AkhlaqRecord> {
    const records = await this.getAkhlaqAll();
    const idx = records.findIndex(r => r.studentId === record.studentId);
    if (idx > -1) {
      records[idx] = record;
      localStorage.setItem(AKHLAQ_KEY, JSON.stringify(records));
      return records[idx];
    } else {
      const updated = [record, ...records];
      localStorage.setItem(AKHLAQ_KEY, JSON.stringify(updated));
      return record;
    }
  },

  // Teacher remarks
  async getRemarksAll(): Promise<TeacherRemark[]> {
    const data = localStorage.getItem(REMARKS_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse stored remarks", e);
      }
    }
    return [];
  },

  async getRemarksByStudent(studentId: string): Promise<TeacherRemark[]> {
    const remarks = await this.getRemarksAll();
    return remarks.filter(r => r.studentId === studentId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async addRemark(remarkData: Omit<TeacherRemark, 'id' | 'date'>): Promise<TeacherRemark> {
    const remarks = await this.getRemarksAll();
    const newRemark: TeacherRemark = {
      ...remarkData,
      id: `rem-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newRemark, ...remarks];
    localStorage.setItem(REMARKS_KEY, JSON.stringify(updated));
    return newRemark;
  },

  // Student Goals
  async getGoalsAll(): Promise<StudentGoal[]> {
    const data = localStorage.getItem(GOALS_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse stored goals", e);
      }
    }
    return [];
  },

  async getGoalsByStudent(studentId: string): Promise<StudentGoal[]> {
    const goals = await this.getGoalsAll();
    return goals.filter(g => g.studentId === studentId);
  },

  async saveGoal(goal: Omit<StudentGoal, 'id'> & { id?: string }): Promise<StudentGoal> {
    const goals = await this.getGoalsAll();
    if (goal.id) {
      const idx = goals.findIndex(g => g.id === goal.id);
      if (idx > -1) {
        goals[idx] = goal as StudentGoal;
        localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
        return goals[idx];
      }
    }
    const newGoal: StudentGoal = {
      ...goal,
      id: `goal-${Date.now()}`
    };
    const updated = [newGoal, ...goals];
    localStorage.setItem(GOALS_KEY, JSON.stringify(updated));
    return newGoal;
  }
};
