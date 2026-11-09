import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Student } from '../../types';
import { api } from '../../lib/axios';
import { Search, Users, CalendarCheck, Loader2 } from 'lucide-react';

export interface MonthlyAttendanceReportRow {
  studentId: string;
  studentName: string;
  admissionNo?: string;
  malayalamName?: string;
  present: number;
  totalWorkingDays: number;
}

interface MonthlyAttendanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  teacherClasses: string[];
  students: Student[];
  allStudents?: Student[];
  isSadhr?: boolean;
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const MonthlyAttendanceReportModal: React.FC<MonthlyAttendanceReportModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
  teacherClasses,
  students,
  allStudents,
  isSadhr,
}) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activeClass, setActiveClass] = useState<string>(
    classId || (teacherClasses.length > 0 ? teacherClasses[0] : '5')
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [records, setRecords] = useState<MonthlyAttendanceReportRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync active class whenever modal opens or classId prop changes
  useEffect(() => {
    if (isOpen) {
      if (classId) {
        setActiveClass(classId);
      } else if (teacherClasses.length > 0) {
        setActiveClass(teacherClasses[0]);
      }
      setSearchQuery('');
    }
  }, [isOpen, classId, teacherClasses]);

  const targetClass = isSadhr ? classId : activeClass;
  const displayClassName = isSadhr
    ? className
    : `Class ${String(activeClass).replace(/^Class\s*/i, '').trim()}`;

  // Fetch report data whenever month, year, or class changes
  useEffect(() => {
    if (!isOpen || !targetClass) return;

    let active = true;
    setIsLoading(true);

    const loadReport = async () => {
      try {
        const res: any = await api.get('/attendance/monthly-report', {
          params: {
            classId: targetClass,
            year: selectedYear,
            month: selectedMonth,
          },
        });

        if (!active) return;

        const rows: MonthlyAttendanceReportRow[] =
          res?.records || res?.data?.records || res?.data || [];
        setRecords(rows);
      } catch (err) {
        console.error('Failed to load monthly attendance report from endpoint:', err);
        if (!active) return;

        // Fallback computation using existing records
        try {
          const yr = selectedYear;
          const mo = selectedMonth;
          const startOfMonth = `${yr}-${String(mo).padStart(2, '0')}-01`;
          const lastDay = new Date(yr, mo, 0).getDate();
          const endOfMonth = `${yr}-${String(mo).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

          const [backlogRes, dailyRes] = await Promise.allSettled([
            api.get(`/attendance/backlog/class/${targetClass}`, { params: { year: yr, month: mo } }),
            api.get('/attendance', { params: { classId: targetClass, startDate: startOfMonth, endDate: endOfMonth } }),
          ]);

          if (!active) return;

          const backlogRecords: any[] =
            backlogRes.status === 'fulfilled'
              ? (backlogRes.value as any)?.records || (backlogRes.value as any)?.data || []
              : [];
          const dailyRecords: any[] =
            dailyRes.status === 'fulfilled'
              ? (dailyRes.value as any)?.records || (dailyRes.value as any)?.data || []
              : [];

          const classSchoolDates = new Set<string>();
          dailyRecords.forEach((r: any) => {
            if (r.status && r.status !== 'HOLIDAY') {
              const dStr = typeof r.date === 'string' ? r.date.split('T')[0] : '';
              if (dStr) classSchoolDates.add(dStr);
            }
          });
          const dailyClassWorkingDays = classSchoolDates.size;

          let backlogClassWorkingDays = 0;
          if (backlogRecords.length > 0) {
            backlogClassWorkingDays = Number(backlogRecords[0].totalWorkingDays) || 0;
          }

          const defaultWorkingDays = Math.max(dailyClassWorkingDays, backlogClassWorkingDays);

          const studentPool = allStudents && allStudents.length > 0 ? allStudents : students;
          const currentClassStudents = studentPool.filter((s) => {
            const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
            const targetClean = String(targetClass).replace(/^Class\s*/i, '').trim();
            return sClass === targetClean;
          });

          const fallbackRows: MonthlyAttendanceReportRow[] = currentClassStudents.map((s) => {
            const sDailyRecs = dailyRecords.filter(
              (r: any) => String(r.studentId?._id || r.studentId) === s.id
            );
            const dailyPresent = sDailyRecs.filter((r: any) => r.status === 'PRESENT').length;
            const studentNonHolidayDays = sDailyRecs.filter(
              (r: any) => r.status && r.status !== 'HOLIDAY'
            ).length;
            const dailyWorking = Math.max(dailyClassWorkingDays, studentNonHolidayDays);

            const sBacklog = backlogRecords.find(
              (b: any) => String(b.studentId?._id || b.studentId) === s.id
            );
            const backlogPresent = sBacklog ? Number(sBacklog.attendedDays) || 0 : 0;
            const backlogWorking = sBacklog
              ? Number(sBacklog.totalWorkingDays) || 0
              : backlogClassWorkingDays;

            let present = 0;
            let totalWorkingDays = defaultWorkingDays;

            if (sBacklog && (sBacklog.totalWorkingDays > 0 || sBacklog.attendedDays > 0)) {
              if (dailyWorking > 0 && dailyPresent > 0) {
                present = Math.max(dailyPresent, backlogPresent);
                totalWorkingDays = Math.max(dailyWorking, backlogWorking, defaultWorkingDays);
              } else {
                present = backlogPresent;
                totalWorkingDays = backlogWorking || defaultWorkingDays;
              }
            } else {
              present = dailyPresent;
              totalWorkingDays = dailyWorking || defaultWorkingDays;
            }

            return {
              studentId: s.id,
              studentName: s.name,
              admissionNo: s.admissionNo || '',
              malayalamName: s.malayalamName || '',
              present,
              totalWorkingDays,
            };
          });

          setRecords(fallbackRows);
        } catch (fallbackErr) {
          console.error('Fallback report calculation error:', fallbackErr);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadReport();

    return () => {
      active = false;
    };
  }, [isOpen, targetClass, selectedYear, selectedMonth, allStudents, students, isSadhr]);

  // Filter rows by search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase().trim();
    return records.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        (r.admissionNo && r.admissionNo.toLowerCase().includes(q)) ||
        (r.malayalamName && r.malayalamName.toLowerCase().includes(q))
    );
  }, [records, searchQuery]);

  const selectedMonthName =
    MONTHS.find((m) => m.value === selectedMonth)?.label || `Month ${selectedMonth}`;

  // Year options: previous years, current year, next year
  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = currentYear - 3; y <= currentYear + 1; y++) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Monthly Attendance Report"
      subtitle={`${displayClassName} • ${selectedMonthName} ${selectedYear}`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Controls: Month, Year, and Optional Class Selector */}
        <div className="p-4 bg-[#FAF8F2] rounded-2xl border border-[#E3EAE6] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Month Selector */}
            <div className={teacherClasses.length > 1 && !isSadhr ? 'sm:col-span-4' : 'sm:col-span-6'}>
              <label className="block text-xs font-bold text-[#1F2933] mb-1">Select Month</label>
              <Select
                value={String(selectedMonth)}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Year Selector */}
            <div className={teacherClasses.length > 1 && !isSadhr ? 'sm:col-span-4' : 'sm:col-span-6'}>
              <label className="block text-xs font-bold text-[#1F2933] mb-1">Academic Year</label>
              <Select
                value={String(selectedYear)}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>

            {/* Class Selector if teacher has multiple assigned classes */}
            {teacherClasses.length > 1 && !isSadhr && (
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-[#1F2933] mb-1">Assigned Class</label>
                <Select
                  value={activeClass}
                  onChange={(e) => setActiveClass(e.target.value)}
                >
                  {teacherClasses.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="pt-1">
            <Input
              placeholder="Search student by name or admission no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-[#667085]" />}
            />
          </div>
        </div>

        {/* Info header */}
        <div className="flex items-center justify-between text-xs text-[#667085] px-1">
          <span className="font-semibold flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#0F6B50]" />
            {filteredRows.length} {filteredRows.length === 1 ? 'Student' : 'Students'} Enrolled
          </span>
          <span className="font-bold text-[#0F6B50] bg-[#DDEDE5] px-2.5 py-1 rounded-full border border-[#bbdcd0]">
            {selectedMonthName} {selectedYear}
          </span>
        </div>

        {/* Report Table - ONLY 3 COLUMNS: Student Name, Present, Total Working Days */}
        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#E3EAE6] space-y-2">
            <Loader2 className="w-7 h-7 text-[#0F6B50] animate-spin mx-auto" />
            <p className="text-sm font-bold text-[#1F2933]">Loading monthly attendance report...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#E3EAE6]">
            <CalendarCheck className="w-8 h-8 text-[#667085] mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-[#1F2933]">No students found</p>
            <p className="text-xs text-[#667085] mt-1">
              {searchQuery ? 'Try adjusting your search query' : 'No students enrolled in this class'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#E3EAE6] bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E3EAE6] bg-[#FAF8F2] text-xs font-bold text-[#1F2933]">
                  <th className="py-3 px-4 sm:px-6">Student Name</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Present</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Total Working Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3EAE6] text-sm">
                {filteredRows.map((row) => (
                  <tr
                    key={row.studentId}
                    className="hover:bg-[#FAF8F2]/60 transition-colors"
                  >
                    <td className="py-3 px-4 sm:px-6">
                      <div className="font-bold text-[#1F2933]">{row.studentName}</div>
                      {row.malayalamName && (
                        <div className="font-malayalam text-xs text-[#0F6B50] font-medium">
                          {row.malayalamName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-right font-black text-[#0F6B50]">
                      {row.present}
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-right font-bold text-[#1F2933]">
                      {row.totalWorkingDays}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose} size="md">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

