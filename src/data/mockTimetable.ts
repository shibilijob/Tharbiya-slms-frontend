import { SubjectName } from '../types';

export interface TimetablePeriod {
  id: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject: SubjectName | string;
  subjectMalayalam: string;
  teacherName: string;
  room: string;
  notes?: string;
}

export type MadrasaDay = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface ClassTimetableData {
  classId: string;
  className: string;
  schedules: Record<MadrasaDay, TimetablePeriod[]>;
}

export const DEFAULT_EMPTY_WEEK_SCHEDULE: Record<MadrasaDay, TimetablePeriod[]> = {
  Sunday: [],
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: []
};

export const DEFAULT_CLASS_5A_TIMETABLE: Record<MadrasaDay, TimetablePeriod[]> = {
  Sunday: [],
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: []
};

export const MOCK_TIMETABLES: Record<string, Record<MadrasaDay, TimetablePeriod[]>> = {
  '5A': { ...DEFAULT_EMPTY_WEEK_SCHEDULE },
  '5': { ...DEFAULT_EMPTY_WEEK_SCHEDULE },
  '6A': { ...DEFAULT_EMPTY_WEEK_SCHEDULE },
  '6': { ...DEFAULT_EMPTY_WEEK_SCHEDULE }
};
