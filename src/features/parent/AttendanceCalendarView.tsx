import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  CalendarCheck2,
  Calendar
} from 'lucide-react';
import { clsx } from 'clsx';
import { getCalendarMonthCells, getCurrentMonthKey, getLocalDateFromKey, getMonthLabel } from '../../utils/calendar';

export const AttendanceCalendarView: React.FC = () => {
  const { selectedChildId, getStudentSummary, attendance } = useData();
  const [selectedMonth, setSelectedMonth] = useState('');

  const summary = getStudentSummary(selectedChildId);
  const student = summary?.student;
  const studentId = student?.id;
  const attendancePercentage = summary?.attendancePercentage ?? 0;
  const studentAttendance = useMemo(
    () => studentId ? attendance.filter(a => a.studentId === studentId) : [],
    [attendance, studentId]
  );

  const availableMonths = useMemo(() => {
    const currentMonth = getCurrentMonthKey();
    return Array.from(new Set(
      studentAttendance
        .map(record => record.date.slice(0, 7))
        .filter(month => month < currentMonth)
    )).sort((a, b) => b.localeCompare(a));
  }, [studentAttendance]);

  useEffect(() => {
    if (availableMonths.length === 0) {
      setSelectedMonth('');
      return;
    }
    if (!selectedMonth || !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // Filter for selected month
  const monthlyRecords = studentAttendance.filter(a => a.date.startsWith(selectedMonth));

  const presentCount = monthlyRecords.filter(r => r.status === 'PRESENT').length;
  const absentCount = monthlyRecords.filter(r => r.status === 'ABSENT').length;
  const leaveCount = monthlyRecords.filter(r => r.status === 'LEAVE').length;
  const holidayCount = monthlyRecords.filter(r => r.status === 'HOLIDAY').length;
  const totalDays = monthlyRecords.length;

  const recordsByDate = useMemo(() => {
    return new Map(monthlyRecords.map(record => [record.date, record]));
  }, [monthlyRecords]);

  const daysArray = getCalendarMonthCells(selectedMonth).map((cell) => {
    if (!cell.dayNum) return { ...cell, record: undefined, isFriday: false, isFuture: false };

    const record = recordsByDate.get(cell.dateKey);
    const dateObj = getLocalDateFromKey(cell.dateKey);
    const isFriday = cell.weekday === 5; // Friday Madrasa weekend in Kerala

    return {
      ...cell,
      record,
      isFriday,
      isFuture: dateObj > new Date()
    };
  });

  if (!summary || !student) {
    return (
      <EmptyState
        title="No child selected."
        description="Select an enrolled child to view completed attendance reports."
        icon={<CalendarCheck2 className="w-7 h-7" />}
      />
    );
  }

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
            Completed monthly attendance reports for <strong className="text-[#1F2933]">{student.name}</strong> (Class {student.class || 'not assigned'})
          </p>
        </div>

        <div className="bg-[#FAF8F2] px-4 py-3 rounded-2xl border border-[#E3EAE6] text-center sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Completed Months Rate</p>
          <p className="text-2xl font-black text-[#0F6B50] mt-0.5">{attendancePercentage}%</p>
        </div>
      </div>

      {availableMonths.length === 0 ? (
        <EmptyState
          title="No completed attendance reports available yet."
          description="Current-month attendance will become visible after the month is complete."
          icon={<CalendarCheck2 className="w-7 h-7" />}
        />
      ) : (
      <>
        {/* 4 Attendance Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card padding="sm" className="bg-[#FAF8F2]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Working Days</p>
          <p className="text-xl sm:text-2xl font-black text-[#1F2933] mt-1">{totalDays}</p>
          <p className="text-[10px] text-[#667085] mt-0.5">Recorded in selected month</p>
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
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Leave Days</p>
          <p className="text-xl sm:text-2xl font-black text-amber-700 mt-1">{leaveCount}</p>
          <p className="text-[10px] text-amber-600 font-semibold mt-0.5">{leaveCount === 0 ? 'No leave' : 'Approved leave'}</p>
        </Card>

        <Card padding="sm" className="bg-slate-100 border-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">Holiday</p>
          <p className="text-xl sm:text-2xl font-black text-slate-700 mt-1">{holidayCount}</p>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Not counted absent</p>
        </Card>
        </div>

        {/* Calendar Card */}
        <Card className="p-5 sm:p-6">
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E3EAE6]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0F6B50]" />
            <h3 className="text-base font-bold text-[#1F2933]">
              {getMonthLabel(selectedMonth)} Calendar
            </h3>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {availableMonths.slice(0, 6).map(month => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={clsx(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors",
                  selectedMonth === month
                    ? "bg-[#0F6B50] text-white"
                    : "bg-[#FAF8F2] text-[#1F2933] hover:bg-[#DDEDE5]"
                )}
              >
                {getMonthLabel(month)}
              </button>
            ))}
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
            <span className="w-3 h-3 rounded-full bg-amber-500" /> Leave
          </span>
          <span className="flex items-center gap-1.5 text-gray-500 font-medium">
            <span className="w-3 h-3 rounded-full bg-gray-300" /> Holiday
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
            if (!item.dayNum) {
              return <div key={item.key} className="min-h-[50px] sm:min-h-[60px]" aria-hidden="true" />;
            }

            let statusBg = "bg-white border-[#E3EAE6] text-[#1F2933]";
            let statusDot = null;

            if (item.isFuture) {
              statusBg = "bg-white/40 text-gray-300 border-dashed border-gray-200";
            } else if (item.record) {
              if (item.record.status === 'PRESENT') {
                statusBg = "bg-emerald-50 border-emerald-300 text-emerald-900 font-extrabold";
                statusDot = <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mx-auto mt-0.5" />;
              } else if (item.record.status === 'ABSENT') {
                statusBg = "bg-rose-50 border-rose-300 text-rose-900 font-extrabold";
                statusDot = <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mx-auto mt-0.5" />;
              } else if (item.record.status === 'LEAVE') {
                statusBg = "bg-amber-50 border-amber-300 text-amber-900 font-extrabold";
                statusDot = <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mx-auto mt-0.5" />;
              } else if (item.record.status === 'HOLIDAY') {
                statusBg = "bg-gray-100/70 text-gray-500 border-gray-200 font-extrabold";
                statusDot = <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mx-auto mt-0.5" />;
              }
            } else if (item.isFriday) {
              statusBg = "bg-gray-100/70 text-gray-400 border-gray-200";
            }

            return (
              <div
                key={item.key}
                className={clsx(
                  "p-2 sm:p-3 rounded-2xl border text-xs sm:text-sm flex flex-col items-center justify-between min-h-[50px] sm:min-h-[60px] transition-all",
                  statusBg
                )}
              >
                <span>{item.dayNum}</span>
                {statusDot}
                {(item.record?.status === 'HOLIDAY' || (!item.record && item.isFriday)) && (
                  <span className="text-[9px] text-gray-400 font-medium">Holiday</span>
                )}
              </div>
            );
          })}
        </div>
        </Card>
      </>
      )}

    </div>
  );
};
