import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Tabs } from '../../components/common/Tabs';
import {
  MessageSquareQuote,
  BookOpen,
  GraduationCap,
  HeartHandshake,
  CalendarCheck2,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const RemarksView: React.FC = () => {
  const { selectedChildId, getStudentSummary, remarks } = useData();
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const summary = getStudentSummary(selectedChildId);
  if (!summary) return null;

  const { student } = summary;
  const childRemarks = remarks.filter(r => r.studentId === student.id);

  const filteredRemarks = selectedFilter === 'ALL'
    ? childRemarks
    : childRemarks.filter(r => r.category.toUpperCase() === selectedFilter);

  const filterTabs = [
    { id: 'ALL', label: 'All Remarks', count: childRemarks.length },
    { id: 'QURAN', label: 'Quran' },
    { id: 'STUDIES', label: 'Studies' },
    { id: 'AKHLAQ', label: 'Practical Score' },
    { id: 'ATTENDANCE', label: 'Attendance' }
  ];

  const getCategoryIcon = (cat: string) => {
    switch (cat.toUpperCase()) {
      case 'QURAN': return <BookOpen className="w-4 h-4" />;
      case 'STUDIES': return <GraduationCap className="w-4 h-4" />;
      case 'AKHLAQ': return <HeartHandshake className="w-4 h-4" />;
      case 'ATTENDANCE': return <CalendarCheck2 className="w-4 h-4" />;
      default: return <MessageSquareQuote className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <MessageSquareQuote className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Teacher Remarks & Observations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Continuous guidance and feedback from Usthads for <strong className="text-[#1F2933]">{student.name}</strong>
          </p>
        </div>

        <Badge variant="green" size="lg">
          {childRemarks.length} Total Observations
        </Badge>
      </div>

      {/* Filter Tabs */}
      <Tabs
        tabs={filterTabs}
        activeTab={selectedFilter}
        onChange={setSelectedFilter}
        variant="pills"
      />

      {/* Remarks Timeline */}
      <div className="space-y-4">
        {filteredRemarks.map((rem, idx) => (
          <Card
            key={rem.id}
            className={`p-5 sm:p-6 transition-all ${
              rem.isImportant ? 'border-l-4 border-l-[#0F6B50] bg-[#FAF8F2]' : 'hover:border-[#0F6B50]'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center">
                  {getCategoryIcon(rem.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1F2933]">{rem.teacherName}</span>
                    <Badge variant="gray" size="sm">{rem.category}</Badge>
                  </div>
                  <p className="text-[10px] text-[#667085]">{formatDate(rem.date)}</p>
                </div>
              </div>

              {rem.isImportant && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#084C3A] bg-[#DDEDE5] px-2 py-0.5 rounded-full border border-[#bbdcd0]">
                  High Attention
                </span>
              )}
            </div>

            <p className="text-sm sm:text-base font-medium text-[#1F2933] leading-relaxed pl-1">
              "{rem.remark}"
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
