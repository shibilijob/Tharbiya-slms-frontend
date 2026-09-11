import { AttendanceRecord, AttendanceStatus } from '../types';
import { api } from '../lib/axios';
import { useStudentStore } from '../stores/studentStore';

/**
 * Maps raw backend Attendance document to frontend AttendanceRecord.
 * Enforces mapping:
 * - PRESENT / legacy LATE -> PRESENT
 * - EXCUSED / LEAVE -> LEAVE
 * - UNEXCUSED / ABSENT -> ABSENT
 * - HOLIDAY -> HOLIDAY
 */
function mapApiRecordToAttendanceRecord(r: any): AttendanceRecord {
  const dateStr =
    typeof r.date === 'string'
      ? r.date.split('T')[0]
      : new Date(r.date).toISOString().split('T')[0];

  let status: AttendanceStatus = 'PRESENT';
  if (r.status === 'EXCUSED' || r.status === 'LEAVE') {
    status = 'LEAVE';
  } else if (r.status === 'UNEXCUSED' || r.status === 'ABSENT') {
    status = 'ABSENT';
  } else if (r.status === 'HOLIDAY') {
    status = 'HOLIDAY';
  } else {
    status = 'PRESENT';
  }

  return {
    id: r._id?.toString() || r.id,
    studentId: r.studentId?._id?.toString() || r.studentId?.toString() || r.studentId,
    date: dateStr,
    status,
    remarks: r.remark || r.remarks || '',
    markedByTeacherId: r.markedById?._id?.toString() || r.markedById?.toString() || r.markedById || '',
  };
}

export const attendanceService = {
  /**
   * Fetch all attendance records for the authenticated user/context directly from MongoDB.
   */
  async getAll(): Promise<AttendanceRecord[]> {
    try {
      const res = await api.get('/attendance');
      const rawRecords =
        res.data?.records ||
        res.data?.data ||
        (Array.isArray(res.data) ? res.data : []);

      if (Array.isArray(rawRecords)) {
        return rawRecords.map(mapApiRecordToAttendanceRecord);
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch attendance records from server:', err);
      throw err;
    }
  },

  /**
   * Fetch attendance history for a single student from MongoDB.
   */
  async getByStudent(studentId: string): Promise<AttendanceRecord[]> {
    try {
      const res = await api.get(`/attendance/student/${studentId}`);
      const rawList =
        res.data?.records ||
        res.data?.data?.records ||
        res.data?.data ||
        (Array.isArray(res.data) ? res.data : []);

      if (Array.isArray(rawList)) {
        return rawList.map(mapApiRecordToAttendanceRecord);
      }
      return [];
    } catch (err) {
      console.error(`Failed to fetch attendance for student ${studentId}:`, err);
      throw err;
    }
  },

  /**
   * Fetch attendance for a specific class and date from MongoDB.
   */
  async getByDateAndClass(
    date: string,
    studentIds?: string[],
    classId?: string
  ): Promise<AttendanceRecord[]> {
    try {
      const url = classId
        ? `/attendance/class/${classId}?date=${date}`
        : `/attendance?date=${date}`;

      const res = await api.get(url);
      const rawList =
        res.data?.records ||
        res.data?.data ||
        (Array.isArray(res.data) ? res.data : []);

      if (Array.isArray(rawList)) {
        const mapped = rawList.map(mapApiRecordToAttendanceRecord);
        if (studentIds && studentIds.length > 0) {
          return mapped.filter((r) => studentIds.includes(r.studentId));
        }
        return mapped;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch attendance by date and class:', err);
      throw err;
    }
  },

  /**
   * Mark attendance for a single student.
   * Dispatches to batchMarkAttendance to ensure uniform backend persistence.
   */
  async markAttendance(
    studentId: string,
    date: string,
    status: AttendanceStatus,
    teacherId: string,
    remarks?: string,
    classId?: string
  ): Promise<AttendanceRecord> {
    const records = await this.batchMarkAttendance(
      [{ studentId, date, status, remarks }],
      teacherId,
      classId
    );
    if (!records || records.length === 0) {
      throw new Error('No attendance record returned from server');
    }
    return records[0];
  },

  /**
   * Batch mark attendance for multiple students.
   * Ensures MongoDB is the single source of truth without localStorage caching.
   */
  async batchMarkAttendance(
    updates: Array<{ studentId: string; date: string; status: AttendanceStatus; remarks?: string }>,
    _teacherId: string,
    classId?: string
  ): Promise<AttendanceRecord[]> {
    if (!updates || updates.length === 0) {
      return [];
    }

    // Resolve classId if not explicitly provided
    let targetClassId = classId;
    if (!targetClassId) {
      const students = useStudentStore.getState().students;
      const firstStudent = students.find((s) => s.id === updates[0].studentId);
      targetClassId = firstStudent?.class;
    }

    if (!targetClassId) {
      throw new Error('Class ID is required to mark attendance');
    }

    const date = updates[0].date;
    const response = await api.post('/attendance/mark', {
      classId: targetClassId,
      date,
      records: updates.map((u) => ({
        studentId: u.studentId,
        status: u.status,
        remark: u.remarks,
      })),
    });

    const rawRecords =
      response.data?.records ||
      response.data?.data?.records ||
      response.data?.data;

    if (Array.isArray(rawRecords) && rawRecords.length > 0) {
      return rawRecords.map(mapApiRecordToAttendanceRecord);
    }

    // If backend confirmed success without returning full records, query confirmed records from MongoDB
    const verified = await this.getByDateAndClass(
      date,
      updates.map((u) => u.studentId),
      targetClassId
    );
    return verified;
  },
};
