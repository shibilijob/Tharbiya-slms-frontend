import { MadrasaDay, TimetablePeriod, DEFAULT_EMPTY_WEEK_SCHEDULE } from '../data/mockTimetable';
import { api } from '../lib/axios';

const TIMETABLE_STORAGE_KEY = 'tharbiyah_timetables';

export const timetableService = {
  getAll(): Record<string, Record<MadrasaDay, TimetablePeriod[]>> {
    const data = localStorage.getItem(TIMETABLE_STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Failed to parse stored timetables", e);
      }
    }
    return {};
  },

  async fetchClassScheduleFromApi(classId: string): Promise<Record<MadrasaDay, TimetablePeriod[]> | null> {
    try {
      const res = await api.get<any[]>(`/muallim/timetable/periods/class/${classId}`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const schedule: Record<MadrasaDay, TimetablePeriod[]> = {
          Sunday: [],
          Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: [],
          Saturday: []
        };

        res.data.forEach((p: any) => {
          if (schedule[p.day as MadrasaDay]) {
            schedule[p.day as MadrasaDay].push({
              id: p.id || p._id,
              periodNumber: p.periodNumber,
              startTime: p.startTime,
              endTime: p.endTime,
              subject: p.subject,
              subjectMalayalam: p.subjectMalayalam || p.subject,
              teacherName: p.teacherName || 'Usthad Shihabudheen Saadi',
              room: p.room || 'Dars Hall',
              notes: p.notes
            });
          }
        });

        // Save into local cache
        const all = this.getAll();
        all[classId] = schedule;
        localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(all));
        return schedule;
      }
    } catch {
      // Offline fallback
    }
    return null;
  },

  getClassSchedule(classId: string): Record<MadrasaDay, TimetablePeriod[]> {
    const all = this.getAll();
    return all[classId] || all['5A'] || { ...DEFAULT_EMPTY_WEEK_SCHEDULE };
  },

  getDaySchedule(classId: string, day: MadrasaDay): TimetablePeriod[] {
    const classSchedule = this.getClassSchedule(classId);
    return classSchedule[day] || [];
  },

  saveDaySchedule(classId: string, day: MadrasaDay, periods: TimetablePeriod[]): void {
    const all = this.getAll();
    const currentClassSchedule = all[classId] || { ...DEFAULT_EMPTY_WEEK_SCHEDULE };
    currentClassSchedule[day] = periods;
    all[classId] = currentClassSchedule;
    // Also save alias if 5 -> 5A
    if (classId === '5') all['5A'] = currentClassSchedule;
    if (classId === '5A') all['5'] = currentClassSchedule;
    if (classId === '6') all['6A'] = currentClassSchedule;
    if (classId === '6A') all['6'] = currentClassSchedule;
    
    localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(all));
  },

  updatePeriod(classId: string, day: MadrasaDay, updatedPeriod: TimetablePeriod): TimetablePeriod[] {
    try {
      if (updatedPeriod.id && !updatedPeriod.id.startsWith('p-') && !updatedPeriod.id.startsWith('p6-')) {
        api.patch(`/muallim/timetable/periods/${updatedPeriod.id}`, {
          day,
          periodNumber: updatedPeriod.periodNumber,
          startTime: updatedPeriod.startTime,
          endTime: updatedPeriod.endTime,
          subject: updatedPeriod.subject,
          subjectMalayalam: updatedPeriod.subjectMalayalam,
          teacherName: updatedPeriod.teacherName,
          room: updatedPeriod.room,
          notes: updatedPeriod.notes
        }).catch(() => {});
      } else {
        api.post<any>('/muallim/timetable/periods', {
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
        }).then((res) => {
          if (res.data?.id) {
            updatedPeriod.id = res.data.id;
          }
        }).catch(() => {});
      }
    } catch {
      // Offline fallback
    }

    const periods = this.getDaySchedule(classId, day);
    const index = periods.findIndex(p => p.id === updatedPeriod.id);
    let newPeriods: TimetablePeriod[];
    if (index > -1) {
      newPeriods = [...periods];
      newPeriods[index] = updatedPeriod;
    } else {
      newPeriods = [...periods, updatedPeriod];
    }
    // Sort by period number
    newPeriods.sort((a, b) => a.periodNumber - b.periodNumber);
    this.saveDaySchedule(classId, day, newPeriods);
    return newPeriods;
  },

  deletePeriod(classId: string, day: MadrasaDay, periodId: string): TimetablePeriod[] {
    try {
      if (periodId && !periodId.startsWith('p-') && !periodId.startsWith('p6-')) {
        api.delete(`/muallim/timetable/periods/${periodId}`).catch(() => {});
      }
    } catch {
      // Offline fallback
    }

    const periods = this.getDaySchedule(classId, day);
    const newPeriods = periods.filter(p => p.id !== periodId);
    this.saveDaySchedule(classId, day, newPeriods);
    return newPeriods;
  },

  resetClassTimetable(classId: string): Record<MadrasaDay, TimetablePeriod[]> {
    const all = this.getAll();
    const defaultData = { ...DEFAULT_EMPTY_WEEK_SCHEDULE };
    all[classId] = defaultData;
    localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(all));
    return defaultData;
  }
};

