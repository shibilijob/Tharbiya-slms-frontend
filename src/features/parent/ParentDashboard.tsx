import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { ProgressGauge } from '../../components/charts/ProgressGauge';
import {
  BookOpen,
  GraduationCap,
  CalendarCheck2,
  HeartHandshake,
  Award,
  MessageSquareQuote,
  TrendingUp,
  ChevronRight,
  Target,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatTimeAgo, formatDate } from '../../utils/formatters';

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedChildId, getStudentSummary, remarks, quranRecords } = useData();

  const summary = getStudentSummary(selectedChildId);

  if (!summary) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-[#E3EAE6]">
        <p className="text-sm font-bold text-[#667085]">No child selected or student not found.</p>
      </div>
    );
  }

  const { student, overallProgress, quranProgress, studiesProgress, attendancePercentage, akhlaqScore, latestAchievement, activeGoals } = summary;
  const childRemarks = remarks.filter(r => r.studentId === student.id);
  const quranRecord = quranRecords.find(q => q.studentId === student.id);

  return (
    <div className="space-y-6">
      {/* 1. TOP STUDENT HERO CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F6B50] via-[#0c5641] to-[#084C3A] text-white p-5 sm:p-7 shadow-lg shadow-[#0F6B50]/15">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Student Identity */}
            <div className="flex items-center gap-3.5 sm:gap-4">
              <Avatar
                name={student.name}
                gender={student.gender}
                size="xl"
                ring
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">{student.name}</h2>
                  <Badge variant="green" size="sm">Active</Badge>
                </div>
                <p className="font-malayalam text-xs sm:text-sm text-[#DDEDE5] font-semibold mt-0.5">
                  {student.malayalamName}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#DDEDE5]">
                  <span>Class {student.class}</span>
                  <span>•</span>
                  <span>Adm: {student.admissionNo}</span>
                </div>
              </div>
            </div>

            {/* Overall Growth Gauge Mini */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/20">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#DDEDE5] block">
                  Overall Growth
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#FAF8F2]">
                  {overallProgress}%
                </span>
                <span className="text-[11px] text-[#C9A227] font-bold block mt-0.5">
                  ★ Grade A
                </span>
              </div>
              <ProgressGauge score={overallProgress} size={64} strokeWidth={6} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. FOUR CORE METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Quran & Hifz */}
        <Link to="/parent/quran" className="group">
          <Card padding="sm" className="h-full group-hover:border-[#0F6B50] group-hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#0F6B50] flex items-center">
                Details <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#667085]">Quran & Hifz</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-[#1F2933]">{quranProgress}%</span>
            </div>
            <p className="text-[11px] text-[#667085] mt-1 truncate">
              {quranRecord ? `Sabaq: ${quranRecord.currentSurahName}` : 'Surah Al-Mulk'}
            </p>
          </Card>
        </Link>

        {/* Academic Studies */}
        <Link to="/parent/progress" className="group">
          <Card padding="sm" className="h-full group-hover:border-[#0F6B50] group-hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#0F6B50] flex items-center">
                Marks <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#667085]">Studies</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-[#1F2933]">{studiesProgress}%</span>
            </div>
            <p className="text-[11px] text-[#667085] mt-1 truncate">
              Term 1 Marksheet
            </p>
          </Card>
        </Link>

        {/* Attendance */}
        <Link to="/parent/attendance" className="group">
          <Card padding="sm" className="h-full group-hover:border-[#0F6B50] group-hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#0F6B50] flex items-center">
                Month <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#667085]">Attendance</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">{attendancePercentage}%</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-bold mt-1">
              Regular & Punctual
            </p>
          </Card>
        </Link>

        {/* Practical Score */}
        <Link to="/parent/akhlaq" className="group">
          <Card padding="sm" className="h-full group-hover:border-[#0F6B50] group-hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#FBF4DE] text-[#9A7B1C] flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#9A7B1C] flex items-center">
                Score <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#667085]">Practical Score</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-[#1F2933]">{akhlaqScore}%</span>
            </div>
            <p className="text-[11px] text-[#9A7B1C] font-bold mt-1">
              Excellent Adab & Practice
            </p>
          </Card>
        </Link>
      </div>

      {/* 3. ACTIVE LEARNING GOALS & TARGETS */}
      {(activeGoals && activeGoals.length > 0) && (
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#DDEDE5] text-[#0F6B50]">
                <Target className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-[#1F2933]">Active Targets</h3>
                <p className="text-xs text-[#667085]">Student goals and milestones in progress</p>
              </div>
            </div>
            <Badge variant="green">{activeGoals.length} In Progress</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeGoals.map(goal => (
              <div key={goal.id} className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E3EAE6]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#1F2933] leading-snug">
                    {goal.title}
                  </span>
                  <span className="text-xs font-black text-[#0F6B50] ml-2">
                    {goal.progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-[#DDEDE5]/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0F6B50] h-full rounded-full transition-all"
                    style={{ width: `${goal.progressPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px] text-[#667085]">
                  <span>Category: {goal.category}</span>
                  <span>Target: {formatDate(goal.targetDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5. ACHIEVEMENTS & RECENT MILESTONES BANNER */}
      {latestAchievement && (
        <Card variant="gold" className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#C9A227]/20 text-[#9A7B1C] flex items-center justify-center shrink-0 border border-[#C9A227]/30">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#9A7B1C] bg-[#FBF4DE] px-2 py-0.5 rounded-full border border-[#C9A227]/30">
                  Featured Achievement
                </span>
                <h4 className="text-base font-extrabold text-[#1F2933] mt-1">
                  {latestAchievement.title}
                </h4>
                <p className="text-xs text-[#667085] mt-0.5">
                  {latestAchievement.description}
                </p>
              </div>
            </div>
            <Link to="/parent/achievements" className="shrink-0">
              <Button size="sm" variant="gold">
                View Badge Shelf
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};
export default ParentDashboard;
