import React from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  Award,
  Sparkles,
  CalendarCheck,
  BookOpenCheck,
  Medal,
  Star,
  Trophy,
  GraduationCap
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const AchievementsView: React.FC = () => {
  const { selectedChildId, getStudentSummary, achievements } = useData();

  const summary = getStudentSummary(selectedChildId);
  if (!summary) return null;

  const { student } = summary;
  const childAchievements = achievements.filter(a => a.studentId === student.id);

  const getAchievementIcon = (category: string) => {
    switch (category) {
      case 'Weekly Hifz Completion': return <BookOpenCheck className="w-6 h-6" />;
      case 'Monthly Practical Score Topper': return <Sparkles className="w-6 h-6" />;
      case 'Monthly Attendance Topper': return <CalendarCheck className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#0F6B50] via-[#0c5641] to-[#084C3A] rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-[#0F6B50]/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A227] bg-white/10 px-3 py-1 rounded-full inline-block">
              Milestone Recognition & Awards
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Student Achievements & Badges
            </h1>
            <p className="font-malayalam text-xs sm:text-sm text-[#DDEDE5] font-semibold">
              മദ്റസയിലെ പഠന, ഖുർആൻ & സ്വഭാവ നേട്ടങ്ങൾ
            </p>
            <p className="text-xs text-[#DDEDE5]/90">
              Honoring dedication and growth for <strong className="text-white">{student.name}</strong>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center min-w-[130px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#DDEDE5]">Total Badges</p>
            <p className="text-3xl sm:text-4xl font-black text-[#C9A227] mt-1">{childAchievements.length}</p>
            <span className="text-[10px] font-semibold text-[#DDEDE5] mt-1 block">Active Term 2026</span>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {childAchievements.map(ach => (
          <Card
            key={ach.id}
            className="p-6 bg-gradient-to-br from-white to-[#FAF8F2] border border-[#C9A227]/30 hover:border-[#C9A227] hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#C9A227]/5 rounded-bl-full pointer-events-none" />

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FAF8F2] to-[#FBF4DE] border border-[#C9A227]/40 text-[#9A7B1C] flex items-center justify-center shrink-0 shadow-xs">
                {getAchievementIcon(ach.category)}
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A7B1C] bg-[#FBF4DE] px-2 py-0.5 rounded-full border border-[#C9A227]/30">
                  {ach.category}
                </span>
                <h3 className="text-base font-extrabold text-[#1F2933] mt-1.5 leading-snug">
                  {ach.title}
                </h3>
                {ach.titleMalayalam && (
                  <p className="font-malayalam text-xs text-[#0F6B50] font-semibold mt-0.5">
                    {ach.titleMalayalam}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-[#667085] mt-4 leading-relaxed bg-[#FAF8F2] p-3 rounded-xl border border-[#E3EAE6]">
              {ach.description}
            </p>

            <div className="mt-4 pt-3 border-t border-[#E3EAE6] flex items-center justify-between text-[11px] text-[#667085]">
              <span>Awarded: <strong>{formatDate(ach.date)}</strong></span>
              <span className="font-medium text-[#084C3A]">By: {ach.awardedByTeacherName}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
