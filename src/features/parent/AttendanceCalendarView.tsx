import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar
} from 'lucide-react';
import { formatDate, getStatusBadgeClass } from '../../utils/formatters';
import { clsx } from 'clsx';

export const AttendanceCalendarView: React.FC = () => {
  const { selectedChildId, getStudentSummary, attendance } = useData();
  const [selectedMonth, setSelectedMonth] = useState('2026-08');

  const summary = getStudentSummary(selectedChildId);
  if (!summary) return null;

  const { student, attendancePercentage } = summary;
  const studentAttendance = attendance.filter(a => a.studentId === student.id);

  // Filter for selected month
  const monthlyRecords = studentAttendance.filter(a => a.date.startsWith(selectedMonth));

  const presentCount = monthlyRecords.filter(r => r.status === 'PRESENT').length;
  const absentCount = monthlyRecords.filter(r => r.status === 'ABSENT').length;
  const lateCount = monthlyRecords.filter(r => r.status === 'LATE').length;
  const totalDays = monthlyRecords.length;

  // Generate calendar days for August 2026
  const daysInMonth = 31;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const dateStr = `${selectedMonth}-${dayStr}`;
    const record = monthlyRecords.find(r => r.date === dateStr);
    
    // Check day of week for 2026-08
    const dateObj = new Date(dateStr);
    const isFriday = dateObj.getDay() === 5; // Friday Madrasa weekend in Kerala

    return {
      dayNum,
      dateStr,
      record,
      isFriday,
      isFuture: dateObj > new Date("2026-08-16")
    };
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <CalendarCheck2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Attendance Register & Calendar
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Daily attendance status for <strong className="text-[#1F2933]">{student.name}</strong> (Class {student.class})
          </p>
        </div>

        <div className="bg-[#FAF8F2] px-4 py-3 rounded-2xl border border-[#E3EAE6] text-center sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Term Attendance Rate</p>
          <p className="text-2xl font-black text-[#0F6B50] mt-0.5">{attendancePercentage}%</p>
        </div>
      </div>

      {/* 4 Attendance Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card padding="sm" className="bg-[#FAF8F2]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Working Days</p>
          <p className="text-xl sm:text-2xl font-black text-[#1F2933] mt-1">{totalDays}</p>
          <p className="text-[10px] text-[#667085] mt-0.5">Recorded this month</p>
        </Card>

        <Card padding="sm" className="bg-emerald-50/70 border-emerald-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Present Days</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{presentCount}</p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">On time</p>
        </Card>

        <Card padding="sm" className="bg-rose-50/70 border-rose-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Absent Days</p>
          <p className="text-xl sm:text-2xl font-black text-rose-700 mt-1">{absentCount}</p>
          <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{absentCount === 0 ? 'Zero Absence' : 'Informed leave'}</p>
        </Card>

        <Card padding="sm" className="bg-amber-50/70 border-amber-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Late Arrivals</p>
          <p className="text-xl sm:text-2xl font-black text-amber-700 mt-1">{lateCount}</p>
          <p className="text-[10px] text-amber-600 font-semibold mt-0.5">{lateCount === 0 ? 'Punctual' : 'Late marked'}</p>
        </Card>
      </div>

      {/* Calendar Card */}
      <Card className="p-5 sm:p-6">
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E3EAE6]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0F6B50]" />
            <h3 className="text-base font-bold text-[#1F2933]">
              August 2026 Calendar
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedMonth('2026-07')}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors",
                selectedMonth === '2026-07' ? "bg-[#0F6B50] text-white" : "bg-[#FAF8F2] text-[#1F2933] hover:bg-[#DDEDE5]"
              )}
            >
              July
            </button>
            <button
              onClick={() => setSelectedMonth('2026-08')}
              className={clsx(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors",
                selectedMonth === '2026-08' ? "bg-[#0F6B50] text-white" : "bg-[#FAF8F2] text-[#1F2933] hover:bg-[#DDEDE5]"
              )}
            >
              August
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-5 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Present
          </span>
          <span className="flex items-center gap-1.5 text-rose-800 font-semibold">
            <span className="w-3 h-3 rounded-full bg-rose-500" /> Absent
          </span>
          <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
            <span className="w-3 h-3 rounded-full bg-amber-500" /> Late
          </span>
          <span className="flex items-center gap-1.5 text-gray-500 font-medium">
            <span className="w-3 h-3 rounded-full bg-gray-300" /> Friday / Holiday
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-[11px] font-extrabold text-[#667085] uppercase tracking-wider py-1">
              {d}
            </div>
          ))}

          {daysArray.map(item => {
            let statusBg = "bg-white border-[#E3EAE6] text-[#1F2933]";
            let statusDot = null;

            if (item.isFriday) {
              statusBg = "bg-gray-100/70 text-gray-400 border-gray-200";
            } else if (item.isFuture) {
              statusBg = "bg-white/40 text-gray-300 border-dashed border-gray-200";
            } else if (item.record) {
              if (item.record.status === 'PRESENT') {
                statusBg = "bg-emerald-50 border-emerald-300 text-emerald-900 font-extrabold";
                statusDot = <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mx-auto mt-0.5" />;
              } else if (item.record.status === 'ABSENT') {
                statusBg = "bg-rose-50 border-rose-300 text-rose-900 font-extrabold";
                statusDot = <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mx-auto mt-0.5" />;
              } else if (item.record.status === 'LATE') {
                statusBg = "bg-amber-50 border-amber-300 text-amber-900 font-extrabold";
                statusDot = <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mx-auto mt-0.5" />;
              }
            }

            return (
              <div
                key={item.dayNum}
                className={clsx(
                  "p-2 sm:p-3 rounded-2xl border text-xs sm:text-sm flex flex-col items-center justify-between min-h-[50px] sm:min-h-[60px] transition-all",
                  statusBg
                )}
              >
                <span>{item.dayNum}</span>
                {statusDot}
                {item.isFriday && <span className="text-[9px] text-gray-400 font-medium">Holiday</span>}
              </div>
            );
          })}
        </div>
      </Card>

    </div>
  );
};
