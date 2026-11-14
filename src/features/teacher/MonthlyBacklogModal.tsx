import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Avatar } from '../../components/common/Avatar';
import { Student } from '../../types';
import { api } from '../../lib/axios';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { useNotifications } from '../../context/NotificationContext';
import { mapBackendStudentToFrontend } from '../../services/studentService';
import { sortStudentsByRollNumber } from '../../utils/studentSorting';
import { Save, CheckCheck, RotateCcw } from 'lucide-react';

interface MonthlyBacklogModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className: string;
  students: Student[];
  onSaved?: () => void;
  teacherClasses?: string[];
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

export const MonthlyBacklogModal: React.FC<MonthlyBacklogModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
  students,
  onSaved,
  teacherClasses = [],
  isSadhr = false,
}) => {
  const { showToast } = useNotifications();
  const saveMonthlyBacklog = useAttendanceStore((s) => s.saveMonthlyBacklog);

  const currentDate = new Date();
  // Default to previous month if not January
  const defaultMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
  const defaultYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();

  const [currentClassId, setCurrentClassId] = useState<string>(classId);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonth);
  const [totalWorkingDays, setTotalWorkingDays] = useState<number>(24);
  const [studentAttendedMap, setStudentAttendedMap] = useState<Record<string, number>>({});
  const [isLoadingExisting, setIsLoadingExisting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync currentClassId when modal opens or classId prop changes
  useEffect(() => {
    if (isOpen) {
      setCurrentClassId(classId);
    }
  }, [isOpen, classId]);

  // Load students belonging strictly to the currently selected class
  useEffect(() => {
    if (!isOpen || !currentClassId) {
      setClassStudents([]);
      return;
    }

    let active = true;
    // Clear the previous class's student list before loading the new one
    setClassStudents([]);
    setStudentAttendedMap({});
    setIsLoadingStudents(true);

    const loadStudents = async () => {
      const cleanRequested = String(currentClassId).replace(/^Class\s*/i, '').trim();
      const cleanTarget = cleanRequested.toLowerCase();

      try {
        // Pass the selected classId directly to the student-fetching API
        const res: any = await api.get(`/muallim/classes/${cleanRequested}/students`);

        if (!active) return;

        const rawList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res)
          ? res
          : [];

        const mapped: Student[] = rawList.map((s: any) =>
          mapBackendStudentToFrontend(s, cleanRequested)
        );

        // Apply classId filtering at frontend level to guarantee only current class students are kept
        const filtered = mapped.filter((s) => {
          const sClass = String(s.class || '').replace(/^Class\s*/i, '').trim().toLowerCase();
          const sClassId = String((s as any).classId?._id || (s as any).classId || '').toLowerCase();
          return sClass === cleanTarget || sClassId === cleanTarget;
        });

        if (filtered.length > 0) {
          setClassStudents(sortStudentsByRollNumber(filtered));
        } else {
          // Fallback to prop students strictly filtered by the current classId
          const propFiltered = (students || []).filter((s) => {
            const sClass = String(s.class || '').replace(/^Class\s*/i, '').trim().toLowerCase();
            const sClassId = String((s as any).classId?._id || (s as any).classId || '').toLowerCase();
            return sClass === cleanTarget || sClassId === cleanTarget;
          });
          setClassStudents(sortStudentsByRollNumber(propFiltered));
        }
      } catch (err) {
        if (!active) return;
        console.warn('Failed to load students for class backlog:', err);
        // Fallback to prop students strictly filtered by current class
        const propFiltered = (students || []).filter((s) => {
          const sClass = String(s.class || '').replace(/^Class\s*/i, '').trim().toLowerCase();
          const sClassId = String((s as any).classId?._id || (s as any).classId || '').toLowerCase();
          return sClass === cleanTarget || sClassId === cleanTarget;
        });
        setClassStudents(sortStudentsByRollNumber(propFiltered));
      } finally {
        if (active) {
          setIsLoadingStudents(false);
        }
      }
    };

    loadStudents();

    return () => {
      active = false;
    };
  }, [isOpen, currentClassId, students]);

  // Load existing records for the chosen class, year, and month
  useEffect(() => {
    if (!isOpen || !currentClassId) return;

    let active = true;
    setIsLoadingExisting(true);

    const loadExistingBacklog = async () => {
      try {
        const cleanTarget = String(currentClassId).replace(/^Class\s*/i, '').trim();
        let res: any;
        try {
          res = await api.get(`/attendance/backlog/class/${cleanTarget}`, {
            params: { year: selectedYear, month: selectedMonth },
          });
        } catch {
          res = await api.get(`/attendance/backlog/${cleanTarget}`, {
            params: { year: selectedYear, month: selectedMonth },
          });
        }

        if (!active) return;

        const records: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.records)
          ? res.records
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.records)
          ? res.data.records
          : [];

        if (records && records.length > 0) {
          const foundWorkingDays = records[0].totalWorkingDays || 24;
          setTotalWorkingDays(foundWorkingDays);

          const map: Record<string, number> = {};
          records.forEach((r: any) => {
            const sId =
              typeof r.studentId === 'object' && r.studentId
                ? String(r.studentId._id || r.studentId.id)
                : String(r.studentId);
            const attended = typeof r.attendedDays === 'number' ? r.attendedDays : foundWorkingDays;
            map[sId] = attended;

            const matchedStudent = classStudents.find(
              (s) => String(s.id) === sId || String((s as any)._id) === sId
            );
            if (matchedStudent) {
              map[matchedStudent.id] = attended;
              if ((matchedStudent as any)._id) {
                map[String((matchedStudent as any)._id)] = attended;
              }
            }
          });

          // Initialize any student in this class not in the backlog with default working days
          classStudents.forEach((s) => {
            if (map[s.id] === undefined) {
              map[s.id] = foundWorkingDays;
            }
          });

          setStudentAttendedMap(map);
        } else {
          // If no records exist, fallback to the default 24 days
          setTotalWorkingDays(24);
          const map: Record<string, number> = {};
          classStudents.forEach((s) => {
            map[s.id] = 24;
          });
          setStudentAttendedMap(map);
        }
      } catch (err) {
        if (!active) return;
        console.error('Failed to load existing backlog:', err);
        setTotalWorkingDays(24);
        const map: Record<string, number> = {};
        classStudents.forEach((s) => {
          map[s.id] = 24;
        });
        setStudentAttendedMap(map);
      } finally {
        if (active) {
          setIsLoadingExisting(false);
        }
      }
    };

    loadExistingBacklog();

    return () => {
      active = false;
    };
  }, [isOpen, currentClassId, selectedYear, selectedMonth, classStudents]);

  const handleAttendedChange = (studentId: string, val: string) => {
    const num = val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0);
    setStudentAttendedMap((prev) => ({
      ...prev,
      [studentId]: Math.min(num, totalWorkingDays),
    }));
  };

  const handleSetAllMax = () => {
    const updated: Record<string, number> = {};
    classStudents.forEach((s) => {
      updated[s.id] = totalWorkingDays;
    });
    setStudentAttendedMap(updated);
    showToast(`Set all students to full attendance (${totalWorkingDays} days)`);
  };

  const handleResetAllZero = () => {
    const updated: Record<string, number> = {};
    classStudents.forEach((s) => {
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

    if (classStudents.length === 0) {
      showToast('No students enrolled in this class to record attendance');
      return;
    }

    setIsSaving(true);
    try {
      const monthObj = MONTHS.find((m) => m.value === Number(selectedMonth));
      const monthName = monthObj ? monthObj.label : `Month ${selectedMonth}`;

      const studentsData = classStudents.map((s) => ({
        studentId: s.id,
        attendedDays: Math.min(studentAttendedMap[s.id] ?? totalWorkingDays, totalWorkingDays),
      }));

      await saveMonthlyBacklog({
        classId: currentClassId,
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

  const currentDisplayClassName = isSadhr
    ? className
    : currentClassId
    ? `Class ${String(currentClassId).replace(/^Class\s*/i, '').trim()}`
    : className;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add / Edit Previous Month Attendance"
      subtitle={`Enter aggregated historical monthly attendance for ${currentDisplayClassName}`}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Top Controls: Class (if multiple), Month, Year, Total Working Days */}
        <div
          className={`grid grid-cols-1 ${
            teacherClasses && teacherClasses.length > 1 && !isSadhr ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
          } gap-3 p-4 bg-[#FAF8F2] rounded-2xl border border-[#E3EAE6]`}
        >
          {/* Class Selector if teacher has multiple assigned classes */}
          {teacherClasses && teacherClasses.length > 1 && !isSadhr && (
            <div>
              <label className="block text-xs font-bold text-[#1F2933] mb-1">Assigned Class</label>
              <Select
                value={currentClassId}
                onChange={(e) => setCurrentClassId(e.target.value)}
              >
                {teacherClasses.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </Select>
            </div>
          )}

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
            {classStudents.length} Students Enrolled • Max working days: {totalWorkingDays}
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
              className="text-[#E11D48] hover:text-[#BE123C] font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>
        </div>

        {/* Students List Table / Cards */}
        {isLoadingStudents || isLoadingExisting ? (
          <div className="py-12 text-center text-sm text-[#667085]">
            <div className="animate-spin w-6 h-6 border-2 border-[#0F6B50] border-t-transparent rounded-full mx-auto mb-2" />
            Loading records for {currentDisplayClassName}...
          </div>
        ) : classStudents.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#667085] bg-[#FAF8F2] rounded-xl border border-[#E3EAE6]">
            No students found in {currentDisplayClassName}.
          </div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
            {classStudents.map((student, index) => {
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
