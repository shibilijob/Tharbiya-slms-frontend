import { MadrasaDay, TimetablePeriod } from '../types';
import { api } from '../lib/axios';

const DEFAULT_EMPTY_WEEK_SCHEDULE: Record<MadrasaDay, TimetablePeriod[]> = {
  Sunday: [],
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: []
};

export const timetableService = {
  /**
   * Fetch full weekly class timetable from backend MongoDB API
   */
  async fetchClassScheduleFromApi(classId: string): Promise<Record<MadrasaDay, TimetablePeriod[]>> {
    const res = await api.get<any>(`/muallim/timetable/periods/class/${classId}`);
    const rawList: any[] = Array.isArray(res.data)
      ? res.data
      : (Array.isArray(res.data?.data) ? res.data.data : []);

    const schedule: Record<MadrasaDay, TimetablePeriod[]> = {
      Sunday: [],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: []
    };

    rawList.forEach((p: any) => {
      const day = p.day as MadrasaDay;
      if (schedule[day]) {
        schedule[day].push({
          id: p.id || p._id,
          periodNumber: p.periodNumber,
          startTime: p.startTime,
          endTime: p.endTime,
          subject: p.subject,
          subjectMalayalam: p.subjectMalayalam || p.subject,
          teacherName: p.teacherName || '',
          room: p.room || '',
          notes: p.notes || ''
        });
      }
    });

    (Object.keys(schedule) as MadrasaDay[]).forEach((day) => {
      schedule[day].sort((a, b) => a.periodNumber - b.periodNumber);
    });

    return schedule;
  },

  /**
   * Add or update a timetable period against MongoDB
   */
  async updatePeriod(classId: string, day: MadrasaDay, updatedPeriod: TimetablePeriod): Promise<TimetablePeriod> {
    const isExisting = Boolean(updatedPeriod.id && /^[a-f\d]{24}$/i.test(updatedPeriod.id));

    if (isExisting) {
      const res = await api.patch<any>(`/muallim/timetable/periods/${updatedPeriod.id}`, {
        day,
        periodNumber: updatedPeriod.periodNumber,
        startTime: updatedPeriod.startTime,
        endTime: updatedPeriod.endTime,
        subject: updatedPeriod.subject,
        subjectMalayalam: updatedPeriod.subjectMalayalam,
        teacherName: updatedPeriod.teacherName,
        room: updatedPeriod.room,
        notes: updatedPeriod.notes
      });
      const data = res.data?.data || res.data;
      return {
        id: data.id || data._id || updatedPeriod.id,
        periodNumber: data.periodNumber ?? updatedPeriod.periodNumber,
        startTime: data.startTime ?? updatedPeriod.startTime,
        endTime: data.endTime ?? updatedPeriod.endTime,
        subject: data.subject ?? updatedPeriod.subject,
        subjectMalayalam: data.subjectMalayalam ?? updatedPeriod.subjectMalayalam,
        teacherName: data.teacherName ?? updatedPeriod.teacherName,
        room: data.room ?? updatedPeriod.room,
        notes: data.notes ?? updatedPeriod.notes
      };
    } else {
      const res = await api.post<any>('/muallim/timetable/periods', {
        classId,
        day,
        periodNumber: updatedPeriod.periodNumber,
        startTime: updatedPeriod.startTime,
        endTime: updatedPeriod.endTime,
        subject: updatedPeriod.subject,
        subjectMalayalam: updatedPeriod.subjectMalayalam,
        teacherName: updatedPeriod.teacherName,
        room: updatedPeriod.room,
        notes: updatedPeriod.notes
      });
      const data = res.data?.data || res.data;
      return {
        id: data.id || data._id,
        periodNumber: data.periodNumber ?? updatedPeriod.periodNumber,
        startTime: data.startTime ?? updatedPeriod.startTime,
        endTime: data.endTime ?? updatedPeriod.endTime,
        subject: data.subject ?? updatedPeriod.subject,
        subjectMalayalam: data.subjectMalayalam ?? updatedPeriod.subjectMalayalam,
        teacherName: data.teacherName ?? updatedPeriod.teacherName,
        room: data.room ?? updatedPeriod.room,
        notes: data.notes ?? updatedPeriod.notes
      };
    }
  },

  /**
   * Delete a timetable period from MongoDB
   */
  async deletePeriod(_classId: string, _day: MadrasaDay, periodId: string): Promise<void> {
    if (periodId && /^[a-f\d]{24}$/i.test(periodId)) {
      await api.delete(`/muallim/timetable/periods/${periodId}`);
    }
  },

};

