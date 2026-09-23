import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useClassStore } from '../../stores';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Avatar } from '../../components/common/Avatar';
import { api } from '../../lib/axios';
import {
  GraduationCap,
  Users,
  UserSquare2,
  Layers,
  CalendarCheck,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  BookOpen,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { students, attendance } = useData();
  const classesList = useClassStore((s) => s.classes);
  const fetchClasses = useClassStore((s) => s.fetchClasses);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardStats = async () => {
      try {
        const res = await api.get<DashboardStats>('/sadhr/stats');
        if (!cancelled) {
          setDashboardStats(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      }
    };

    fetchDashboardStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalStudents = dashboardStats?.totalStudents ?? students.length;
  const uniqueTeachers = new Set(students.map(s => s.assignedTeacherId).filter(Boolean));
  const totalTeachers = dashboardStats?.totalTeachers ?? uniqueTeachers.size;
  const uniqueParents = new Set(students.map(s => s.parentId).filter(Boolean));
  const totalParents = uniqueParents.size;
  const totalClasses = dashboardStats?.totalClasses ?? classesList.length;

  const getClassAttendancePercentage = (className: string) => {
    const classNumber = className.replace(/^Class\s*/i, '').trim();
    const classStudentIds = new Set(
      students
        .filter((student) => student.class === classNumber || student.class === className)
        .map((student) => student.id)
    );
    const classAttendance = attendance.filter(
      (record) => classStudentIds.has(record.studentId) && record.status !== 'HOLIDAY'
    );

    if (classAttendance.length === 0) {
      return '—';
    }

    const presentCount = classAttendance.filter((record) => record.status === 'PRESENT').length;
    return `${Math.round((presentCount / classAttendance.length) * 100)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#084C3A] rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-[#0F6B50] relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A227] bg-white/10 px-3 py-1 rounded-full inline-block">
              Sadhr Mudarris Executive Overview
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Institutional Dashboard
            </h1>
            <p className="font-malayalam text-xs sm:text-sm text-[#DDEDE5] font-semibold">
              ദാറുന്നജാത്ത് മദ്രസ മുണ്ടമ്പ്ര — സമഗ്ര ഭരണനിർവഹണം
            </p>
            <p className="text-xs text-[#DDEDE5]/80">
              Welcome, <strong className="text-white">{user?.name || "Sadhr Muallim"}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/teacher/dashboard">
              <Button
                variant="gold"
                size="md"
                className="bg-[#C9A227] hover:bg-[#b59120] text-[#084C3A] font-extrabold shadow-md hover:shadow-lg transition-all"
                leftIcon={<GraduationCap className="w-4 h-4" />}
              >
                Switch to My Muallim Dashboard
              </Button>
            </Link>
            <Link to="/admin/reports">
              <Button variant="outline" size="md" className="border-white/30 text-white hover:bg-white/10" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
                Reports Center
              </Button>
            </Link>
            <Link to="/admin/classes">
              <Button variant="outline" size="md" className="border-white/30 text-white hover:bg-white/10" leftIcon={<Layers className="w-4 h-4" />}>
                Class Structure
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={totalStudents}
          sublabel="Enrolled across all classes"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Usthads / Staff"
          value={totalTeachers}
          sublabel="Faculty members"
          icon={<BookOpen className="w-5 h-5" />}
        />
        <StatCard
          label="Registered Guardians"
          value={totalParents}
          sublabel="Parent portal users"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <StatCard
          label="Madrasa Classes"
          value={totalClasses}
          sublabel="Active madrasa classes"
          icon={<Layers className="w-5 h-5" />}
          variant="gold"
        />
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Class Attendance & Performance Overview */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E3EAE6]">
              <div>
                <h3 className="text-base font-bold text-[#1F2933]">Class Capacity & Attendance</h3>
                <p className="text-xs text-[#667085]">Attendance metrics by Dars class</p>
              </div>
              <Badge variant="green">Academic Year 2026</Badge>
            </div>

            <div className="space-y-3">
              {classesList.map((cls) => {
                const classNumber = cls.name.replace(/^Class\s*/i, '').trim();
                const count = students.filter(
                  (s) => s.class === classNumber || s.class === cls.name
                ).length;
                return (
                  <div key={cls.id} className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#E3EAE6] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#1F2933]">{cls.name}</h4>
                      <p className="text-[10px] text-[#667085]">{count} enrolled student{count === 1 ? '' : 's'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-800">
                        {count > 0 ? getClassAttendancePercentage(cls.name) : '—'}
                      </span>
                      <p className="text-[9px] text-[#667085] uppercase">Attendance</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: Quick Management Shortcuts */}
        <div className="lg:col-span-5 space-y-4">
          {/* Dedicated Muallim Classroom Switcher Card */}
          <Card className="p-5 sm:p-6 bg-gradient-to-br from-[#FAF8F2] to-[#DDEDE5]/40 border-2 border-[#0F6B50]/20 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F6B50] bg-[#DDEDE5] px-2.5 py-0.5 rounded-full inline-block mb-1">
                  Faculty Workspace
                </span>
                <h3 className="text-sm font-bold text-[#1F2933]">My Muallim Classroom</h3>
                <p className="text-xs text-[#667085] mt-1">
                  Switch to your teaching dashboard to mark attendance, record Quran & Hifz, evaluate assessments, and update practical scores.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/teacher/dashboard" className="w-full inline-block">
                <Button variant="primary" size="sm" className="w-full justify-center gap-2 bg-[#0F6B50] hover:bg-[#084C3A] text-xs font-bold shadow-sm">
                  <GraduationCap className="w-4 h-4" />
                  Open My Muallim Dashboard
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="text-sm font-bold text-[#1F2933] mb-3">Institutional Controls</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/admin/students" className="p-3 bg-[#FAF8F2] hover:bg-[#DDEDE5]/40 rounded-xl text-left border border-[#E3EAE6] transition-all">
                <GraduationCap className="w-5 h-5 text-[#0F6B50] mb-1" />
                <p className="text-xs font-bold text-[#1F2933]">Manage Students</p>
                <p className="text-[10px] text-[#667085]">Admissions & classes</p>
              </Link>

              <Link to="/admin/teachers" className="p-3 bg-[#FAF8F2] hover:bg-[#DDEDE5]/40 rounded-xl text-left border border-[#E3EAE6] transition-all">
                <Users className="w-5 h-5 text-[#0F6B50] mb-1" />
                <p className="text-xs font-bold text-[#1F2933]">Manage Teachers</p>
                <p className="text-[10px] text-[#667085]">Workload & classes</p>
              </Link>

              <Link to="/admin/reports" className="p-3 bg-[#FAF8F2] hover:bg-[#DDEDE5]/40 rounded-xl text-left border border-[#E3EAE6] transition-all">
                <FileSpreadsheet className="w-5 h-5 text-[#0F6B50] mb-1" />
                <p className="text-xs font-bold text-[#1F2933]">Reports Center</p>
                <p className="text-[10px] text-[#667085]">Progress & registers</p>
              </Link>

              <Link to="/admin/classes" className="p-3 bg-[#FAF8F2] hover:bg-[#DDEDE5]/40 rounded-xl text-left border border-[#E3EAE6] transition-all">
                <Layers className="w-5 h-5 text-[#0F6B50] mb-1" />
                <p className="text-xs font-bold text-[#1F2933]">Class Management</p>
                <p className="text-[10px] text-[#667085]">Standards & Usthads</p>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

