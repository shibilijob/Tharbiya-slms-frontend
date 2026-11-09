import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAttendanceStore } from '../../stores';
import { parentService } from '../../services/parentService';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  CalendarCheck2,
  Calendar,
  History,
  CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';
import { getCalendarMonthCells, getCurrentMonthKey, getLocalDateFromKey, getMonthLabel } from '../../utils/calendar';

export const AttendanceCalendarView: React.FC = () => {
  const { selectedChildId, getStudentSummary, attendance } = useData();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [fetchedBacklogs, setFetchedBacklogs] = useState<any[]>([]);

  const summary = getStudentSummary(selectedChildId);
  const student = summary?.student;
  const studentId = student?.id;
  const attendancePercentage = summary?.attendancePercentage ?? 0;

  // Monthly backlog from store
  const storeBacklogs = useAttendanceStore((s) => s.monthlyBacklog);
  const studentStoreBacklogs = useMemo(
    () => (studentId ? storeBacklogs.filter(b => String(b.studentId) === String(studentId)) : []),
    [storeBacklogs, studentId]
  );

  // Fallback direct fetch if store backlogs not yet loaded
  useEffect(() => {
    if (!studentId) return;
    let active = true;
    parentService.getChildAttendanceBacklog(studentId)
      .then((data) => {
        if (active && Array.isArray(data)) {
          setFetchedBacklogs(data);
        }
      })
      .catch((err) => console.warn('Failed to load child attendance backlog:', err));
    return () => { active = false; };
  }, [studentId]);

  const activeBacklogs = useMemo(() => {
    if (studentStoreBacklogs.length > 0) return studentStoreBacklogs;
    return fetchedBacklogs;
  }, [studentStoreBacklogs, fetchedBacklogs]);

  const studentAttendance = useMemo(
    () => (studentId ? attendance.filter(a => String(a.studentId) === String(studentId)) : []),
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

  const hasBacklogs = activeBacklogs.length > 0;
  const hasDailyRecords = availableMonths.length > 0;

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
              Attendance Register & Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Attendance history for <strong className="text-[#1F2933]">{student.name}</strong> (Class {student.class || 'not assigned'})
          </p>
        </div>

        <div className="bg-[#FAF8F2] px-4 py-3 rounded-2xl border border-[#E3EAE6] text-center sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Overall Attendance Rate</p>
          <p className="text-2xl font-black text-[#0F6B50] mt-0.5">{attendancePercentage}%</p>
        </div>
      </div>

      {/* MONTHLY ATTENDANCE BACKLOG (PREVIOUS MONTHS) - TEXT/SUMMARY NUMBERS ONLY */}
      {hasBacklogs && (
        <Card className="p-5 sm:p-6 bg-white border border-[#E3EAE6] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#E3EAE6]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
                <History className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-[#1F2933]">
                  Past Months Attendance (Monthly Backlog)
                </h3>
                <p className="text-xs text-[#667085]">
                  Recorded working days and attended days for previous months
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#0F6B50] bg-[#DDEDE5] px-3 py-1 rounded-full self-start sm:self-auto">
              {activeBacklogs.length} Month{activeBacklogs.length === 1 ? '' : 's'} Recorded
            </span>
          </div>

          {/* Simple Clean Summary Cards - NO CALENDAR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activeBacklogs.map((b) => {
              const working = Number(b.totalWorkingDays) || 0;
              const attended = Number(b.attendedDays) || 0;
              const pct = working > 0 ? Math.round((attended / working) * 100) : 0;
              const label = b.monthName
                ? `${b.monthName} ${b.year}`
                : getMonthLabel(`${b.year}-${String(b.month).padStart(2, '0')}`);

              return (
                <div
                  key={b.id || `${b.year}-${b.month}`}
                  className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#E3EAE6] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-extrabold text-[#1F2933]">{label}</span>
                    <span className="text-xs font-black text-[#0F6B50] bg-[#DDEDE5] px-2 py-0.5 rounded-md">
                      {pct}%
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-[#E3EAE6]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#667085] font-medium">Present Days</span>
                      <span className="font-bold text-[#0F6B50]">{attended} Days</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#667085] font-medium">Total Working Days</span>
                      <span className="font-bold text-[#1F2933]">{working} Days</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#E3EAE6]/50">
                      <span className="text-[#667085] font-semibold">Attendance Ratio</span>
                      <span className="font-extrabold text-[#1F2933]">
                        {attended} / {working} Days
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {activeBacklogs.length > 1 && (
            <div className="mt-5 pt-4 border-t border-[#E3EAE6] flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-[#667085]">
              <span>
                Total Backlog Attended:{' '}
                <strong className="text-[#0F6B50]">
                  {activeBacklogs.reduce((sum, b) => sum + (Number(b.attendedDays) || 0), 0)}
                </strong>{' '}
                /{' '}
                <strong className="text-[#1F2933]">
                  {activeBacklogs.reduce((sum, b) => sum + (Number(b.totalWorkingDays) || 0), 0)} Days
                </strong>
              </span>
              <span>
                Backlog Average:{' '}
                <strong className="text-[#0F6B50]">
                  {(() => {
                    const totAtt = activeBacklogs.reduce((sum, b) => sum + (Number(b.attendedDays) || 0), 0);
                    const totWork = activeBacklogs.reduce((sum, b) => sum + (Number(b.totalWorkingDays) || 0), 0);
                    return totWork > 0 ? Math.round((totAtt / totWork) * 100) : 0;
                  })()}%
                </strong>
              </span>
            </div>
          )}
        </Card>
      )}

      {/* DAILY ATTENDANCE CALENDAR (FOR MONTHS WITH DAILY RECORDS) */}
      {!hasDailyRecords ? (
        !hasBacklogs ? (
          <EmptyState
            title="No completed attendance reports available yet."
            description="Attendance records will become visible once recorded by the Muallim."
            icon={<CalendarCheck2 className="w-7 h-7" />}
          />
        ) : (
          <Card className="p-5 text-center bg-[#FAF8F2] border border-[#E3EAE6]">
            <p className="text-xs text-[#667085]">
              Daily attendance calendar will be displayed for months with recorded daily roll calls.
            </p>
          </Card>
        )
      ) : (
      <>
        {/* 4 Attendance Summary Stats for Selected Month */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card padding="sm" className="bg-[#FAF8F2]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#667085]">Working Days</p>
          <p className="text-xl sm:text-2xl font-black text-[#1F2933] mt-1">{totalDays}</p>
          <p className="text-[10px] text-[#667085] mt-0.5">Recorded in {getMonthLabel(selectedMonth)}</p>
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
              {getMonthLabel(selectedMonth)} Daily Calendar
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
