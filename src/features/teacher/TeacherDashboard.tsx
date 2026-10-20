import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { StatCard } from '../../components/common/StatCard';
import { UpdateTimetableModal } from './UpdateTimetableModal';
import { UpdateSubjectsModal } from './UpdateSubjectsModal';
import { UpdatePracticalScoreModal } from './UpdatePracticalScoreModal';
import { muallimService } from '../../services/muallimService';
import { timetableService } from '../../services/timetableService';
import { subjectService } from '../../services/subjectService';
import { classService, ClassAccessItem } from '../../services/classService';
import { mapBackendStudentToFrontend } from '../../services/studentService';
import { TimetablePeriod, MadrasaDay, Student } from '../../types';
import {
  Users,
  CalendarCheck,
  Award,
  BookOpen,
  GraduationCap,
  ArrowRight,
  CalendarDays,
  BookOpenCheck,
  HeartHandshake
} from 'lucide-react';

const EMPTY_CLASSES: string[] = [];
const normalizeAttendanceRows = (response: any) => {
  const rows = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
  return rows.map((record: any) => ({
    ...record,
    studentId: String(record.studentId?._id || record.studentId?.id || record.studentId || ''),
    date: typeof record.date === 'string' ? record.date.split('T')[0] : new Date(record.date).toISOString().split('T')[0],
  }));
};

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { markAttendance, batchMarkAttendance } = useData();

  const [searchParams, setSearchParams] = useSearchParams();
  const queryClass = searchParams.get('class') || searchParams.get('classId');
  const cleanQueryClass = useMemo(() => {
    return queryClass ? String(queryClass).replace(/^Class\s*/i, '').trim() : null;
  }, [queryClass]);

  const [dashboardClass, setDashboardClass] = useState('');
  const [classAccessList, setClassAccessList] = useState<ClassAccessItem[]>([]);
  const [classAccessLoaded, setClassAccessLoaded] = useState(false);
  const [classAccessError, setClassAccessError] = useState<string | null>(null);
  const [classAccessUserId, setClassAccessUserId] = useState<string | null>(null);
  const [authorizedClasses, setAuthorizedClasses] = useState<string[]>([]);
  const [scheduleClass, setScheduleClass] = useState('');
  const [subjectsClass, setSubjectsClass] = useState('');
  const [dashboardSchedule, setDashboardSchedule] = useState<Record<MadrasaDay, TimetablePeriod[]>>({
    Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [],
  });
  const [dashboardSubjects, setDashboardSubjects] = useState<any[]>([]);
  const [selectedDashboardDay, setSelectedDashboardDay] = useState<MadrasaDay>('Sunday');
  const [awardsGivenCount, setAwardsGivenCount] = useState<number | null>(null);
  const [dashboardAttendance, setDashboardAttendance] = useState<any[]>([]);
  const [dashboardStudents, setDashboardStudents] = useState<Student[]>([]);
  const [loadedRosterKey, setLoadedRosterKey] = useState('');
  const [loadedAttendanceKey, setLoadedAttendanceKey] = useState('');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loadedStatsKey, setLoadedStatsKey] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];

  // Modal states for Timetable, Subjects & Practical Score
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
  const [isPracticalScoreModalOpen, setIsPracticalScoreModalOpen] = useState(false);

  // The backend derives this list from the authenticated user's database assignments.
  const teacherClasses = useMemo(
    () => user?.id && classAccessUserId === user.id ? authorizedClasses : EMPTY_CLASSES,
    [authorizedClasses, classAccessUserId, user?.id]
  );
  const isSadhr = user?.role === 'SADHR_MUALLIM';
  const isSadhrOrAdmin = user?.role === 'SADHR_MUALLIM' || (user as any)?.role === 'ADMIN';
  const requestedClassId = searchParams.get('classId');
  const selectedClassItem = requestedClassId ? classAccessList.find((item) => item.id === requestedClassId) : undefined;

  useEffect(() => {
    let cancelled = false;
    setAuthorizedClasses([]);
    setClassAccessList([]);
    setClassAccessLoaded(false);
    setClassAccessError(null);
    setClassAccessUserId(null);
    setDashboardClass('');
    setDashboardStudents([]);
    if (!user) return;
    classService.getClassAccessList().then((classes) => {
      if (!cancelled) {
        setClassAccessList(classes);
        setAuthorizedClasses(classes.map((item) => item.name.replace(/^Class\s*/i, '').trim()));
        setClassAccessLoaded(true);
        setClassAccessUserId(user.id);
      }
    }).catch((error: any) => {
      if (!cancelled) { setClassAccessError(error?.response?.data?.message || 'Could not load classes. Please retry.'); setClassAccessLoaded(true); }
    });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (isSadhr) {
      setDashboardClass(selectedClassItem?.name.replace(/^Class\s*/i, '').trim() || '');
    } else if (teacherClasses.length === 0) {
      setDashboardClass('');
    } else if (!teacherClasses.includes(dashboardClass)) {
      const byId = requestedClassId ? classAccessList.find((item) => item.id === requestedClassId) : undefined;
      setDashboardClass(byId ? byId.name.replace(/^Class\s*/i, '').trim() : (cleanQueryClass && teacherClasses.includes(cleanQueryClass) ? cleanQueryClass : teacherClasses[0]));
    }
  }, [teacherClasses, dashboardClass, cleanQueryClass, classAccessList, requestedClassId, isSadhr, selectedClassItem]);

  const dashboardClassId = classAccessList.find((item) => item.name.replace(/^Class\s*/i, '').trim() === dashboardClass)?.id || dashboardClass;
  const selectedClassContextId = isSadhr ? (selectedClassItem?.id || '') : dashboardClassId;
  const requestedClassUnavailable = Boolean(requestedClassId && classAccessLoaded && !classAccessList.some((item) => item.id === requestedClassId));
  const missingSadhrClassContext = isSadhr && !requestedClassId;
  const dashboardClasses = useMemo(() => isSadhr ? (selectedClassItem && dashboardClass ? [dashboardClass] : EMPTY_CLASSES) : teacherClasses, [isSadhr, selectedClassItem, dashboardClass, teacherClasses]);
  const rosterKey = isSadhr ? selectedClassContextId : teacherClasses.map((name) => classAccessList.find((item) => item.name.replace(/^Class\s*/i, '').trim() === name)?.id || name).join(',');
  const attendanceKey = selectedClassContextId ? `${selectedClassContextId}:${todayStr}` : '';

  useEffect(() => {
    let cancelled = false;
    setDashboardStudents([]);
    setLoadedRosterKey('');
    const rosterClasses = isSadhr ? (selectedClassItem && dashboardClass ? [dashboardClass] : []) : teacherClasses;
    if (rosterClasses.length === 0) return;

    Promise.all(rosterClasses.map((className) => muallimService.getClassRoster(classAccessList.find((item) => item.name.replace(/^Class\s*/i, '').trim() === className)?.id || className)))
      .then((responses) => {
        if (cancelled) return;
        const mapped = responses.flatMap((response: any, index) => {
          const rows = Array.isArray(response) ? response : (response?.data || []);
          return Array.isArray(rows)
            ? rows.map((student: any) => mapBackendStudentToFrontend(student, rosterClasses[index]))
            : [];
        });
        setDashboardStudents(Array.from(new Map(mapped.map((student) => [student.id, student])).values()));
        setLoadedRosterKey(rosterKey);
      })
      .catch((error) => {
        console.error('Failed to load assigned class students:', error);
        if (!cancelled) setDashboardStudents([]);
      });

    return () => { cancelled = true; };
  }, [teacherClasses, classAccessList, user?.id, isSadhr, selectedClassItem, dashboardClass, rosterKey]);

  useEffect(() => {
    if (!dashboardClass || !dashboardClasses.includes(dashboardClass)) return;
    let cancelled = false;
    setScheduleClass('');
    setSubjectsClass('');
    setDashboardSchedule({ Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] });
    setDashboardSubjects([]);
    Promise.all([
      timetableService.fetchClassScheduleFromApi(selectedClassContextId),
      subjectService.fetchFromApi(selectedClassContextId),
    ]).then(([schedule, classSubjects]) => {
      if (!cancelled) {
        setDashboardSchedule(schedule);
        setDashboardSubjects(classSubjects);
        setScheduleClass(dashboardClass);
        setSubjectsClass(dashboardClass);
      }
    }).catch((error) => console.error('Failed to load assigned class dashboard data:', error));
    return () => { cancelled = true; };
  }, [dashboardClass, selectedClassContextId, dashboardClasses]);

  useEffect(() => {
    let isMounted = true;

    const loadAwardsGivenCount = async () => {
      setAwardsGivenCount(null);
      if (!user?.id) {
        setAwardsGivenCount(null);
        return;
      }

      try {
        if (isSadhr && !selectedClassContextId) return;
        setLoadedStatsKey('');
        const response = await muallimService.getDashboard(isSadhr ? selectedClassContextId : undefined);
        const stats = response?.data || response;
        if (isMounted) {
          setDashboardStats(stats);
          setAwardsGivenCount(
            typeof stats?.awardsGivenCount === 'number' ? stats.awardsGivenCount : null
          );
          setLoadedStatsKey(isSadhr ? selectedClassContextId : user.id);
        }
      } catch (err) {
        console.error('Failed to load Muallim award badge count:', err);
        if (isMounted) {
          setAwardsGivenCount(null);
        }
      }
    };

    loadAwardsGivenCount();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isSadhr, selectedClassContextId]);

  useEffect(() => {
    let isMounted = true;
    setDashboardAttendance([]);
    setLoadedAttendanceKey('');
    if (!selectedClassContextId || !dashboardClass) return () => { isMounted = false; };
    muallimService.getClassAttendance(selectedClassContextId, todayStr).then((response: any) => {
      if (isMounted) {
        setDashboardAttendance(normalizeAttendanceRows(response));
        setLoadedAttendanceKey(attendanceKey);
      }
    }).catch((error) => {
      console.error('Failed to load selected class attendance:', error);
      if (isMounted) setDashboardAttendance([]);
    });
    return () => { isMounted = false; };
  }, [selectedClassContextId, dashboardClass, todayStr, attendanceKey]);

  const todaySchedule = scheduleClass === dashboardClass ? (dashboardSchedule[selectedDashboardDay] || []) : [];
  const activeSubjectsCount = subjectsClass === dashboardClass ? dashboardSubjects.length : 0;

  const refreshDashboardClass = async () => {
    const [schedule, classSubjects] = await Promise.all([
      timetableService.fetchClassScheduleFromApi(dashboardClassId),
      subjectService.fetchFromApi(dashboardClassId),
    ]);
    setDashboardSchedule(schedule);
    setDashboardSubjects(classSubjects);
    setScheduleClass(dashboardClass);
    setSubjectsClass(dashboardClass);
  };

  // Accumulate and preserve assigned students across all assigned classes
  // Keep the dashboard's student set derived from the current authorized classes;
  // do not accumulate rows across accounts or prior assignment changes.
  const teacherStudents = useMemo(() => {
    if (loadedRosterKey !== rosterKey) return [];
    return dashboardStudents.filter(s => {
      const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
      return dashboardClasses.includes(sClass);
    });
  }, [dashboardStudents, dashboardClasses, loadedRosterKey, rosterKey]);

  // Students for the currently selected class tab (for today's register table)
  const classStudents = useMemo(() => {
    return teacherStudents.filter(s => {
      const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
      return sClass === dashboardClass;
    });
  }, [teacherStudents, dashboardClass]);

  const todayAttendance = loadedAttendanceKey === attendanceKey ? dashboardAttendance : [];

  const [markingSuccess, setMarkingSuccess] = useState(false);

  // Dynamic Statistics based ONLY on this teacher's assigned students (Real Data)
  const totalStudentsCount = loadedStatsKey === (isSadhr ? selectedClassContextId : user?.id) && typeof dashboardStats?.totalAssignedStudents === 'number'
    ? dashboardStats.totalAssignedStudents
    : classStudents.length;
  const presentTodayCount = todayAttendance.filter(a =>
    a.status === 'PRESENT' && classStudents.some(s => s.id === a.studentId)
  ).length;

  // Quick mark all present for today
  const handleMarkAllPresent = async () => {
    const targetStudents = isSadhr ? classStudents : (classStudents.length > 0 ? classStudents : teacherStudents);
    const updates = targetStudents.map(s => ({
      studentId: s.id,
      date: todayStr,
      status: 'PRESENT' as const
    }));
    const targetClassId = selectedClassContextId;
    if (!user?.id || !targetClassId) return;
    await batchMarkAttendance(updates, user.id, targetClassId);
    const refreshed = await muallimService.getClassAttendance(targetClassId, todayStr);
    setDashboardAttendance(normalizeAttendanceRows(refreshed));
    setLoadedAttendanceKey(attendanceKey);
    setMarkingSuccess(true);
    setTimeout(() => setMarkingSuccess(false), 3000);
  };

  const handleStudentAttendance = async (student: Student, status: 'PRESENT' | 'LEAVE' | 'ABSENT' | 'HOLIDAY') => {
    if (!user?.id || !selectedClassContextId || !classStudents.some((row) => row.id === student.id)) return;
    await markAttendance(student.id, todayStr, status, user.id, undefined, selectedClassContextId);
    const refreshed = await muallimService.getClassAttendance(selectedClassContextId, todayStr);
    setDashboardAttendance(normalizeAttendanceRows(refreshed));
    setLoadedAttendanceKey(attendanceKey);
  };

  if (!classAccessLoaded) {
    return <Card className="p-8 text-center"><div className="w-8 h-8 border-3 border-[#DDEDE5] border-t-[#0F6B50] rounded-full animate-spin mx-auto mb-3" /><p className="text-sm text-[#667085]">Loading your class access…</p></Card>;
  }

  if (classAccessError) {
    return <Card className="p-8 text-center"><h1 className="text-xl font-extrabold text-[#1F2933]">Could not load classes</h1><p className="mt-2 text-sm text-[#667085]">{classAccessError}</p><Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button></Card>;
  }

  if (teacherClasses.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <h1 className="text-xl font-extrabold text-[#1F2933]">{user?.role === 'SADHR_MUALLIM' ? 'No active classes available' : 'No classes assigned'}</h1>
          <p className="mt-2 text-sm text-[#667085]">
            {user?.role === 'SADHR_MUALLIM' ? 'Class Management will show classes when active classes are available.' : 'Your Muallim workspace will show class information after the administration assigns one or more classes to your account.'}
          </p>
          {isSadhrOrAdmin && (
            <Link to="/admin/classes" className="mt-4 inline-flex text-sm font-bold text-[#0F6B50]">
              Back to Class Management
            </Link>
          )}
        </Card>
      </div>
    );
  }

  if (requestedClassUnavailable) {
    return <Card className="p-8 text-center"><h1 className="text-xl font-extrabold text-[#1F2933]">Class unavailable</h1><p className="mt-2 text-sm text-[#667085]">This class is inactive or you are not authorized to open it.</p><Link to={user?.role === 'SADHR_MUALLIM' ? '/admin/classes' : '/teacher/dashboard'} className="mt-4 inline-flex text-sm font-bold text-[#0F6B50]">Back to Class Management</Link></Card>;
  }

  if (missingSadhrClassContext) {
    return <Card className="p-8 text-center"><h1 className="text-xl font-extrabold text-[#1F2933]">Choose a class</h1><p className="mt-2 text-sm text-[#667085]">Open a class from Class Management to view its dashboard.</p><Link to="/admin/classes" className="mt-4 inline-flex text-sm font-bold text-[#0F6B50]">Go to Class Management</Link></Card>;
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP TEACHER HERO BANNER */}
      <div className="bg-gradient-to-br from-[#0F6B50] via-[#0c5641] to-[#084C3A] rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-[#0F6B50]/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A227] bg-white/10 px-3 py-1 rounded-full inline-block">
              Muallim Classroom Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Assalamu Alaikum, {user?.name || "Usthad"}
            </h1>
            <p className="font-malayalam text-xs sm:text-sm text-[#DDEDE5] font-semibold">
              Class {dashboardClass} Workspace • Darunnajath Mundambra
            </p>
            <p className="text-xs text-[#DDEDE5]/80">
              <>{isSadhr ? 'Selected Class' : 'Assigned Classes'}: <strong className="text-white">{isSadhr ? `Class ${dashboardClass}` : teacherClasses.map(c => `Class ${c}`).join(', ')}</strong></>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isSadhrOrAdmin && (
              <Link
                to="/admin/classes"
                className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs flex items-center gap-2 border border-white/20 transition-all shadow-xs"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Class Management
              </Link>
            )}
            <button
              onClick={() => setIsPracticalScoreModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white text-[#0F6B50] hover:bg-[#DDEDE5] font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <HeartHandshake className="w-4 h-4 text-[#0F6B50]" />
              Update Practical Score
            </button>
            <button
              onClick={() => setIsTimetableModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-[#DDEDE5] text-[#084C3A] hover:bg-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <CalendarDays className="w-4 h-4 text-[#0F6B50]" />
              Class Routine
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Students"
          value={isSadhr ? classStudents.length : totalStudentsCount}
          sublabel={
              `${isSadhr ? 'Selected class' : 'Assigned in'} ${dashboardClasses.map(c => `Class ${c}`).join(' & ') || 'no classes'}`
          }
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Present Today"
          value={presentTodayCount}
          sublabel="Daily Attendance"
          icon={<CalendarCheck className="w-5 h-5" />}
          trend={{ value: "Active", positive: true }}
        />
        <StatCard
          label="Excellent Progress"
          value={awardsGivenCount ?? '—'}
          sublabel="Award badges given"
          icon={<Award className="w-5 h-5" />}
          variant="gold"
        />
      </div>

      {/* 3. TODAY'S ATTENDANCE QUICK ACTION CARD */}
      <Card className="p-5 sm:p-6 bg-white border border-[#E3EAE6]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3EAE6]">
          <div>
            <h3 className="text-base font-bold text-[#1F2933] flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#0F6B50]" />
              Class {dashboardClass} Attendance Register (Today)
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Quickly record or toggle attendance for Class {dashboardClass} students
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Show tabs only for assigned classes */}
            {!isSadhr && teacherClasses.length > 1 ? (
              <div className="flex bg-[#FAF8F2] border border-[#E3EAE6] p-1 rounded-xl max-w-full overflow-x-auto">
                {teacherClasses.map(cls => (
                  <button
                    key={cls}
                    onClick={() => {
                      setDashboardClass(cls);
                      const selected = classAccessList.find((item) => item.name.replace(/^Class\s*/i, '').trim() === cls);
                      setSearchParams(selected ? { classId: selected.id } : { class: cls });
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all shrink-0 ${dashboardClass === cls ? 'bg-[#0F6B50] text-white shadow-xs' : 'text-[#667085] hover:text-[#1F2933]'
                      }`}
                  >
                    Class {cls}
                  </button>
                ))}
              </div>
            ) : (
              <span className="px-3 py-1 bg-[#DDEDE5] text-[#084C3A] text-xs font-extrabold rounded-xl border border-[#0F6B50]/20">
                Class {dashboardClass}
              </span>
            )}

            <Button
              size="sm"
              variant="secondary"
              onClick={handleMarkAllPresent}
            >
              {markingSuccess ? "✓ Marked All Present!" : "One-Tap: Mark All Present"}
            </Button>
            <Link to={`/teacher/attendance${isSadhr ? `?classId=${encodeURIComponent(selectedClassContextId)}` : ''}`}>
              <Button size="sm" variant="outline">
                Full Register
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Student Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4">
          {classStudents.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-[#667085]">
              No students enrolled in Class {dashboardClass} yet.
            </div>
          ) : (
            classStudents.slice(0, 6).map(student => {
              const record = todayAttendance.find(a => a.studentId === student.id);
              const status = record?.status;

              return (
                <div
                  key={student.id}
                  className="p-3 rounded-xl bg-[#FAF8F2] border border-[#E3EAE6] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar name={student.name} gender={student.gender} size="sm" />
                    <div>
                      <p className="text-xs font-bold text-[#1F2933] truncate">{student.name}</p>
                      <p className="text-[10px] text-[#667085]">Adm: {student.admissionNo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => void handleStudentAttendance(student, 'PRESENT')}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${status === 'PRESENT'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-[#667085] hover:bg-emerald-100'
                        }`}
                      title="Present"
                    >
                      P
                    </button>
                    <button
                      onClick={() => void handleStudentAttendance(student, 'LEAVE')}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${status === 'LEAVE'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white text-[#667085] hover:bg-amber-100'
                        }`}
                      title="Leave"
                    >
                      L
                    </button>
                    <button
                      onClick={() => void handleStudentAttendance(student, 'ABSENT')}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${status === 'ABSENT'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-[#667085] hover:bg-rose-100'
                        }`}
                      title="Absent"
                    >
                      A
                    </button>
                    <button
                      onClick={() => void handleStudentAttendance(student, 'HOLIDAY')}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${status === 'HOLIDAY'
                        ? 'bg-slate-600 text-white shadow-xs'
                        : 'bg-white text-[#667085] hover:bg-slate-100'
                        }`}
                      title="Holiday"
                    >
                      H
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* 4. TODAY'S TIMETABLE & DARS SCHEDULE WIDGET */}
      <Card className="p-5 sm:p-6 bg-white border border-[#E3EAE6]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3EAE6]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#DDEDE5] text-[#0F6B50]">
                <CalendarDays className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-[#1F2933]">
                Class {dashboardClass} Routine & Periods
              </h3>
            </div>
            <p className="text-xs text-[#667085] mt-0.5">
              {selectedDashboardDay} Dars Timetable • {todaySchedule.length} Scheduled Periods
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsTimetableModalOpen(true)}
              leftIcon={<CalendarDays className="w-4 h-4" />}
            >
              Update Time Table
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSubjectsModalOpen(true)}
              leftIcon={<BookOpenCheck className="w-4 h-4" />}
            >
              Update Subjects
            </Button>
          </div>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 pb-1">
          {(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as MadrasaDay[]).map(day => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDashboardDay(day)}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${selectedDashboardDay === day
                ? 'bg-[#0F6B50] text-white shadow-xs'
                : 'bg-[#FAF8F2] text-[#667085] hover:bg-[#DDEDE5]/50 border border-[#E3EAE6]'
                }`}
            >
              {day} {day === 'Friday' ? '🕌' : ''}
            </button>
          ))}
        </div>

        {/* Periods Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          {todaySchedule.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-[#667085]">
              No timetable periods scheduled for Class {dashboardClass} on {selectedDashboardDay}.
            </div>
          ) : (
            todaySchedule.map(period => (
              <div
                key={period.id}
                className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E3EAE6] hover:border-[#0F6B50] transition-all flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-[#DDEDE5] text-[#084C3A] flex flex-col items-center justify-center font-black shrink-0">
                  <span className="text-[8px] uppercase leading-none text-[#0F6B50]">P</span>
                  <span className="text-xs leading-none mt-0.5">{period.periodNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-extrabold text-[#1F2933] truncate">{period.subject}</h4>
                    <span className="text-[10px] font-bold text-[#0F6B50] bg-white px-2 py-0.5 rounded-md border border-[#E3EAE6] shrink-0">
                      {period.startTime}
                    </span>
                  </div>
                  <p className="font-malayalam text-[11px] text-[#0F6B50] font-semibold truncate">{period.subjectMalayalam}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[#667085]">
                    <span className="truncate">{period.teacherName}</span>
                    <span>•</span>
                    <span className="shrink-0">{period.room}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 5. MUALLIM WORKSPACE QUICK ACTIONS */}
      <Card className="p-5 sm:p-6 bg-white border border-[#E3EAE6]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E3EAE6]">
          <div>
            <h3 className="text-base font-bold text-[#1F2933]">
              Muallim Quick Actions & Tools
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Access classroom evaluations, routine updates, marksheet entry, and student records
            </p>
          </div>
          <Badge variant="gold" size="sm">
            {activeSubjectsCount} Subjects
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Button: Update Practical Score */}
          <button
            onClick={() => setIsPracticalScoreModalOpen(true)}
            className="p-4 rounded-2xl bg-[#FAF8F2] hover:bg-[#DDEDE5]/50 border border-[#E3EAE6] hover:border-[#0F6B50] transition-all text-left group"
          >
            <HeartHandshake className="w-6 h-6 text-[#0F6B50] mb-2 group-hover:scale-105 transition-transform" />
            <p className="text-xs font-bold text-[#1F2933] group-hover:text-[#0F6B50] transition-colors">
              Update Practical Score
            </p>
            <p className="text-[10px] text-[#667085] mt-0.5">Adab, Salah & Akhlaq scores</p>
          </button>

          {/* Button: Update Time Table */}
          <button
            onClick={() => setIsTimetableModalOpen(true)}
            className="p-4 rounded-2xl bg-[#FAF8F2] hover:bg-[#DDEDE5]/50 border border-[#E3EAE6] hover:border-[#0F6B50] transition-all text-left group"
          >
            <CalendarDays className="w-6 h-6 text-[#0F6B50] mb-2 group-hover:scale-105 transition-transform" />
            <p className="text-xs font-bold text-[#1F2933] group-hover:text-[#0F6B50] transition-colors">
              Update Time Table
            </p>
            <p className="text-[10px] text-[#667085] mt-0.5">Class periods & daily routines</p>
          </button>

          {/* Button: Update Subjects */}
          <button
            onClick={() => setIsSubjectsModalOpen(true)}
            className="p-4 rounded-2xl bg-[#FAF8F2] hover:bg-[#DDEDE5]/50 border border-[#E3EAE6] hover:border-[#0F6B50] transition-all text-left group"
          >
            <BookOpenCheck className="w-6 h-6 text-[#C9A227] mb-2 group-hover:scale-105 transition-transform" />
            <p className="text-xs font-bold text-[#1F2933] group-hover:text-[#0F6B50] transition-colors">
              Update Subjects
            </p>
            <p className="text-[10px] text-[#667085] mt-0.5">Curriculum & Malayalam titles</p>
          </button>

          <Link to={`/teacher/assessments${isSadhr ? `?classId=${encodeURIComponent(selectedClassContextId)}` : ''}`} className="p-4 rounded-2xl bg-[#DDEDE5]/40 hover:bg-[#DDEDE5] border border-[#bbdcd0] transition-all group">
            <GraduationCap className="w-6 h-6 text-[#0F6B50] mb-2 group-hover:scale-105 transition-transform" />
            <p className="text-xs font-bold text-[#084C3A]">Enter Assessment Marks</p>
            <p className="text-[10px] text-[#0F6B50] mt-0.5">Exam grades & test scoring</p>
          </Link>

          <Link to={`/teacher/quran${isSadhr ? `?classId=${encodeURIComponent(selectedClassContextId)}` : ''}`} className="p-4 rounded-2xl bg-[#FAF8F2] hover:bg-[#FBF4DE] border border-[#C9A227]/30 transition-all group">
            <BookOpen className="w-6 h-6 text-[#C9A227] mb-2 group-hover:scale-105 transition-transform" />
            <p className="text-xs font-bold text-[#1F2933]">Update Sabaq & Hifz</p>
            <p className="text-[10px] text-[#667085] mt-0.5">Surah, Ayahs & Tajweed</p>
          </Link>

          <Link to={`/teacher/students${isSadhr ? `?classId=${encodeURIComponent(selectedClassContextId)}` : ''}`} className="p-4 rounded-2xl bg-[#FAF8F2] hover:bg-[#DDEDE5]/30 border border-[#E3EAE6] transition-all group">
            <Users className="w-6 h-6 text-[#0F6B50] mb-2 group-hover:scale-105 transition-transform" />
            <p className="text-xs font-bold text-[#1F2933]">Student Dossiers</p>
            <p className="text-[10px] text-[#667085] mt-0.5">View all {totalStudentsCount} students in {isSadhr ? `Class ${dashboardClass}` : 'your assigned classes'}</p>
          </Link>
        </div>
      </Card>

      {/* Timetable Modal */}
      <UpdateTimetableModal
        isOpen={isTimetableModalOpen}
        onClose={() => setIsTimetableModalOpen(false)}
        initialClass={dashboardClass}
        assignedClasses={dashboardClasses}
        onUpdated={() => { void refreshDashboardClass(); }}
      />

      {/* Subjects Modal */}
      <UpdateSubjectsModal
        isOpen={isSubjectsModalOpen}
        onClose={() => setIsSubjectsModalOpen(false)}
        initialClass={dashboardClass}
        assignedClasses={dashboardClasses}
        onUpdated={() => { void refreshDashboardClass(); }}
      />

      {/* Practical Score Modal */}
      <UpdatePracticalScoreModal
        isOpen={isPracticalScoreModalOpen}
        onClose={() => setIsPracticalScoreModalOpen(false)}
        selectedClassId={isSadhr ? selectedClassContextId : undefined}
      />
    </div>
  );
};

