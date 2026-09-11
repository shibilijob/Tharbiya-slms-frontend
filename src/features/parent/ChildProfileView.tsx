import React from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { ProgressGauge } from '../../components/charts/ProgressGauge';
import {
  User,
  Calendar,
  BookOpen,
  GraduationCap,
  Sparkles,
  Award
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const ChildProfileView: React.FC = () => {
  const { selectedChildId, getStudentSummary, assessments, quranRecords, achievements } = useData();

  const summary = getStudentSummary(selectedChildId);
  if (!summary) return null;

  const { student, overallProgress, quranProgress, studiesProgress } = summary;
  const childAssessments = assessments.filter(a => a.studentId === student.id);
  const quranRecord = quranRecords.find(q => q.studentId === student.id);
  const childAchievements = achievements.filter(a => a.studentId === student.id);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E3EAE6] shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <Avatar
            name={student.name}
            gender={student.gender}
            size="xl"
            ring
            className="w-24 h-24 sm:w-28 sm:h-28 text-2xl"
          />
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2933]">{student.name}</h1>
              <Badge variant="green">Class {student.class}</Badge>
            </div>
            <p className="font-malayalam text-sm sm:text-base font-bold text-[#0F6B50]">
              {student.malayalamName}
            </p>
            <p className="text-xs sm:text-sm text-[#667085]">
              Darunnajath Mundambra • Admitted on {formatDate(student.admissionDate)}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[#667085]">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0F6B50]" />
                Muallim: <strong className="text-[#1F2933]">{student.teacherName}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0F6B50]" />
                DOB: <strong className="text-[#1F2933]">{formatDate(student.dob)}</strong>
              </span>
            </div>
          </div>

          <div className="shrink-0 bg-[#FAF8F2] p-4 rounded-2xl border border-[#E3EAE6] text-center">
            <ProgressGauge score={overallProgress} size={90} strokeWidth={8} label="Overall Score" />
          </div>
        </div>
      </div>

      {/* 4 Pillars Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quran Dossier */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3EAE6]">
            <h3 className="text-base font-bold text-[#1F2933] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0F6B50]" />
              Quran & Hifz Profile
            </h3>
            <Badge variant="green">{quranProgress}% Mastery</Badge>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-1.5 border-b border-[#FAF8F2]">
              <span className="text-[#667085]">Current Lesson:</span>
              <span className="font-bold text-[#1F2933]">{quranRecord?.sabaqLesson || 'Not recorded'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#FAF8F2]">
              <span className="text-[#667085]">Hifz Surahs Completed:</span>
              <span className="font-bold text-[#0F6B50]">{quranRecord?.hifzSurahsCount ?? 0} Surahs</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[#FAF8F2]">
              <span className="text-[#667085]">Tajweed Pronunciation Level:</span>
              <span className="font-bold text-[#1F2933]">{quranRecord?.tajweedLevel || 'Not recorded'}</span>
            </div>
          </div>
        </Card>

        {/* Academic Dossier */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3EAE6]">
            <h3 className="text-base font-bold text-[#1F2933] flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#0F6B50]" />
              Academic Dossier
            </h3>
            <Badge variant="green">{studiesProgress}% Overall</Badge>
          </div>

          <div className="space-y-2.5">
            {childAssessments.slice(0, 4).map(ass => (
              <div key={ass.id} className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F2]">
                <div>
                  <p className="text-xs font-bold text-[#1F2933]">{ass.subject}</p>
                  <p className="text-[10px] text-[#667085]">{ass.examTerm}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-[#0F6B50]">{ass.obtainedMarks}/{ass.maxMarks}</span>
                  <span className="ml-2 text-xs font-bold text-[#084C3A] bg-[#DDEDE5] px-1.5 py-0.2 rounded-md">
                    {ass.grade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Badges & Milestones */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E3EAE6]">
          <h3 className="text-base font-bold text-[#1F2933] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C9A227]" />
            Student Badges & Achievements
          </h3>
          <span className="text-xs font-semibold text-[#667085]">{childAchievements.length} Badges</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {childAchievements.map(ach => (
            <div key={ach.id} className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FAF8F2] to-[#FBF4DE] border border-[#C9A227]/30 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A227]/20 text-[#9A7B1C] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-[#1F2933]">{ach.title}</p>
                <p className="font-malayalam text-[10px] text-[#9A7B1C] font-semibold">{ach.titleMalayalam}</p>
                <p className="text-[10px] text-[#667085] mt-1">{ach.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
