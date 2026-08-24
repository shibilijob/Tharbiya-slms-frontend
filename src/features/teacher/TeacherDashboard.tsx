import React, { useState, useEffect } from 'react';
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
import { TimetablePeriod, MadrasaDay } from '../../data/mockTimetable';
import { SubjectMeta } from '../../data/madrasaCurriculum';
import {
  Users,
  CalendarCheck,
  AlertTriangle,
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
  const { students, attendance, quranRecords, remarks, markAttendance, batchMarkAttendance } = useData();

  // Class filter for dashboard quick register
  const [dashboardClass, setDashboardClass] = useState<'5' | '6'>('5');

  // Modal states for Timetable, Subjects & Practical Score
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
  const [isPracticalScoreModalOpen, setIsPracticalScoreModalOpen] = useState(false);

  // Live schedule for timetable widget
  const [selectedDashboardDay, setSelectedDashboardDay] = useState<MadrasaDay>('Sunday');
  const [todaySchedule, setTodaySchedule] = useState<TimetablePeriod[]>([]);
  const [activeSubjectsCount, setActiveSubjectsCount] = useState(7);

  const loadTimetableAndSubjects = () => {
    const schedule = timetableService.getDaySchedule(dashboardClass, selectedDashboardDay);
    setTodaySchedule(schedule);
    const subjects = subjectService.getAll();
    setActiveSubjectsCount(subjects.length);
  };

  useEffect(() => {
    loadTimetableAndSubjects();
  }, [dashboardClass, selectedDashboardDay]);

  // Filter students assigned to this teacher (e.g. Class 5 & 6)
  const teacherStudents = students.filter(s => s.class === '5' || s.class === '6');
  const classStudents = students.filter(s => s.class === dashboardClass);

  const todayStr = "2026-08-16";
  const todayAttendance = attendance.filter(a => a.date === todayStr);

  const [searchQuery, setSearchQuery] = useState('');
  const [markingSuccess, setMarkingSuccess] = useState(false);

  // Statistics
  const totalStudentsCount = 42; // Teacher total across 5 & 6
  const presentTodayCount = 39;
  const needsAttentionCount = 5;
  const excellentProgressCount = 8;

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

  // Flagged students needing attention (e.g. low attendance, revision needed, or recent remark)
  const studentsNeedingAttention = teacherStudents.slice(3, 8);

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
              Assalamu Alaikum, {user?.name || "Usthad Shihabudheen Saadi"}
            </h1>
            <p className="font-malayalam text-xs sm:text-sm text-[#DDEDE5] font-semibold">
              Class 5 & 6 • Darunnajath Mundambra
            </p>
            <p className="text-xs text-[#DDEDE5]/80">
              Today: <strong className="text-white">Sunday, 16 August 2026</strong>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={totalStudentsCount}
          sublabel="Assigned in Class 5 & 6"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Present Today"
          value={presentTodayCount}
          sublabel="93% Daily Attendance"
          icon={<CalendarCheck className="w-5 h-5" />}
          trend={{ value: "High", positive: true }}
        />
        <StatCard
          label="Needs Attention"
          value={needsAttentionCount}
          sublabel="Quran revision / absent"
          icon={<AlertTriangle className="w-5 h-5 text-amber-700" />}
          trend={{ value: "5 flagged" }}
        />
        <StatCard
          label="Excellent Progress"
          value={excellentProgressCount}
          sublabel="Distinction in Hifz"
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
              Quickly record or toggle attendance for active students
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-[#FAF8F2] border border-[#E3EAE6] p-1 rounded-xl">
              <button
                onClick={() => setDashboardClass('5')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  dashboardClass === '5' ? 'bg-[#0F6B50] text-white shadow-xs' : 'text-[#667085] hover:text-[#1F2933]'
                }`}
              >
                Class 5
              </button>
              <button
                onClick={() => setDashboardClass('6')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  dashboardClass === '6' ? 'bg-[#0F6B50] text-white shadow-xs' : 'text-[#667085] hover:text-[#1F2933]'
                }`}
              >
                Class 6
              </button>
            </div>

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
          {classStudents.slice(0, 6).map(student => {
            const record = todayAttendance.find(a => a.studentId === student.id);
            const status = record?.status || 'PRESENT';

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
          })}
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

        {/* Day Selector Tabs (Sunday to Saturday including Friday) */}
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
          {todaySchedule.map(period => (
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
          ))}
        </div>
      </Card>

      {/* 5. TWO-COLUMN: STUDENTS NEEDING ATTENTION & MUALLIM QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Students Needing Attention */}
        <div className="lg:col-span-6">
          <Card className="p-5 sm:p-6 h-full border-amber-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E3EAE6]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-[#1F2933]">
                    Students Needing Attention ({needsAttentionCount})
                  </h3>
                  <p className="text-[10px] text-[#667085]">Requires Quran revision or attendance check</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {studentsNeedingAttention.map(student => (
                <div
                  key={student.id}
                  className="p-3 rounded-2xl bg-[#FAF8F2] border border-[#E3EAE6] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={student.name} gender={student.gender} size="md" />
                    <div>
                      <p className="text-xs font-bold text-[#1F2933]">{student.name}</p>
                      <p className="font-malayalam text-[10px] text-[#0F6B50] font-semibold">{student.malayalamName}</p>
                      <p className="text-[10px] text-amber-800 font-semibold mt-0.5">
                        {student.id === 'student-4' ? 'Needs revision on Surah An-Naba' : 'Recent leave informed'}
                      </p>
                    </div>
                  </div>

                  <Link to={`/teacher/students?id=${student.id}`}>
                    <Button size="sm" variant="outline" className="text-xs">
                      Update
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Quick Action Shortcuts & Tools */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-5 sm:p-6 h-full">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E3EAE6]">
              <h3 className="text-base font-bold text-[#1F2933]">
                Muallim Quick Actions
              </h3>
              <Badge variant="gold" size="sm">
                {activeSubjectsCount} Subjects
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <p className="text-[10px] text-[#667085] mt-0.5">View all 42 students</p>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Timetable Modal */}
      <UpdateTimetableModal
        isOpen={isTimetableModalOpen}
        onClose={() => setIsTimetableModalOpen(false)}
        initialClass={dashboardClass}
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


