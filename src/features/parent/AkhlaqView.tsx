import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { practicalCriteriaService } from '../../services/practicalCriteriaService';
import parentService, { ChildPracticalResponse } from '../../services/parentService';
import { AkhlaqCategoryMeta, AKHLAQ_CATEGORIES } from '../../data/madrasaCurriculum';
import { AkhlaqLevel, AkhlaqRecord } from '../../types';
import {
  HeartHandshake,
  ShieldCheck,
  Heart,
  Sparkles,
  Users,
  CheckCircle2,
  Award,
  Star,
  BookOpen,
  Calendar,
  Layers,
  TrendingUp,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const AkhlaqView: React.FC = () => {
  const { selectedChildId, getStudentSummary, akhlaqRecords } = useData();
  const [categories, setCategories] = useState<AkhlaqCategoryMeta[]>([]);
  const [practicalData, setPracticalData] = useState<ChildPracticalResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('ALL');

  useEffect(() => {
    setCategories(practicalCriteriaService.getAll());
  }, []);

  // Fetch complete child practical report directly from API on student change
  useEffect(() => {
    let active = true;
    if (!selectedChildId) {
      setPracticalData(null);
      return;
    }

    setIsLoading(true);
    parentService
      .getChildPractical(selectedChildId)
      .then((res) => {
        if (active) {
          setPracticalData(res);
        }
      })
      .catch((err) => {
        console.error('Failed to load child practical records:', err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedChildId]);

  const summary = getStudentSummary(selectedChildId);
  const student = summary?.student;
  const storeAkhlaqScore = summary?.akhlaqScore ?? 0;

  // Build unified, deduplicated list of all monthly evaluation records for this student
  const allMonthlyRecords = useMemo<AkhlaqRecord[]>(() => {
    if (!student) return [];
    const targetId = String(student.id || (student as any)._id || '');

    // 1. Records from DataContext / Zustand store
    const recordsFromStore = akhlaqRecords.filter(
      (a) => String(a.studentId) === targetId
    );

    // 2. Records from direct API practicalData response
    const rawEvaluations: any[] = Array.isArray(practicalData?.evaluations) && practicalData.evaluations.length > 0
      ? practicalData.evaluations
      : Array.isArray(practicalData?.report?.recentEvaluations)
      ? practicalData.report.recentEvaluations
      : [];

    const recordsFromApi = rawEvaluations.map((ev: any) => {
      const evDate = ev.date ? new Date(ev.date).toISOString().split('T')[0] : '';
      const monthKey = ev.month || (evDate ? evDate.slice(0, 7) : '');

      const scoresMap: Record<string, any> = {};
      (ev.scores || []).forEach((s: any) => {
        const key = s.category || s.subjectName || s.practicalSubjectId || 'Practical';
        const scoreVal = typeof s.score === 'number' ? s.score : 0;
        const maxScoreVal = typeof s.maxScore === 'number' && s.maxScore > 0 ? s.maxScore : 5;
        const scorePct = maxScoreVal > 0 ? (scoreVal / maxScoreVal) * 100 : 0;
        const level: AkhlaqLevel =
          scorePct >= 90
            ? 'Excellent'
            : scorePct >= 75
            ? 'Very Good'
            : scorePct >= 50
            ? 'Good'
            : scorePct >= 35
            ? 'Developing'
            : 'Needs Attention';

        const scoreData = {
          category: key,
          categoryMalayalam: s.subjectNameMalayalam || s.categoryMalayalam || '',
          level,
          score: scoreVal,
          maxScore: maxScoreVal,
          remarks: s.remarks || '',
          practicalSubjectId: s.practicalSubjectId || '',
        };

        scoresMap[key] = scoreData;
        if (s.practicalSubjectId) {
          scoresMap[s.practicalSubjectId] = scoreData;
        }
      });

      return {
        id: ev._id?.toString?.() || ev.id || `eval-${targetId}-${monthKey}`,
        studentId: targetId,
        evaluatedDate: evDate,
        overallScore: typeof ev.overallScore === 'number' ? ev.overallScore : 0,
        scores: scoresMap,
        teacherRemarks: ev.overallRemarks || '',
        teacherId: ev.evaluatedById?._id || ev.evaluatedById?.name || '',
        term: ev.term || monthKey || 'Monthly Practical',
        month: monthKey,
        year: ev.year,
        monthNumber: ev.monthNumber,
      } as AkhlaqRecord;
    });

    // 3. Deduplicate by month key (or ID) prioritizing the most complete record
    const mergedMap = new Map<string, AkhlaqRecord>();
    for (const rec of [...recordsFromApi, ...recordsFromStore]) {
      const key = rec.month || rec.term || rec.id;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, rec);
      } else {
        const existing = mergedMap.get(key)!;
        // Keep the one with more detailed scores
        const existingCount = Object.keys(existing.scores || {}).length;
        const newCount = Object.keys(rec.scores || {}).length;
        if (newCount > existingCount) {
          mergedMap.set(key, rec);
        }
      }
    }

    const list = Array.from(mergedMap.values());

    // 4. Sort chronologically descending (latest month first)
    list.sort((a, b) => {
      const getKey = (item: AkhlaqRecord) => {
        if (item.year && item.monthNumber) return item.year * 100 + item.monthNumber;
        if (item.month && typeof item.month === 'string' && item.month.includes('-')) {
          const parts = item.month.split('-').map(Number);
          if (parts[0] && parts[1]) return parts[0] * 100 + parts[1];
        }
        const d = item.evaluatedDate ? new Date(item.evaluatedDate) : new Date(0);
        return d.getFullYear() * 100 + (d.getMonth() + 1);
      };
      return getKey(b) - getKey(a);
    });

    return list;
  }, [student, akhlaqRecords, practicalData]);

  // Overall average score calculation
  const cumulativeAverageScore = useMemo(() => {
    if (typeof practicalData?.report?.averageScore === 'number' && practicalData.report.averageScore > 0) {
      return practicalData.report.averageScore;
    }
    if (allMonthlyRecords.length > 0) {
      const sum = allMonthlyRecords.reduce((acc, r) => acc + (r.overallScore || 0), 0);
      return Math.round(sum / allMonthlyRecords.length);
    }
    return storeAkhlaqScore;
  }, [practicalData, allMonthlyRecords, storeAkhlaqScore]);

  // Latest month record
  const latestRecord = allMonthlyRecords[0] || null;

  // Filtered monthly records based on user's month selector
  const displayedMonthlyRecords = useMemo(() => {
    if (selectedMonthKey === 'ALL') return allMonthlyRecords;
    return allMonthlyRecords.filter(
      (r) => (r.month || r.term || r.id) === selectedMonthKey
    );
  }, [allMonthlyRecords, selectedMonthKey]);

  if (!summary || !student) return null;

  const getCategoryIcon = (cat: string) => {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('discipline') || lower.includes('shikshanam')) return <ShieldCheck className="w-5 h-5" />;
    if (lower.includes('respect') || lower.includes('adab')) return <Heart className="w-5 h-5" />;
    if (lower.includes('clean') || lower.includes('taharah')) return <Sparkles className="w-5 h-5" />;
    if (lower.includes('cooperation') || lower.includes('sahakaram')) return <Users className="w-5 h-5" />;
    if (lower.includes('responsibility') || lower.includes('utharavaditham')) return <CheckCircle2 className="w-5 h-5" />;
    if (lower.includes('participation') || lower.includes('pankalitham')) return <Award className="w-5 h-5" />;
    if (lower.includes('quran') || lower.includes('book') || lower.includes('kitab')) return <BookOpen className="w-5 h-5" />;
    if (lower.includes('salah') || lower.includes('namaskaram')) return <HeartHandshake className="w-5 h-5" />;
    return <Sparkles className="w-5 h-5" />;
  };

  const getLevelBadge = (level: AkhlaqLevel) => {
    switch (level) {
      case 'Excellent':
        return (
          <span className="bg-[#DDEDE5] text-[#084C3A] border border-[#bbdcd0] font-bold px-2.5 py-0.5 rounded-full text-xs shrink-0">
            Excellent ★★★
          </span>
        );
      case 'Very Good':
        return (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-xs shrink-0">
            Very Good ★★
          </span>
        );
      case 'Good':
        return (
          <span className="bg-blue-50 text-blue-800 border border-blue-200 font-bold px-2.5 py-0.5 rounded-full text-xs shrink-0">
            Good ★
          </span>
        );
      case 'Developing':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2.5 py-0.5 rounded-full text-xs shrink-0">
            Developing
          </span>
        );
      default:
        return (
          <span className="bg-rose-50 text-rose-800 border border-rose-200 font-bold px-2.5 py-0.5 rounded-full text-xs shrink-0">
            Needs Attention
          </span>
        );
    }
  };

  // Helper to extract clean array of dimension score items from an AkhlaqRecord
  const getRecordDimensionItems = (record: AkhlaqRecord) => {
    if (!record.scores || Object.keys(record.scores).length === 0) {
      // Fallback to standard categories if no individual scores
      return categories.length > 0 ? categories : AKHLAQ_CATEGORIES;
    }

    const seen = new Set<string>();
    const items: Array<{
      id: string;
      title: string;
      titleMalayalam?: string;
      level: AkhlaqLevel;
      score?: number;
      maxScore?: number;
      remarks?: string;
    }> = [];

    for (const [key, val] of Object.entries(record.scores as Record<string, any>)) {
      if (!val) continue;
      const title = val.category || key;
      const cleanKey = title.toLowerCase().trim();
      if (!seen.has(cleanKey)) {
        seen.add(cleanKey);
        items.push({
          id: key,
          title,
          titleMalayalam: val.categoryMalayalam || '',
          level: val.level || 'Excellent',
          score: val.score,
          maxScore: val.maxScore || 5,
          remarks: val.remarks || '',
        });
      }
    }

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-[#0F6B50] via-[#0C5842] to-[#084C3A] rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-[#0F6B50]/15">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A227] bg-white/10 px-3 py-1 rounded-full inline-block mb-2">
              Akhlaq & Adab Portfolio • പ്രായോഗിക സംസ്കരണം
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Practical Score & Character Development
            </h1>
            <p className="font-malayalam text-xs sm:text-sm text-[#DDEDE5] font-semibold">
              സ്വഭാവ രൂപീകരണവും പ്രതിമാസ പ്രായോഗിക മൂല്യനിർണ്ണയവും
            </p>
          </div>

          {/* Practical Score Indicator Cards */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Overall Cumulative Average */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/15">
              <div className="p-2.5 rounded-xl bg-white/20 text-[#FAF8F2]">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#DDEDE5]">
                  Cumulative Score
                </p>
                <p className="text-2xl font-black text-white">{cumulativeAverageScore}%</p>
              </div>
            </div>

            {/* Total Evaluated Months */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/15">
              <div className="p-2.5 rounded-xl bg-white/20 text-[#FAF8F2]">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#DDEDE5]">
                  Months Evaluated
                </p>
                <p className="text-2xl font-black text-white">{allMonthlyRecords.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Month Selection / History Filter Toolbar */}
      {allMonthlyRecords.length > 0 && (
        <Card className="p-4 bg-white border-[#E3EAE6]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0F6B50]" />
              <span className="text-xs font-bold text-[#1F2933] uppercase tracking-wider">
                Filter by Month:
              </span>
            </div>

            {/* Month Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedMonthKey('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 ${
                  selectedMonthKey === 'ALL'
                    ? 'bg-[#0F6B50] text-white shadow-xs'
                    : 'bg-[#FAF8F2] text-[#667085] hover:bg-[#DDEDE5] hover:text-[#0F6B50]'
                }`}
              >
                All Months ({allMonthlyRecords.length})
              </button>

              {allMonthlyRecords.map((rec) => {
                const key = rec.month || rec.term || rec.id;
                const isSelected = selectedMonthKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedMonthKey(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#0F6B50] text-white shadow-xs'
                        : 'bg-[#FAF8F2] text-[#667085] hover:bg-[#DDEDE5] hover:text-[#0F6B50]'
                    }`}
                  >
                    <span>{rec.term || rec.month}</span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-[#DDEDE5] text-[#084C3A]'
                      }`}
                    >
                      {rec.overallScore}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Loading Indicator */}
      {isLoading && allMonthlyRecords.length === 0 && (
        <div className="py-12 text-center text-xs text-[#667085] flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-[#0F6B50] border-t-transparent rounded-full animate-spin" />
          <span>Loading student practical evaluation records...</span>
        </div>
      )}

      {/* Empty State: No monthly records recorded yet */}
      {!isLoading && allMonthlyRecords.length === 0 && (
        <Card className="p-8 text-center bg-white border-[#E3EAE6]">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#1F2933]">
            No Practical Evaluations Recorded Yet
          </h3>
          <p className="text-xs text-[#667085] mt-1 max-w-md mx-auto">
            The Muallim will evaluate practical dimensions (Salah discipline, Adab, Quran recitation, and Islamic manners) each month. Past and current records will be listed here automatically.
          </p>
        </Card>
      )}

      {/* Historical Monthly Breakdown: Render Each Evaluated Month */}
      {displayedMonthlyRecords.map((monthlyRec, index) => {
        const dimensionItems = getRecordDimensionItems(monthlyRec);
        const monthTitle = monthlyRec.term || monthlyRec.month || `Evaluation #${allMonthlyRecords.length - index}`;
        const isLatest = index === 0 && selectedMonthKey === 'ALL';

        return (
          <div key={monthlyRec.id || `${monthlyRec.month}-${index}`} className="space-y-4">
            {/* Month Header Banner Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-[#FAF8F2] to-white rounded-2xl border border-[#E3EAE6] shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center shrink-0 font-black">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-[#1F2933]">
                      {monthTitle}
                    </h3>
                    {isLatest && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0F6B50] text-white">
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#667085]">
                    {monthlyRec.evaluatedDate
                      ? `Evaluated on ${formatDate(monthlyRec.evaluatedDate)}`
                      : 'Monthly Assessment'}
                  </p>
                </div>
              </div>

              {/* Month Score & Rating Badge */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-[#667085] tracking-wider">
                    Monthly Score
                  </p>
                  <p className="text-xl font-black text-[#0F6B50]">
                    {monthlyRec.overallScore}%
                  </p>
                </div>
                {getLevelBadge(
                  monthlyRec.overallScore >= 90
                    ? 'Excellent'
                    : monthlyRec.overallScore >= 75
                    ? 'Very Good'
                    : monthlyRec.overallScore >= 50
                    ? 'Good'
                    : monthlyRec.overallScore >= 35
                    ? 'Developing'
                    : 'Needs Attention'
                )}
              </div>
            </div>

            {/* Usthad Guidance Remarks Highlight for this Month */}
            {monthlyRec.teacherRemarks && (
              <Card className="p-4 bg-[#FAF8F2] border-[#C9A227]/40">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#C9A227]/20 text-[#9A7B1C] shrink-0 mt-0.5">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#9A7B1C]">
                      Usthad Practical & Adab Observation ({monthTitle})
                    </h4>
                    <p className="text-xs sm:text-sm font-medium text-[#1F2933] italic mt-1 leading-relaxed">
                      "{monthlyRec.teacherRemarks}"
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Practical Dimensions Grid for this Month */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {dimensionItems.map((dim: any) => {
                const earned = typeof dim.score === 'number' ? dim.score : undefined;
                const max = typeof dim.maxScore === 'number' && dim.maxScore > 0 ? dim.maxScore : 5;
                const pct = earned !== undefined ? Math.round((earned / max) * 100) : 0;

                return (
                  <Card
                    key={`${monthlyRec.id}-${dim.id || dim.title}`}
                    className="p-4 hover:border-[#0F6B50] transition-all bg-white"
                  >
                    <div className="flex items-start justify-between gap-2.5 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center shrink-0">
                          {getCategoryIcon(dim.id || dim.title)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-[#1F2933] truncate">
                            {dim.title}
                          </h4>
                          {dim.titleMalayalam && (
                            <p className="font-malayalam text-[11px] text-[#0F6B50] font-semibold truncate">
                              {dim.titleMalayalam}
                            </p>
                          )}
                        </div>
                      </div>
                      {getLevelBadge(dim.level || 'Excellent')}
                    </div>

                    {/* Progress Bar & Numeric Score */}
                    {earned !== undefined && (
                      <div className="space-y-1.5 my-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-[#667085] font-semibold">
                            Earned Score:
                          </span>
                          <span className="font-extrabold text-[#0F6B50]">
                            {earned} / {max} Marks ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#E3EAE6] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#0F6B50] h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Dimension-specific Remarks */}
                    {dim.remarks && (
                      <div className="mt-2 p-2 rounded-lg bg-[#FAF8F2] border border-[#E3EAE6] text-[11px] text-[#1F2933] italic">
                        "{dim.remarks}"
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AkhlaqView;