import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { practicalCriteriaService } from '../../services/practicalCriteriaService';
import { AkhlaqCategoryMeta } from '../../data/madrasaCurriculum';
import { AkhlaqCategory, AkhlaqLevel } from '../../types';
import {
  HeartHandshake,
  ShieldCheck,
  Heart,
  Sparkles,
  Users,
  CheckCircle2,
  Award,
  Star,
  BookOpen
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const AkhlaqView: React.FC = () => {
  const { selectedChildId, getStudentSummary, akhlaqRecords } = useData();
  const [categories, setCategories] = useState<AkhlaqCategoryMeta[]>([]);

  useEffect(() => {
    setCategories(practicalCriteriaService.getAll());
  }, []);

  const summary = getStudentSummary(selectedChildId);
  if (!summary) return null;

  const { student, akhlaqScore } = summary;
  const akhlaqRecord = akhlaqRecords.find(a => a.studentId === student.id);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Discipline': return <ShieldCheck className="w-5 h-5" />;
      case 'Respect': return <Heart className="w-5 h-5" />;
      case 'Cleanliness': return <Sparkles className="w-5 h-5" />;
      case 'Cooperation': return <Users className="w-5 h-5" />;
      case 'Responsibility': return <CheckCircle2 className="w-5 h-5" />;
      case 'Participation': return <Award className="w-5 h-5" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getLevelBadge = (level: AkhlaqLevel) => {
    switch (level) {
      case 'Excellent':
        return <span className="bg-[#DDEDE5] text-[#084C3A] border border-[#bbdcd0] font-bold px-2.5 py-0.5 rounded-full text-xs">Excellent ★★★</span>;
      case 'Very Good':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-xs">Very Good ★★</span>;
      case 'Good':
        return <span className="bg-blue-50 text-blue-800 border border-blue-200 font-bold px-2.5 py-0.5 rounded-full text-xs">Good ★</span>;
      case 'Developing':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2.5 py-0.5 rounded-full text-xs">Developing</span>;
      default:
        return <span className="bg-rose-50 text-rose-800 border border-rose-200 font-bold px-2.5 py-0.5 rounded-full text-xs">Needs Attention</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#0F6B50] to-[#084C3A] rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-[#0F6B50]/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A227] bg-white/10 px-3 py-1 rounded-full inline-block mb-2">
              Akhlaq & Adab Portfolio
            </span>
            <h1 className="text-xl sm:text-2xl font-bold">
              Practical Score & Character Development
            </h1>
            <p className="font-malayalam text-xs sm:text-sm text-[#DDEDE5] mt-1 font-semibold">
              സ്വഭാവ രൂപീകരണവും പ്രായോഗിക സംസ്കരണവും
            </p>
          </div>

          {/* Practical Score Circle / Indicator */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/15">
            <div className="p-2.5 rounded-xl bg-white/20 text-[#FAF8F2]">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#DDEDE5]">Overall Practical Score</p>
              <p className="text-2xl font-black text-white">{akhlaqScore || 90}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usthad Guidance Remarks Highlight */}
      {akhlaqRecord?.teacherRemarks && (
        <Card className="p-5 bg-[#FAF8F2] border-[#C9A227]/40">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#C9A227]/20 text-[#9A7B1C] shrink-0 mt-0.5">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#9A7B1C]">
                Usthad Practical & Adab Observation
              </h4>
              <p className="text-sm font-medium text-[#1F2933] italic mt-1 leading-relaxed">
                "{akhlaqRecord.teacherRemarks}"
              </p>
              <p className="text-[10px] text-[#667085] mt-1.5">
                Evaluated by Usthad on {formatDate(akhlaqRecord.evaluatedDate)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Practical Dimensions Cards */}
      <div>
        <h3 className="text-base font-bold text-[#1F2933] mb-4">
          Core Pillars of Practical Assessment ({categories.length} Dimensions)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(category => {
            const scoreItem = akhlaqRecord?.scores ? akhlaqRecord.scores[category.id] : undefined;
            const level: AkhlaqLevel = scoreItem?.level || 'Excellent';

            return (
              <Card key={category.id} className="p-5 hover:border-[#0F6B50] transition-all">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center shrink-0">
                      {getCategoryIcon(category.id)}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-[#1F2933]">{category.title}</h4>
                      <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">{category.titleMalayalam}</p>
                    </div>
                  </div>
                  {getLevelBadge(level)}
                </div>

                <p className="text-xs text-[#667085] leading-relaxed mb-3">
                  {category.description}
                </p>

                {scoreItem?.remarks && (
                  <div className="p-2.5 rounded-xl bg-[#FAF8F2] border border-[#E3EAE6] text-xs text-[#1F2933] italic">
                    "{scoreItem.remarks}"
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default AkhlaqView;
