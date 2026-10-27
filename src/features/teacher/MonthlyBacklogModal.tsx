import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Avatar } from '../../components/common/Avatar';
import { Student } from '../../types';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { useNotifications } from '../../context/NotificationContext';
import { Calendar, Save, CheckCheck, RotateCcw } from 'lucide-react';

interface MonthlyBacklogModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  students: Student[];
  onSaved?: () => void;
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

export const MonthlyBacklogModal: React.FC<MonthlyBacklogModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
  students,
  onSaved,
}) => {
  const { showToast } = useNotifications();
  const saveMonthlyBacklog = useAttendanceStore((s) => s.saveMonthlyBacklog);
  const fetchMonthlyBacklog = useAttendanceStore((s) => s.fetchMonthlyBacklog);

  const currentDate = new Date();
  // Default to previous month if not January
  const defaultMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
  const defaultYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonth);
  const [totalWorkingDays, setTotalWorkingDays] = useState<number>(24);
  const [studentAttendedMap, setStudentAttendedMap] = useState<Record<string, number>>({});
  const [isLoadingExisting, setIsLoadingExisting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load existing records for the chosen class, year, and month
  useEffect(() => {
    if (!isOpen || !classId) return;

    let active = true;
    setIsLoadingExisting(true);

    fetchMonthlyBacklog(classId, selectedYear, selectedMonth)
      .then((records) => {
        if (!active) return;
        const map: Record<string, number> = {};
        let foundWorkingDays = 24;

        if (records && records.length > 0) {
          foundWorkingDays = records[0].totalWorkingDays || 24;
          records.forEach((r) => {
            const sId = typeof r.studentId === 'object' && r.studentId ? (r.studentId._id || r.studentId.id) : String(r.studentId);
            map[sId] = r.attendedDays;
          });
        }

        // Initialize any student not in the backlog with default working days
        students.forEach((s) => {
          if (map[s.id] === undefined) {
            map[s.id] = foundWorkingDays;
          }
        });

        setTotalWorkingDays(foundWorkingDays);
        setStudentAttendedMap(map);
      })
      .catch((err) => {
        console.error('Failed to load existing backlog:', err);
      })
      .finally(() => {
        if (active) setIsLoadingExisting(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, classId, selectedYear, selectedMonth, students, fetchMonthlyBacklog]);

  const handleAttendedChange = (studentId: string, val: string) => {
    const num = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
    setStudentAttendedMap((prev) => ({
      ...prev,
      [studentId]: Math.min(num, totalWorkingDays),
    }));
  };

  const handleSetAllMax = () => {
    const updated: Record<string, number> = {};
    students.forEach((s) => {
      updated[s.id] = totalWorkingDays;
    });
    setStudentAttendedMap(updated);
    showToast(`Set all students to full attendance (${totalWorkingDays} days)`);
  };

  const handleResetAllZero = () => {
    const updated: Record<string, number> = {};
    students.forEach((s) => {
      updated[s.id] = 0;
    });
    setStudentAttendedMap(updated);
    showToast('Reset all attended days to 0');
  };

  const handleSave = async () => {
    if (totalWorkingDays <= 0) {
      showToast('Please enter a valid Total Working Days count (greater than 0)');
      return;
    }

    if (students.length === 0) {
      showToast('No students enrolled in this class to record attendance');
      return;
    }

    setIsSaving(true);
    try {
      const monthObj = MONTHS.find((m) => m.value === Number(selectedMonth));
      const monthName = monthObj ? monthObj.label : `Month ${selectedMonth}`;

      const studentsData = students.map((s) => ({
        studentId: s.id,
        attendedDays: Math.min(studentAttendedMap[s.id] ?? totalWorkingDays, totalWorkingDays),
      }));

      await saveMonthlyBacklog({
        classId,
        year: Number(selectedYear),
        month: Number(selectedMonth),
        monthName,
        totalWorkingDays: Number(totalWorkingDays),
        studentsData,
      });

      showToast(`✓ Monthly attendance for ${monthName} ${selectedYear} saved successfully!`);
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save monthly backlog:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save monthly backlog';
      showToast(`✕ ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add / Edit Previous Month Attendance"
      subtitle={`Enter aggregated historical monthly attendance for ${className}`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Top Controls: Year, Month, Total Working Days */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#FAF8F2] rounded-2xl border border-[#E3EAE6]">
          {/* Month Selector */}
          <div>
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
          <div>
            <label className="block text-xs font-bold text-[#1F2933] mb-1">Academic Year</label>
            <Input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              min={2020}
              max={2035}
            />
          </div>

          {/* Total Working Days */}
          <div>
            <label className="block text-xs font-bold text-[#1F2933] mb-1">
              Total Working Days
            </label>
            <Input
              type="number"
              value={totalWorkingDays}
              onChange={(e) => {
                const nextVal = Math.max(1, parseInt(e.target.value, 10) || 1);
                setTotalWorkingDays(nextVal);
              }}
              min={1}
              max={31}
            />
          </div>
        </div>

        {/* Quick Batch Tools */}
        <div className="flex items-center justify-between text-xs text-[#667085] px-1">
          <span className="font-semibold">
            {students.length} Students Enrolled • Max working days: {totalWorkingDays}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSetAllMax}
              className="text-[#0F6B50] hover:text-[#084C3A] font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" /> All Full
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleResetAllZero}
              className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>
        </div>

        {/* Students List Table / Cards */}
        {isLoadingExisting ? (
          <div className="py-12 text-center text-sm text-[#667085]">
            <div className="animate-spin w-6 h-6 border-2 border-[#0F6B50] border-t-transparent rounded-full mx-auto mb-2" />
            Loading previous records for this month...
          </div>
        ) : students.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#667085] bg-[#FAF8F2] rounded-xl border border-[#E3EAE6]">
            No students found in {className}.
          </div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
            {students.map((student, index) => {
              const attended = studentAttendedMap[student.id] ?? totalWorkingDays;
              const percent = totalWorkingDays > 0 ? Math.round((attended / totalWorkingDays) * 100) : 0;

              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-3 p-3 bg-white hover:bg-[#FAF8F2]/60 rounded-xl border border-[#E3EAE6] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-[11px] font-extrabold text-[#667085] w-5 text-center shrink-0">
                      {index + 1}
                    </span>
                    <Avatar name={student.name} gender={student.gender} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-[#1F2933] uppercase truncate">
                        {student.name}
                      </p>
                      <p className="text-[10px] text-[#667085] truncate">
                        Adm: {student.admissionNo} • Class {student.class}
                      </p>
                    </div>
                  </div>

                  {/* Attended Input Field */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] font-black text-[#0F6B50]">{percent}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={totalWorkingDays}
                        value={attended}
                        onChange={(e) => handleAttendedChange(student.id, e.target.value)}
                        className="w-16 h-9 text-center font-bold text-xs bg-[#FAF8F2] border border-[#E3EAE6] rounded-lg focus:border-[#0F6B50] focus:ring-1 focus:ring-[#0F6B50] outline-none"
                      />
                      <span className="text-xs text-[#667085] font-semibold">/ {totalWorkingDays}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Action Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Month
          </Button>
        </div>
      </div>
    </Modal>
  );
};
