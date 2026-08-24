import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ProgressGauge } from '../../components/charts/ProgressGauge';
import { QURAN_SURAHS } from '../../data/quranSurahs';
import {
  Award
} from 'lucide-react';

export const QuranHifzView: React.FC = () => {
  const { selectedChildId, getStudentSummary, quranRecords } = useData();
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);

  const summary = getStudentSummary(selectedChildId);
  if (!summary) return null;

  const { student, quranProgress } = summary;
  const quranRecord = quranRecords.find(q => q.studentId === student.id);

  // Match current surah or fallback gracefully to Al-An'am
  const currentSurah = QURAN_SURAHS.find(s => s.number === (quranRecord?.currentSurahNumber || 6)) || {
    number: 6,
    name: "Al-An'am",
    arabicName: "الأنعام",
    englishTranslation: "The Cattle",
    totalAyahs: 165,
    juz: 7
  };

  const currentJuz = currentSurah?.juz || 7;
  const currentAyah = quranRecord?.currentAyahStart || 42;
  const activeDisplayJuz = selectedJuz !== null ? selectedJuz : currentJuz;

  const scrollToFullProgress = () => {
    const el = document.getElementById('completed-hifz-shelf');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0F6B50] via-[#0c5641] to-[#084C3A] rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-[#0F6B50]/15 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A227] bg-white/10 px-3 py-1 rounded-full inline-block">
              Hifz Tracker
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Hifz Progress
            </h1>
            <p className="font-malayalam text-xs sm:text-sm text-[#DDEDE5] font-semibold">
              ഖുർആൻ പാരായണം, തജ്‌വീദ് & ഹിഫ്ള് പുരോഗതി
            </p>
            <p className="text-xs text-[#DDEDE5]/90">
              Student: <strong className="text-white">{student.name}</strong> • Class {student.class}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <ProgressGauge
              score={quranProgress}
              size={90}
              strokeWidth={8}
              variant="gold"
              label="Recitation Mastery"
            />
          </div>
        </div>
      </div>

      {/* Hifz Tracking Main Component (Exact match to requested design) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F2933] tracking-tight">
            Hifz tracking
          </h2>
          <button
            onClick={scrollToFullProgress}
            className="text-sm sm:text-base font-medium text-[#1F2933] hover:text-[#0F6B50] underline underline-offset-4 cursor-pointer transition-colors"
          >
            Full progress
          </button>
        </div>

        <div className="bg-[#F5EFEB] rounded-3xl p-6 sm:p-8 border border-[#E5DDD0] shadow-sm">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-arabic text-2xl sm:text-4xl font-bold text-[#1F2933] leading-none">
                {currentSurah.arabicName.startsWith('سورة') ? currentSurah.arabicName : `سورة ${currentSurah.arabicName}`}
              </h3>
              <p className="text-sm sm:text-base text-[#6B655B] font-medium mt-1 sm:mt-2">
                Surah {currentSurah.name}
              </p>
            </div>
          </div>

          {/* 30 Juz Numbered Grid (3 rows x 10 cols) - Small & Compact */}
          <div className="my-5 sm:my-6">
            <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
                const isCompleted = juzNum < currentJuz;
                const isActive = juzNum === currentJuz;
                const isSelected = juzNum === activeDisplayJuz;

                return (
                  <button
                    key={juzNum}
                    onClick={() => setSelectedJuz(juzNum === activeDisplayJuz ? null : juzNum)}
                    className={`h-7 sm:h-9 md:h-10 rounded-md sm:rounded-lg flex items-center justify-center text-[10px] sm:text-xs md:text-sm font-semibold cursor-pointer transition-all duration-150 select-none ${
                      isActive
                        ? 'bg-[#1658c9]  text-white shadow-sm ring-2 ring-[#D99020]/40 scale-105 z-10'
                        : isCompleted
                        ? 'bg-[#607D63] text-white hover:bg-[#536E56]'
                        : 'bg-[#E3DDD3] text-[#706A62] hover:bg-[#D7D0C5]'
                    } ${isSelected && !isActive ? 'ring-2 ring-[#1F2933]/30' : ''}`}
                    title={`Juz ${juzNum} ${isCompleted ? '(Completed)' : isActive ? '(Currently Memorizing)' : '(Upcoming)'}`}
                  >
                    {juzNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2 Bottom Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* TARGET */}
            <div className="bg-[#1658c9] rounded-2xl p-4 sm:p-5 border border-[#E5DDD0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#fdfcfc]">
                TARGET
              </p>
            </div>
            
            {/* COMPLETED */}
            <div className="bg-[#064821] rounded-2xl p-4 sm:p-5 border border-[#E5DDD0]/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#faf9f7]">
                COMPLETED
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Surahs Memorized Shelf */}
      <Card id="completed-hifz-shelf" className="p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E3EAE6]">
          <div>
            <h3 className="text-base font-bold text-[#1F2933] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#C9A227]" />
              Completed Hifz Surahs ({quranRecord?.hifzSurahsCount || 28} / 114)
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">Surahs memorized with verified recitation</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {QURAN_SURAHS.slice(20, 36).map(surah => (
            <div
              key={surah.number}
              className="p-2.5 rounded-xl bg-[#FAF8F2] border border-[#E3EAE6] flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-[#1F2933] truncate">{surah.name}</p>
                <p className="text-[10px] text-[#667085]">{surah.totalAyahs} Ayahs</p>
              </div>
              <span className="w-5 h-5 rounded-full bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center text-[10px] font-bold shrink-0">
                ✓
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
