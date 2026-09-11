import React, { useEffect, useMemo, useState } from 'react';
import { Award, BookOpenCheck, CalendarDays } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useData } from '../../context/DataContext';
import parentService, { type ChildHifzResponse } from '../../services/parentService';
import { formatDate } from '../../utils/formatters';

type AyahState = 'completed' | 'targeted' | 'idle';

const getAyahStateClasses = (state: AyahState) => {
  if (state === 'completed') return 'bg-[#0F6B50] text-white border-[#0F6B50]';
  if (state === 'targeted') return 'bg-[#1658c9] text-white border-[#1658c9]';
  return 'bg-[#E7EBEE] text-[#667085] border-[#D0D5DD]';
};

const getTargetedAyahs = (target: ChildHifzResponse['targets'][number]['target']) => {
  const ayahs = new Set<number>();
  for (const schedule of target.schedules || []) {
    for (let ayah = schedule.ayahFrom; ayah <= schedule.ayahTo; ayah += 1) {
      ayahs.add(ayah);
    }
  }

  if (ayahs.size === 0 && target.fromAyah && target.toAyah) {
    for (let ayah = target.fromAyah; ayah <= target.toAyah; ayah += 1) {
      ayahs.add(ayah);
    }
  }

  return ayahs;
};

export const QuranHifzView: React.FC = () => {
  const { selectedChildId, getStudentSummary } = useData();
  const [hifzData, setHifzData] = useState<ChildHifzResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const summary = getStudentSummary(selectedChildId);

  useEffect(() => {
    let cancelled = false;

    const loadHifz = async () => {
      if (!selectedChildId) {
        setHifzData(null);
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        const data = await parentService.getChildHifz(selectedChildId);
        if (!cancelled) {
          setHifzData(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setHifzData(null);
          setError(err?.message || 'Failed to load Hifz progress');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadHifz();

    return () => {
      cancelled = true;
    };
  }, [selectedChildId]);

  const totals = useMemo(() => {
    const allTargets = hifzData?.targets || [];
    return {
      targets: allTargets.length,
      completedTargets: allTargets.filter((item) => item.status === 'COMPLETED').length,
      completedAyahs: allTargets.reduce((sum, item) => sum + item.completedAyahs.length, 0),
    };
  }, [hifzData]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0F6B50] via-[#0A4D39] to-[#063326] rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-white/10 text-emerald-200">
                <BookOpenCheck className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Hifz Progress</h1>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 mt-2">
              Class targets and individual progress for the selected child
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2">
              <p className="text-[10px] font-bold text-emerald-100 uppercase">Targets</p>
              <p className="text-lg font-black">{totals.targets}</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2">
              <p className="text-[10px] font-bold text-emerald-100 uppercase">Completed</p>
              <p className="text-lg font-black">{totals.completedTargets}</p>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 px-3 py-2">
              <p className="text-[10px] font-bold text-emerald-100 uppercase">Ayahs</p>
              <p className="text-lg font-black">{totals.completedAyahs}</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#E3EAE6]">
          <div className="w-6 h-6 border-2 border-[#0F6B50] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#667085]">Loading Hifz progress...</p>
        </div>
      ) : error ? (
        <Card className="p-6 text-center border border-rose-200 bg-rose-50">
          <p className="text-sm font-bold text-rose-700">{error}</p>
        </Card>
      ) : !summary ? (
        <Card className="p-8 text-center bg-[#FAF8F2] border-2 border-dashed border-[#E3EAE6]">
          <Award className="w-10 h-10 mx-auto text-[#667085] opacity-60 mb-3" />
          <h2 className="text-sm font-extrabold text-[#1F2933]">No child selected or student not found.</h2>
        </Card>
      ) : (
        <div className="space-y-6">
          {(() => {
            const targets = hifzData?.targets || [];

            return (
              <Card className="p-5 sm:p-6 bg-white border border-[#E3EAE6]">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#E3EAE6]">
                  <div>
                    <h2 className="text-lg font-extrabold text-[#1F2933]">{summary.student.name}</h2>
                    <p className="text-xs text-[#667085]">{hifzData?.className || `Class ${summary.student.class}`}</p>
                  </div>
                  <Badge variant="green">{targets.length} Target{targets.length === 1 ? '' : 's'}</Badge>
                </div>

                {targets.length === 0 ? (
                  <div className="p-6 text-center bg-[#FAF8F2] border border-dashed border-[#E3EAE6] rounded-2xl">
                    <p className="text-sm font-bold text-[#667085]">No Hifz targets available for this class.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {targets.map((item, index) => {
                      const targetedAyahs = getTargetedAyahs(item.target);
                      const completedAyahs = new Set(item.completedAyahs);
                      const totalAyahs = item.target.totalAyahsToMemorize || targetedAyahs.size;
                      const ayahBoxes = Array.from({ length: totalAyahs }, (_, ayahIndex) => {
                        const ayah = ayahIndex + 1;
                        const state: AyahState = completedAyahs.has(ayah)
                          ? 'completed'
                          : targetedAyahs.has(ayah)
                          ? 'targeted'
                          : 'idle';
                        return { ayah, state };
                      });

                      return (
                        <div key={item.target.id} className="rounded-2xl bg-[#FAF8F2] border border-[#E3EAE6] p-4">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#0F6B50]">Target {index + 1}</p>
                              <h3 className="text-base sm:text-lg font-extrabold text-[#1F2933] mt-1">
                                {item.target.surahName || item.target.criteria}
                              </h3>
                              <p className="text-xs text-[#667085] mt-1">{item.target.criteria}</p>
                              <p className="text-xs text-[#667085] mt-1 flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-[#0F6B50]" />
                                {formatDate(item.target.startDate)} - {formatDate(item.target.endDate)}
                              </p>
                            </div>
                            <div className="text-left lg:text-right">
                              <p className="text-2xl font-black text-[#0F6B50]">{item.progressPercentage}%</p>
                              <p className="text-[11px] font-bold text-[#667085]">
                                {item.status === 'NOT_STARTED' ? 'Not Started' : item.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                              </p>
                            </div>
                          </div>

                          {ayahBoxes.length > 0 ? (
                            <div className="flex flex-wrap gap-2 sm:gap-2.5 mt-4">
                              {ayahBoxes.map(({ ayah, state }) => (
                                <div
                                  key={ayah}
                                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg border flex items-center justify-center text-xs sm:text-sm font-extrabold ${getAyahStateClasses(state)}`}
                                  title={`Ayah ${ayah}: ${state === 'completed' ? 'Completed' : state === 'targeted' ? 'Targeted' : 'Not targeted'}`}
                                >
                                  {ayah}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default QuranHifzView;
