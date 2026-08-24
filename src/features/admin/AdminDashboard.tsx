import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Avatar } from '../../components/common/Avatar';
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

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { students } = useData();

  const totalStudents = students.length;
  const uniqueTeachers = new Set(students.map(s => s.assignedTeacherId).filter(Boolean));
  const totalTeachers = uniqueTeachers.size;
  const uniqueParents = new Set(students.map(s => s.parentId).filter(Boolean));
  const totalParents = uniqueParents.size;
  const uniqueClasses = new Set(students.map(s => s.class).filter(Boolean));
  const totalClasses = uniqueClasses.size;

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
              Welcome, <strong className="text-white">{user?.name || "Usthad Shihabudheen Saadi"}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/admin/reports">
              <Button variant="gold" size="md" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
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
          sublabel="Class 1 to Class 7"
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
              {['1', '2', '3', '4', '5', '6', '7'].map(cNum => {
                const count = students.filter(s => s.class === cNum || s.class === `Class ${cNum}`).length;
                return (
                  <div key={cNum} className="p-3.5 rounded-xl bg-[#FAF8F2] border border-[#E3EAE6] flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#1F2933]">Class {cNum}</h4>
                      <p className="text-[10px] text-[#667085]">{count} enrolled student{count === 1 ? '' : 's'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-800">
                        {count > 0 ? '95%' : '—'}
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
