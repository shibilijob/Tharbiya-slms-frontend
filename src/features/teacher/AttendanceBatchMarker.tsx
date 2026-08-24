import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { AttendanceStatus } from '../../types';
import {
  CalendarCheck,
  Save,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Filter
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { api } from '../../lib/axios';

export const AttendanceBatchMarker: React.FC = () => {
  const { user } = useAuth();
  const { students, attendance, batchMarkAttendance } = useData();
  const { showToast } = useNotifications();

  const [selectedClass, setSelectedClass] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [dynamicClasses, setDynamicClasses] = useState<string[]>([]);

  React.useEffect(() => {
    api.get<any>('/faculty-members')
      .then(res => {
        const teachers = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (Array.isArray(teachers) && teachers.length > 0) {
          const matched = teachers.find((t: any) =>
            (user?.id && (t.id === user.id || t._id === user.id)) ||
            (user?.email && t.email === user.email) ||
            (user?.phone && t.phone === user.phone) ||
            (user?.name && t.name && (
              t.name.toLowerCase() === user.name.toLowerCase() ||
              t.name.toLowerCase().includes(user.name.toLowerCase()) ||
              user.name.toLowerCase().includes(t.name.toLowerCase())
            ))
          ) || teachers.find((t: any) => t.role === 'MUALLIM') || teachers[0];

          if (matched && Array.isArray(matched.assignedClasses) && matched.assignedClasses.length > 0) {
            const classes = matched.assignedClasses
              .map((c: any) => String(c).replace(/^Class\s*/i, '').trim())
              .filter(Boolean);
            if (classes.length > 0) {
              setDynamicClasses(classes);
            }
          }
        }
      })
      .catch(() => {});
  }, [user]);

  // Dynamic assigned classes for this Muallim
  const teacherUser = user as any;
  const teacherClasses = React.useMemo(() => {
    if (dynamicClasses.length > 0) return dynamicClasses;

    let rawList: any[] = [];
    if (Array.isArray(teacherUser?.assignedClasses)) {
      rawList = teacherUser.assignedClasses;
    } else if (typeof teacherUser?.assignedClasses === 'string') {
      try {
        const parsed = JSON.parse(teacherUser.assignedClasses);
        rawList = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        rawList = [teacherUser.assignedClasses];
      }
    } else if (teacherUser?.assignedClass) {
      rawList = Array.isArray(teacherUser.assignedClass) ? teacherUser.assignedClass : [teacherUser.assignedClass];
    }

    const cleaned = rawList
      .map((c: any) => String(c).replace(/^Class\s*/i, '').trim())
      .filter(Boolean);

    if (cleaned.length > 0) return cleaned;

    const fromStudents = students
      .filter(s => s.assignedTeacherId === user?.id || (user?.name && s.teacherName === user.name))
      .map(s => String(s.class).replace(/^Class\s*/i, '').trim());
    const unique = Array.from(new Set(fromStudents)).filter(Boolean);
    return unique.length > 0 ? unique : ['4'];
  }, [dynamicClasses, teacherUser, students, user]);

  // Filter students assigned to teacher's assigned classes
  const teacherStudents = students.filter(s => {
    const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
    return teacherClasses.includes(sClass) || (user?.id && s.assignedTeacherId === user.id);
  });

  // Filter based on selected class and search query
  const filteredStudents = teacherStudents.filter(s => {
    const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
    const fClass = selectedClass.replace(/^Class\s*/i, '').trim();
    const matchesClass = selectedClass === 'ALL' || sClass === fClass;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.malayalamName && s.malayalamName.includes(searchQuery));
    return matchesClass && matchesSearch;
  });

  const [attendanceState, setAttendanceState] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>(() => {
    const initial: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    teacherStudents.forEach(s => {
      const rec = attendance.find(a => a.studentId === s.id && a.date === selectedDate);
      initial[s.id] = {
        status: rec?.status || 'PRESENT',
        remarks: rec?.remarks || ''
      };
    });
    return initial;
  });

  // Sync attendance state when date, attendance records, or students change
  useEffect(() => {
    setAttendanceState(prev => {
      const nextState: Record<string, { status: AttendanceStatus; remarks: string }> = { ...prev };
      students.forEach(s => {
        const rec = attendance.find(a => a.studentId === s.id && a.date === selectedDate);
        nextState[s.id] = {
          status: rec?.status || nextState[s.id]?.status || 'PRESENT',
          remarks: rec?.remarks || nextState[s.id]?.remarks || ''
        };
      });
      return nextState;
    });
  }, [selectedDate, attendance, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarkChange = (studentId: string, remarks: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setAttendanceState(prev => {
      const updated = { ...prev };
      filteredStudents.forEach(s => {
        updated[s.id] = {
          status,
          remarks: updated[s.id]?.remarks || ''
        };
      });
      return updated;
    });
    showToast(`Marked ${filteredStudents.length} students as ${status}`);
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
      const targetStudents = filteredStudents.length > 0 ? filteredStudents : teacherStudents;
      const updates = targetStudents.map(s => ({
        studentId: s.id,
        date: selectedDate,
        status: attendanceState[s.id]?.status || 'PRESENT',
        remarks: attendanceState[s.id]?.remarks || undefined
      }));

      await batchMarkAttendance(updates, user?.id || 'teacher-1');
      const classLabel = selectedClass === 'ALL' ? teacherClasses.map(c => `Class ${c}`).join(' & ') : `Class ${selectedClass}`;
      showToast(`✓ Attendance register for ${classLabel} (${formatDate(selectedDate)}) saved successfully!`);
    } catch (e) {
      console.error("Failed to save attendance", e);
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = filteredStudents.filter(s => (attendanceState[s.id]?.status || 'PRESENT') === 'PRESENT').length;
  const absentCount = filteredStudents.filter(s => attendanceState[s.id]?.status === 'ABSENT').length;
  const lateCount = filteredStudents.filter(s => attendanceState[s.id]?.status === 'LATE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Daily Attendance Register
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Mark daily attendance for {selectedClass === 'ALL' ? teacherClasses.map(c => `Class ${c}`).join(' & ') : `Class ${selectedClass}`} students
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="md"
            variant="primary"
            onClick={handleSaveAttendance}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
            className="shadow-sm shadow-[#0F6B50]/20"
          >
            Save Register
          </Button>
        </div>
      </div>

      {/* Select Class & Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Date Selector */}
        <div className="sm:col-span-4">
          <Input
            label="Register Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Select Class Option */}
        <div className="sm:col-span-4">
          <Select
            label="Select Class"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="ALL">All Assigned Classes ({teacherClasses.map(c => `Class ${c}`).join(' & ')})</option>
            {teacherClasses.map(c => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </Select>
        </div>

        {/* Search Input */}
        <div className="sm:col-span-4">
          <Input
            label="Search Student"
            placeholder="Filter student list..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Quick Summary Chips & Batch Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E3EAE6] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Present: {presentCount}</span>
          </div>

          <div className="bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Absent: {absentCount}</span>
          </div>

          <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Late: {lateCount}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleMarkAll('PRESENT')}>
            Mark All Present (P)
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleMarkAll('ABSENT')}>
            Reset to Absent (A)
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-[#0F6B50]">
          <Badge variant="green" size="sm">
            {selectedClass === 'ALL' ? 'Classes 5 & 6' : `Class ${selectedClass}`}
          </Badge>
          <span className="text-[#667085]">({filteredStudents.length} Students)</span>
        </div>
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <Card className="p-10 text-center bg-white border border-[#E3EAE6]">
          <div className="w-12 h-12 rounded-2xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1F2933]">No Students Found</h3>
          <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No student matching "${searchQuery}" in ${selectedClass === 'ALL' ? 'assigned classes' : `Class ${selectedClass}`}.`
              : `No students enrolled in ${selectedClass === 'ALL' ? 'assigned classes' : `Class ${selectedClass}`}.`}
          </p>
        </Card>
      )}

      {/* Attendance List Cards */}
      {filteredStudents.length > 0 && (
        <div className="space-y-3">
          {filteredStudents.map(student => {
            const current = attendanceState[student.id] || { status: 'PRESENT', remarks: '' };

            return (
              <Card key={student.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#0F6B50] transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar name={student.name} gender={student.gender} size="md" />
                  <div>
                    <h4 className="text-sm font-bold text-[#1F2933]">{student.name}</h4>
                    <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">{student.malayalamName}</p>
                    <p className="text-[10px] text-[#667085]">Class {student.class} • Adm: {student.admissionNo}</p>
                  </div>
                </div>

                {/* Status Toggle & Note Input */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    type="text"
                    placeholder="Optional remark (e.g. sick leave)..."
                    value={current.remarks}
                    onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                    className="w-full sm:w-56 px-3 py-1.5 text-xs rounded-xl border border-[#E3EAE6] bg-[#FAF8F2] text-[#1F2933] focus:border-[#0F6B50] outline-none"
                  />

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'PRESENT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        current.status === 'PRESENT'
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                          : 'bg-[#FAF8F2] text-[#667085] hover:bg-emerald-50'
                      }`}
                    >
                      Present (P)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'LATE')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        current.status === 'LATE'
                          ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30'
                          : 'bg-[#FAF8F2] text-[#667085] hover:bg-amber-50'
                      }`}
                    >
                      Late (L)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'ABSENT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        current.status === 'ABSENT'
                          ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30'
                          : 'bg-[#FAF8F2] text-[#667085] hover:bg-rose-50'
                      }`}
                    >
                      Absent (A)
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

