import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Tabs } from '../../components/common/Tabs';
import { SubjectPerformanceChart } from '../../components/charts/SubjectPerformanceChart';
import { MADRASA_SUBJECTS } from '../../data/madrasaCurriculum';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  BookOpen
} from 'lucide-react';
import { formatDate, getGradeBadgeClass } from '../../utils/formatters';

export const AcademicProgressView: React.FC = () => {
  const { selectedChildId, getStudentSummary, assessments } = useData();
  const [selectedTerm, setSelectedTerm] = useState('All');

  const summary = getStudentSummary(selectedChildId);
  if (!summary) return null;

  const { student, studiesProgress } = summary;
  const childAssessments = assessments.filter(a => a.studentId === student.id);

  const filteredAssessments = selectedTerm === 'All'
    ? childAssessments
    : childAssessments.filter(a => a.examTerm === selectedTerm);

  const termTabs = [
    { id: 'All', label: 'All Exams', count: childAssessments.length },
    { id: 'Half Yearly', label: 'Half Yearly Exam (അർദ്ധവാർഷികം)' },
    { id: 'Annual', label: 'Annual Exam (വാർഷികം)' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Academic Progress & Marksheet
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Subject-wise assessment records for <strong className="text-[#1F2933]">{student.name}</strong> (Class {student.class})
          </p>
        </div>

        <div className="bg-[#FAF8F2] px-4 py-3 rounded-2xl border border-[#E3EAE6] text-center sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Average Studies Score</p>
          <p className="text-2xl font-black text-[#0F6B50] mt-0.5">{studiesProgress}%</p>
        </div>
      </div>

      {/* Subject Performance Visual Chart */}
      {childAssessments.length > 0 && (
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#1F2933]">Subject Marks Breakdown (%)</h3>
              <p className="text-xs text-[#667085] mt-0.5">Comparative scoring across all Madrasa subjects</p>
            </div>
            <Badge variant="green">Current Term</Badge>
          </div>
          <SubjectPerformanceChart assessments={childAssessments} />
        </Card>
      )}

      {/* Term Filter Tabs */}
      <Tabs
        tabs={termTabs}
        activeTab={selectedTerm}
        onChange={setSelectedTerm}
        variant="pills"
      />

      {/* Subject Mark Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssessments.map(ass => {
          const subjectMeta = MADRASA_SUBJECTS.find(s => s.id === ass.subject);
          const percentage = Math.round((ass.obtainedMarks / ass.maxMarks) * 100);

          return (
            <Card key={ass.id} className="p-5 hover:border-[#0F6B50] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center font-bold text-xs">
                      {ass.subject.slice(0, 2)}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-[#1F2933]">{ass.subject}</h4>
                      <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">
                        {subjectMeta?.malayalamName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${getGradeBadgeClass(ass.grade)}`}>
                    Grade {ass.grade}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-[#667085]">{ass.examTerm}</span>
                  <span className="text-[#1F2933] font-bold">
                    {ass.obtainedMarks} / {ass.maxMarks} marks ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#DDEDE5]/50 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0F6B50] h-full rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Remarks */}
              {ass.remarks && (
                <div className="mt-3 pt-3 border-t border-[#FAF8F2] text-xs text-[#667085] flex items-start gap-1.5">
                  <span className="text-[#0F6B50] font-bold">Usthad Remark:</span>
                  <span className="italic font-medium text-[#1F2933]">"{ass.remarks}"</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
