import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { timetableService } from '../../services/timetableService';
import { subjectService } from '../../services/subjectService';
import { MuallimUser, TimetablePeriod, MadrasaDay } from '../../types';
import { api } from '../../lib/axios';
import {
  Users,
  CalendarCheck,
  Award,
  BookOpen,
  GraduationCap,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Search,
  CalendarDays,
  BookOpenCheck,
  Layers,
  MapPin,
  User as UserIcon,
  Settings,
  HeartHandshake
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { students, attendance, quranRecords, remarks, markAttendance, batchMarkAttendance, getStudentSummary } = useData();

  // Assigned classes for this Muallim
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [dashboardClass, setDashboardClass] = useState<string>('5');

  // Modal states for Timetable, Subjects & Practical Score
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
  const [isPracticalScoreModalOpen, setIsPracticalScoreModalOpen] = useState(false);

  // Live schedule for timetable widget
  const [selectedDashboardDay, setSelectedDashboardDay] = useState<MadrasaDay>('Sunday');
  const [todaySchedule, setTodaySchedule] = useState<TimetablePeriod[]>([]);
  const [activeSubjectsCount, setActiveSubjectsCount] = useState(7);

  // Determine assigned classes dynamically from live MongoDB database
  useEffect(() => {
    // 1. Fetch live faculty data from backend
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
              setTeacherClasses(classes);
              setDashboardClass(classes[0]);

              // Update local auth user cache
              const stored = localStorage.getItem('tharbiyah_auth_user');
              if (stored) {
                try {
                  const parsed = JSON.parse(stored);
                  parsed.assignedClasses = classes;
                  parsed.name = matched.name || parsed.name;
                  parsed.id = matched.id || parsed.id;
                  localStorage.setItem('tharbiyah_auth_user', JSON.stringify(parsed));
                } catch {}
              }
              return;
            }
          }
        }
      })
      .catch((err) => {
        console.warn("Could not query /faculty-members", err);
      });

    // 2. Fallback to user state
    const teacherUser = user as any;
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

    const userClasses = rawList
      .map(c => String(c).replace(/^Class\s*/i, '').trim())
      .filter(Boolean);

    if (userClasses.length > 0) {
      setTeacherClasses(userClasses);
      setDashboardClass(userClasses[0]);
    }
  }, [user]);

  const loadTimetableAndSubjects = () => {
    const schedule = timetableService.getDaySchedule(dashboardClass, selectedDashboardDay);
    setTodaySchedule(schedule);
    const subjects = subjectService.getAll();
    setActiveSubjectsCount(subjects.length);
  };

  useEffect(() => {
    loadTimetableAndSubjects();
  }, [dashboardClass, selectedDashboardDay]);

  // Filter students assigned ONLY to this teacher's assigned classes
  const teacherStudents = useMemo(() => {
    return students.filter(s => {
      const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
      return teacherClasses.includes(sClass) || (user?.id && s.assignedTeacherId === user.id);
    });
  }, [students, teacherClasses, user]);

  const classStudents = useMemo(() => {
    return students.filter(s => {
      const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
      return sClass === dashboardClass;
    });
  }, [students, dashboardClass]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter(a => a.date === todayStr);

  const [markingSuccess, setMarkingSuccess] = useState(false);

  // Dynamic Statistics based ONLY on this teacher's assigned students (Real Data)
  const totalStudentsCount = teacherStudents.length;
  const presentTodayCount = todayAttendance.filter(a =>
    a.status === 'PRESENT' && teacherStudents.some(s => s.id === a.studentId)
  ).length;
  const excellentProgressCount = teacherStudents.filter(s => {
    const summ = getStudentSummary(s.id);
    return (summ?.overallProgress || 0) >= 80;
  }).length;

  // Quick mark all present for today
  const handleMarkAllPresent = async () => {
    const targetStudents = classStudents.length > 0 ? classStudents : teacherStudents;
    const updates = targetStudents.map(s => ({
      studentId: s.id,
      date: todayStr,
      status: 'PRESENT' as const
    }));
    await batchMarkAttendance(updates, user?.id || 'teacher-1');
    setMarkingSuccess(true);
    setTimeout(() => setMarkingSuccess(false), 3000);
  };

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
              {teacherClasses.map(c => `Class ${c}`).join(' & ') || `Class ${dashboardClass}`} • Darunnajath Mundambra
            </p>
            <p className="text-xs text-[#DDEDE5]/80">
              Assigned Classes: <strong className="text-white">{teacherClasses.map(c => `Class ${c}`).join(', ') || `Class ${dashboardClass}`}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
          value={totalStudentsCount}
          sublabel={`Assigned in ${teacherClasses.map(c => `Class ${c}`).join(' & ') || `Class ${dashboardClass}`}`}
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
          value={excellentProgressCount}
          sublabel="Distinction in Sabaq/Hifz"
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
              Quickly record or toggle attendance for your assigned students
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Show tabs only for assigned classes */}
            {teacherClasses.length > 1 ? (
              <div className="flex bg-[#FAF8F2] border border-[#E3EAE6] p-1 rounded-xl">
                {teacherClasses.map(cls => (
                  <button
                    key={cls}
                    onClick={() => setDashboardClass(cls)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      dashboardClass === cls ? 'bg-[#0F6B50] text-white shadow-xs' : 'text-[#667085] hover:text-[#1F2933]'
                    }`}
                  >
                    Class {cls}
                  </button>
                ))}
              </div>
            ) : (
              <span className="px-3 py-1 bg-[#DDEDE5] text-[#084C3A] text-xs font-extrabold rounded-xl border border-[#0F6B50]/20">
                Class {teacherClasses[0] || dashboardClass}
              </span>
            )}

            <Button
              size="sm"
              variant="secondary"
              onClick={handleMarkAllPresent}
            >
              {markingSuccess ? "✓ Marked All Present!" : "One-Tap: Mark All Present"}
            </Button>
            <Link to="/teacher/attendance">
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
                      onClick={() => markAttendance(student.id, todayStr, 'PRESENT', user?.id || 'teacher-1')}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${status === 'PRESENT'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-[#667085] hover:bg-emerald-100'
                        }`}
                      title="Present"
                    >
                      P
                    </button>
                    <button
                      onClick={() => markAttendance(student.id, todayStr, 'LATE', user?.id || 'teacher-1')}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${status === 'LATE'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white text-[#667085] hover:bg-amber-100'
                        }`}
                      title="Late"
                    >
                      L
                    </button>
                    <button
                      onClick={() => markAttendance(student.id, todayStr, 'ABSENT', user?.id || 'teacher-1')}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${status === 'ABSENT'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white text-[#667085] hover:bg-rose-100'
                        }`}
                      title="Absent"
                    >
                      A
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
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                selectedDashboardDay === day
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

          <Link to="/teacher/assessments" className="p-4 rounded-2xl bg-[#DDEDE5]/40 hover:bg-[#DDEDE5] border border-[#bbdcd0] transition-all group">
            <GraduationCap className="w-6 h-6 text-[#0F6B50] mb-2 group-hover:scale-105 transition-transform" />
            <p className="text-xs font-bold text-[#084C3A]">Enter Assessment Marks</p>
            <p className="text-[10px] text-[#0F6B50] mt-0.5">Exam grades & test scoring</p>
          </Link>

          <Link to="/teacher/quran" className="p-4 rounded-2xl bg-[#FAF8F2] hover:bg-[#FBF4DE] border border-[#C9A227]/30 transition-all group">
            <BookOpen className="w-6 h-6 text-[#C9A227] mb-2 group-hover:scale-105 transition-transform" />
            <p className="text-xs font-bold text-[#1F2933]">Update Sabaq & Hifz</p>
            <p className="text-[10px] text-[#667085] mt-0.5">Surah, Ayahs & Tajweed</p>
          </Link>

          <Link to="/teacher/students" className="p-4 rounded-2xl bg-[#FAF8F2] hover:bg-[#DDEDE5]/30 border border-[#E3EAE6] transition-all group">
            <Users className="w-6 h-6 text-[#0F6B50] mb-2 group-hover:scale-105 transition-transform" />
            <p className="text-xs font-bold text-[#1F2933]">Student Dossiers</p>
            <p className="text-[10px] text-[#667085] mt-0.5">View all {totalStudentsCount} assigned students</p>
          </Link>
        </div>
      </Card>

      {/* Timetable Modal */}
      <UpdateTimetableModal
        isOpen={isTimetableModalOpen}
        onClose={() => setIsTimetableModalOpen(false)}
        initialClass={dashboardClass}
        assignedClasses={teacherClasses}
        onUpdated={loadTimetableAndSubjects}
      />

      {/* Subjects Modal */}
      <UpdateSubjectsModal
        isOpen={isSubjectsModalOpen}
        onClose={() => setIsSubjectsModalOpen(false)}
        onUpdated={loadTimetableAndSubjects}
      />

      {/* Practical Score Modal */}
      <UpdatePracticalScoreModal
        isOpen={isPracticalScoreModalOpen}
        onClose={() => setIsPracticalScoreModalOpen(false)}
      />
    </div>
  );
};


