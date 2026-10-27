import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ConfirmationDialog } from '../../components/feedback/ConfirmationDialog';
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
  Calendar,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { useClassStore } from '../../stores';
import { useAttendanceStore } from '../../stores/attendanceStore';
import { useSearchParams, Link } from 'react-router-dom';
import { classService, ClassAccessItem } from '../../services/classService';
import { api } from '../../lib/axios';
import { mapBackendStudentToFrontend } from '../../services/studentService';
import { MonthlyBacklogModal } from './MonthlyBacklogModal';

export const AttendanceBatchMarker: React.FC = () => {
  const { user } = useAuth();
  const { students, attendance, batchMarkAttendance } = useData();
  const { showToast } = useNotifications();
  const [searchParams] = useSearchParams();
  const selectedClassId = searchParams.get('classId') || '';
  const isSadhr = user?.role === 'SADHR_MUALLIM';
  const [selectedClassAccess, setSelectedClassAccess] = useState<ClassAccessItem | null>(null);
  const [classAccessLoaded, setClassAccessLoaded] = useState(false);
  const [selectedClassStudents, setSelectedClassStudents] = useState<typeof students>([]);
  const [rosterLoaded, setRosterLoaded] = useState(!isSadhr);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const attendanceError = useAttendanceStore((s) => s.error);

  const [selectedClass, setSelectedClass] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingHoliday, setIsApplyingHoliday] = useState(false);
  const [isHolidayConfirmationOpen, setIsHolidayConfirmationOpen] = useState(false);
  const [loadedAttendanceKey, setLoadedAttendanceKey] = useState('');
  const [selectedClassAttendance, setSelectedClassAttendance] = useState<typeof attendance>([]);
  const [holidayDraftKey, setHolidayDraftKey] = useState('');
  const [isBacklogModalOpen, setIsBacklogModalOpen] = useState(false);

  const studentAttendanceStats = useAttendanceStore((s) => s.studentAttendanceStats);
  const fetchClassAttendanceStats = useAttendanceStore((s) => s.fetchClassAttendanceStats);
  const updateOptimisticAttendanceStat = useAttendanceStore((s) => s.updateOptimisticAttendanceStat);
  const batchUpdateOptimisticAttendanceStats = useAttendanceStore((s) => s.batchUpdateOptimisticAttendanceStats);

  const teacherAssignedClasses = useClassStore((s) => s.teacherAssignedClasses);
  const fetchAssignedClassesForTeacher = useClassStore((s) => s.fetchAssignedClassesForTeacher);

  React.useEffect(() => {
    if (user) {
      fetchAssignedClassesForTeacher(user);
    }
  }, [user, fetchAssignedClassesForTeacher]);

  React.useEffect(() => {
    if (!isSadhr) return;
    let active = true;
    setClassAccessLoaded(false);
    setSelectedClassAccess(null);
    setSelectedClass('');
    classService.getClassAccessList().then((items) => {
      if (!active) return;
      setClassAccessLoaded(true);
      const chosen = items.find((item) => item.id === selectedClassId) || null;
      setSelectedClassAccess(chosen);
      setSelectedClass(chosen ? chosen.name.replace(/^Class\s*/i, '').trim() : '');
    }).catch((error) => { console.error('Unable to validate selected class:', error); if (active) setClassAccessLoaded(true); });
    return () => { active = false; };
  }, [isSadhr, selectedClassId]);

  React.useEffect(() => {
    if (!isSadhr || !selectedClassAccess) {
      setSelectedClassStudents([]);
      setRosterLoaded(!isSadhr);
      setRosterError(null);
      return;
    }
    let active = true;
    setSelectedClassStudents([]);
    setRosterLoaded(false);
    setRosterError(null);
    api.get(`/muallim/classes/${selectedClassAccess.id}/students`).then((response) => {
      if (!active) return;
      const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
      if (!Array.isArray(data)) throw new Error('The class roster response was not a student list');
      setSelectedClassStudents(data.map((student: any) => mapBackendStudentToFrontend(student)));
      setRosterLoaded(true);
    }).catch((error) => {
      console.error('Unable to load selected class roster:', error);
      if (active) {
        setSelectedClassStudents([]);
        setRosterError(error?.response?.data?.message || error?.message || 'Unable to load this class roster');
        setRosterLoaded(true);
      }
    });
    return () => { active = false; };
  }, [isSadhr, selectedClassAccess]);

  // Dynamic assigned classes for this Muallim
  const teacherUser = user as any;
  const teacherClasses = React.useMemo(() => {
    if (teacherAssignedClasses.length > 0) return teacherAssignedClasses;

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
  }, [teacherAssignedClasses, teacherUser, students, user]);

  // Filter students assigned to teacher's assigned classes
  const sourceStudents = isSadhr ? selectedClassStudents : students;
  const teacherStudents = React.useMemo(() => {
    const scopedClasses = isSadhr ? (selectedClassAccess ? [selectedClass] : []) : teacherClasses;
    return sourceStudents.filter(s => {
      const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
      return scopedClasses.includes(sClass) && (isSadhr || !user?.id || !s.assignedTeacherId || s.assignedTeacherId === user.id);
    });
  }, [sourceStudents, isSadhr, selectedClassAccess, selectedClass, teacherClasses, user?.id]);
  const registerKey = isSadhr && selectedClassAccess ? `${selectedClassAccess.id}:${selectedDate}` : '';
  const holidayClassKey = isSadhr
    ? selectedClassAccess?.id || ''
    : selectedClass !== 'ALL'
      ? selectedClass
      : teacherClasses.length === 1
        ? teacherClasses[0]
        : '';
  const holidayActionKey = holidayClassKey ? `${holidayClassKey}:${selectedDate}` : '';
  const canMarkClassHoliday = teacherStudents.length > 0 && Boolean(holidayActionKey);

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

  // Fetch confirmed attendance from MongoDB when date or class changes
  useEffect(() => {
    if (isSadhr && !selectedClassAccess) return;
    let active = true;
    const classParam = isSadhr ? selectedClassAccess?.id :
      selectedClass !== 'ALL'
        ? selectedClass
        : teacherClasses.length === 1
        ? teacherClasses[0]
        : undefined;
    const requestKey = isSadhr ? `${selectedClassAccess?.id}:${selectedDate}` : '';
    if (isSadhr) {
      setLoadedAttendanceKey('');
      setSelectedClassAttendance([]);
    }
    useAttendanceStore.getState().fetchByDateAndClass(selectedDate, classParam).then((records) => {
      if (!active || !isSadhr) return;
      setSelectedClassAttendance(records);
      setLoadedAttendanceKey(requestKey);
    });
    return () => { active = false; };
  }, [selectedDate, selectedClass, teacherClasses, isSadhr, selectedClassAccess]);

  // Fetch card badge statistics (Current Month, Prev Months, Total)
  useEffect(() => {
    if (isSadhr && !selectedClassAccess) return;
    const classesToFetch = isSadhr
      ? (selectedClassAccess?.id ? [selectedClassAccess.id] : [])
      : selectedClass !== 'ALL'
      ? [selectedClass]
      : teacherClasses;

    if (classesToFetch.length > 0) {
      classesToFetch.forEach((c) => {
        fetchClassAttendanceStats(c, selectedDate);
      });
    }
  }, [selectedDate, selectedClass, teacherClasses, isSadhr, selectedClassAccess, fetchClassAttendanceStats]);

  const [attendanceState, setAttendanceState] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});

  // Sync attendance state when date, attendance records, or students change
  useEffect(() => {
    setAttendanceState(prev => {
      const nextState: Record<string, { status: AttendanceStatus; remarks: string }> = { ...prev };
      const attendanceForRegister = isSadhr ? selectedClassAttendance : attendance;
      let changed = false;
      teacherStudents.forEach(s => {
        const rec = attendanceForRegister.find(a => a.studentId === s.id && a.date === selectedDate);
        const nextStudentState = {
          status: rec?.status || 'PRESENT',
          remarks: rec?.remarks || ''
        };
        const currentStudentState = prev[s.id];
        if (currentStudentState?.status !== nextStudentState.status || currentStudentState?.remarks !== nextStudentState.remarks) {
          nextState[s.id] = nextStudentState;
          changed = true;
        }
      });
      return changed ? nextState : prev;
    });
  }, [selectedDate, attendance, selectedClassAttendance, isSadhr, teacherStudents]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const oldStatus = attendanceState[studentId]?.status || 'PRESENT';
    if (oldStatus === status) return;

    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));

    // Option A: Responsively update badge counts in real time
    updateOptimisticAttendanceStat(studentId, oldStatus, status);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updates: Array<{ studentId: string; oldStatus: AttendanceStatus; newStatus: AttendanceStatus }> = [];

    setAttendanceState(prev => {
      const updated = { ...prev };
      filteredStudents.forEach(s => {
        const oldStatus = prev[s.id]?.status || 'PRESENT';
        if (oldStatus !== status) {
          updates.push({ studentId: s.id, oldStatus, newStatus: status });
        }
        updated[s.id] = {
          status,
          remarks: updated[s.id]?.remarks || ''
        };
      });
      return updated;
    });

    if (updates.length > 0) {
      batchUpdateOptimisticAttendanceStats(updates);
    }

    const label = status === 'PRESENT' ? 'Present' : status === 'LEAVE' ? 'Leave' : status === 'HOLIDAY' ? 'Holiday' : 'Absent';
    showToast(`Marked ${filteredStudents.length} students as ${label}`);
  };

  const openHolidayConfirmation = () => {
    if (isApplyingHoliday || isSaving || !canMarkClassHoliday) return;
    setIsHolidayConfirmationOpen(true);
  };

  const handleCloseHolidayConfirmation = () => {
    if (!isApplyingHoliday) setIsHolidayConfirmationOpen(false);
  };

  const handleConfirmMarkAllHoliday = async () => {
    if (isApplyingHoliday || isSaving || !canMarkClassHoliday) return;
    const classLabel = isSadhr
      ? selectedClassAccess?.name || `Class ${selectedClass}`
      : selectedClass === 'ALL'
        ? `Class ${teacherClasses[0]}`
        : `Class ${selectedClass}`;
    setIsApplyingHoliday(true);
    try {
      // Allow the disabled/loading state to render before updating the full roster.
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      const updates: Array<{ studentId: string; oldStatus: AttendanceStatus; newStatus: AttendanceStatus }> = [];
      setAttendanceState((prev) => {
        const updated = { ...prev };
        teacherStudents.forEach((student) => {
          const oldStatus = prev[student.id]?.status || 'PRESENT';
          if (oldStatus !== 'HOLIDAY') {
            updates.push({ studentId: student.id, oldStatus, newStatus: 'HOLIDAY' });
          }
          updated[student.id] = {
            status: 'HOLIDAY',
            remarks: updated[student.id]?.remarks || '',
          };
        });
        return updated;
      });
      if (updates.length > 0) {
        batchUpdateOptimisticAttendanceStats(updates);
      }
      setHolidayDraftKey(holidayActionKey);
      setIsHolidayConfirmationOpen(false);
      showToast(`Holiday marked for all ${teacherStudents.length} students in ${classLabel}. Save Register to persist.`);
    } catch (error: any) {
      console.error('Failed to mark class attendance as Holiday:', error);
      showToast(error?.message || 'Failed to mark students as Holiday');
    } finally {
      setIsApplyingHoliday(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const targetStudents = holidayDraftKey === holidayActionKey ? teacherStudents : filteredStudents;
      if (targetStudents.length === 0) {
        showToast('No students match the current class and search filters');
        return;
      }
      const updates = targetStudents.map(s => ({
        studentId: s.id,
        date: selectedDate,
        status: attendanceState[s.id]?.status || 'PRESENT',
        remarks: attendanceState[s.id]?.remarks || undefined
      }));

      const targetClassId = isSadhr ? selectedClassAccess?.id :
        selectedClass !== 'ALL'
          ? selectedClass
          : teacherClasses.length === 1
          ? teacherClasses[0]
          : undefined;

      if (!user?.id) {
        throw new Error('Authenticated Muallim ID is required to save attendance');
      }

      await batchMarkAttendance(updates, user.id, targetClassId);
      const savedRecords = await useAttendanceStore.getState().fetchByDateAndClass(selectedDate, targetClassId);
      if (isSadhr) {
        setSelectedClassAttendance(savedRecords);
        setLoadedAttendanceKey(registerKey);
      }

      // Option B: Post-save re-fetch of stats query for all active classes
      const classesToRefresh = isSadhr
        ? (selectedClassAccess?.id ? [selectedClassAccess.id] : [])
        : selectedClass !== 'ALL'
        ? [selectedClass]
        : teacherClasses;

      await Promise.all(
        classesToRefresh.map((clsId) => fetchClassAttendanceStats(clsId, selectedDate))
      );

      if (holidayDraftKey === holidayActionKey) setHolidayDraftKey('');
      const classLabel = selectedClass === 'ALL' ? teacherClasses.map(c => `Class ${c}`).join(' & ') : `Class ${selectedClass}`;
      showToast(`✓ Attendance register for ${classLabel} (${formatDate(selectedDate)}) saved successfully!`);
    } catch (e: any) {
      console.error("Failed to save attendance", e);
      const msg = e.response?.data?.message || e.message || "Failed to save attendance to server";
      showToast(`✕ ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const backlogClassId = isSadhr
    ? selectedClassAccess?.id || ''
    : selectedClass !== 'ALL'
    ? selectedClass
    : teacherClasses[0] || '';

  const backlogClassName = isSadhr
    ? selectedClassAccess?.name || `Class ${selectedClass}`
    : selectedClass !== 'ALL'
    ? `Class ${selectedClass}`
    : `Class ${teacherClasses[0] || ''}`;

  if (isSadhr && !selectedClassId) return <Card className="p-8 text-center"><h1 className="text-xl font-extrabold text-[#1F2933]">Choose a class</h1><p className="mt-2 text-sm text-[#667085]">Open the attendance register from a selected class dashboard.</p><Link to="/admin/classes" className="mt-4 inline-flex text-sm font-bold text-[#0F6B50]">Go to Class Management</Link></Card>;
  if (isSadhr && selectedClassId && !classAccessLoaded) return <Card className="p-8 text-center">Loading selected class attendance…</Card>;
  if (isSadhr && selectedClassId && classAccessLoaded && !selectedClassAccess) return <Card className="p-8 text-center"><h1 className="text-xl font-extrabold text-[#1F2933]">Class unavailable</h1><Link to="/admin/classes" className="mt-4 inline-flex text-sm font-bold text-[#0F6B50]">Back to Class Management</Link></Card>;

  if (isSadhr && selectedClassAccess && !rosterLoaded) return <Card className="p-8 text-center">Loading students for {selectedClassAccess.name}...</Card>;
  if (isSadhr && rosterError) return <Card className="p-8 text-center"><h1 className="text-xl font-extrabold text-[#1F2933]">Unable to load class students</h1><p className="mt-2 text-sm text-rose-700">{rosterError}</p><Link to="/admin/classes" className="mt-4 inline-flex text-sm font-bold text-[#0F6B50]">Back to Class Management</Link></Card>;
  if (isSadhr && registerKey !== loadedAttendanceKey) return <Card className="p-8 text-center">Loading selected class attendance...</Card>;
  if (attendanceError) return <Card className="p-8 text-center"><h1 className="text-xl font-extrabold text-[#1F2933]">Unable to load attendance</h1><p className="mt-2 text-sm text-rose-700">{attendanceError}</p><Button className="mt-4" onClick={() => {
    const classParam = isSadhr ? selectedClassAccess?.id : selectedClass !== 'ALL' ? selectedClass : teacherClasses.length === 1 ? teacherClasses[0] : undefined;
    setLoadedAttendanceKey('');
    useAttendanceStore.getState().fetchByDateAndClass(selectedDate, classParam).then((records) => {
      if (isSadhr) {
        setSelectedClassAttendance(records);
        setLoadedAttendanceKey(registerKey);
      }
    });
  }}>Retry</Button></Card>;

  const presentCount = filteredStudents.filter(s => (attendanceState[s.id]?.status || 'PRESENT') === 'PRESENT').length;
  const absentCount = filteredStudents.filter(s => attendanceState[s.id]?.status === 'ABSENT').length;
  const leaveCount = filteredStudents.filter(s => attendanceState[s.id]?.status === 'LEAVE').length;

  console.log("Student Stats in Store:", studentAttendanceStats);

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

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsBacklogModalOpen(true)}
            leftIcon={<Calendar className="w-4 h-4 text-[#0F6B50]" />}
            className="shadow-xs bg-[#FAF8F2] hover:bg-[#DDEDE5]/50 border-[#E3EAE6] text-[#0F6B50] font-bold"
          >
            Monthly Backlog
          </Button>
        </div>
      </div>

      {/* Select Class & Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Date Selector */}
        <div className={isSadhr ? 'sm:col-span-6' : 'sm:col-span-4'}>
          <Input
            label="Register Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Select Class Option */}
        {!isSadhr && <div className="sm:col-span-4">
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
        </div>}

        {/* Search Input */}
        <div className={isSadhr ? 'sm:col-span-6' : 'sm:col-span-4'}>
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

          <div className="bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Leave: {leaveCount}</span>
          </div>

          <div className="bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Absent: {absentCount}</span>
          </div>

        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleMarkAll('PRESENT')}>
            Mark All Present
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleMarkAll('ABSENT')}>
            Reset to Absent
          </Button>
          <Button
            size="sm"
            variant="gold"
            onClick={openHolidayConfirmation}
            disabled={!canMarkClassHoliday || isApplyingHoliday || isSaving}
            isLoading={isApplyingHoliday}
          >
            Mark as Holiday
          </Button>
        </div>
        {selectedClass === 'ALL' && !isSadhr && teacherClasses.length > 1 && (
          <p className="text-xs text-[#667085]">Select one class to mark every student as Holiday.</p>
        )}

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
            const studentKey = String(student.id || (student as any)._id || '');
            const cardStat =
              studentAttendanceStats[studentKey] ||
              (student.id ? studentAttendanceStats[student.id] : undefined) ||
              ((student as any)._id ? studentAttendanceStats[(student as any)._id] : undefined);

            return (
              <Card key={student.id} className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:border-[#0F6B50] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={student.name} gender={student.gender} size="md" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-[#1F2933] uppercase tracking-wide truncate">
                        {student.name}
                      </h4>
                      {student.malayalamName && (
                        <p className="font-malayalam text-xs text-[#0F6B50] font-semibold truncate">
                          {student.malayalamName}
                        </p>
                      )}
                      <p className="text-[10px] text-[#667085] truncate">
                        Class {student.class} • Adm: {student.admissionNo}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Attendance Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {/* CURRENT MONTH */}
                    <div className="px-2.5 py-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                      <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">Current Month:</span>
                      <span className="font-extrabold text-emerald-950">{cardStat?.currentMonth || '0/0'}</span>
                    </div>

                    {/* PREV MONTHS */}
                    <div className="px-2.5 py-3 rounded-xl bg-blue-50 text-blue-900 border border-blue-200/70 text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                      <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wide">Prev Months:</span>
                      <span className="font-extrabold text-blue-950">{cardStat?.prevMonths || '0/0'}</span>
                    </div>

                    {/* TOTAL ATTENDANCE */}
                    <div className="px-2.5 py-3 rounded-xl bg-gray-100 text-slate-700 border border-slate-200/70 text-[11px] font-bold flex items-center gap-1 shadow-2xs">
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wide">Total:</span>
                      <span className="font-extrabold text-slate-900">{cardStat?.totalAttendance || '0/0'}</span>
                    </div>
                  </div>
                </div>

                {/* Status Toggle & Note Input */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'PRESENT')}
                      className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                        current.status === 'PRESENT' || !current.status
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                          : 'bg-[#FAF8F2] text-[#667085] hover:bg-emerald-50'
                      }`}
                    >
                      Present
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'ABSENT')}
                      className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                        current.status === 'ABSENT'
                          ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30'
                          : 'bg-[#FAF8F2] text-[#667085] hover:bg-rose-50'
                      }`}
                    >
                      Absent
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'LEAVE')}
                      className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                        current.status === 'LEAVE'
                          ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30'
                          : 'bg-[#FAF8F2] text-[#667085] hover:bg-amber-50'
                      }`}
                    >
                      Leave
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'HOLIDAY')}
                      className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                        current.status === 'HOLIDAY'
                          ? 'bg-slate-600 text-white shadow-sm ring-2 ring-slate-600/30'
                          : 'bg-[#FAF8F2] text-[#667085] hover:bg-slate-100'
                      }`}
                    >
                      Holiday
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
          <div className="flex justify-end pt-2">
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
      )}
      <ConfirmationDialog
        isOpen={isHolidayConfirmationOpen}
        onClose={handleCloseHolidayConfirmation}
        onConfirm={handleConfirmMarkAllHoliday}
        title="Mark All as Holiday?"
        message="This will mark every student in the selected class as Holiday for the selected date. Do you want to continue?"
        cancelText="Cancel"
        confirmText="Confirm"
        isLoading={isApplyingHoliday}
      />
      <MonthlyBacklogModal
        isOpen={isBacklogModalOpen}
        onClose={() => setIsBacklogModalOpen(false)}
        classId={backlogClassId}
        className={backlogClassName}
        students={teacherStudents}
        onSaved={() => {
          const classesToRefresh = isSadhr
            ? (selectedClassAccess?.id ? [selectedClassAccess.id] : [])
            : selectedClass !== 'ALL'
            ? [selectedClass]
            : teacherClasses;

          classesToRefresh.forEach((clsId) => {
            fetchClassAttendanceStats(clsId, selectedDate);
          });
        }}
      />
    </div>
  );
};
