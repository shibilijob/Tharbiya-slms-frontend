import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { useNotifications } from '../../context/NotificationContext';
import { useMyAttendanceStore } from '../../stores/myAttendanceStore';
import {
  CalendarDays,
  Download,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Palmtree,
  CalendarX,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028];

export const MyAttendanceView: React.FC = () => {
  const { showToast } = useNotifications();

  const {
    selectedYear,
    selectedMonth,
    data,
    isLoading,
    isDownloadingPdf,
    error,
    setSelectedYearMonth,
    fetchMyAttendance,
    downloadPdf,
  } = useMyAttendanceStore();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMyAttendance(selectedYear, selectedMonth);
  }, [fetchMyAttendance, selectedYear, selectedMonth]);

  const handleDownloadPdf = async () => {
    try {
      await downloadPdf(selectedYear, selectedMonth);
      showToast('Downloaded your monthly attendance report (PDF)!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to download monthly attendance PDF');
    }
  };

  const dailyRecords = data?.dailyRecords || [];
  const stats = data?.stats;
  const muallim = data?.muallim;

  // Filter daily records by search (day name or date)
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return dailyRecords;
    const q = searchQuery.toLowerCase();
    return dailyRecords.filter(
      (d) =>
        d.dateStr.includes(q) ||
        d.dayName.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        String(d.dayNumber).includes(q)
    );
  }, [dailyRecords, searchQuery]);

  const renderStatusBadge = (status: string, reason?: string | null) => {
    if (!status || status === 'NOT_RECORDED') {
      return (
        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200">
          Not Recorded
        </span>
      );
    }

    if (status === 'PRESENT') {
      return (
        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-300">
          Present
        </span>
      );
    }

    if (status === 'CL') {
      return (
        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold text-blue-900 bg-blue-50 border border-blue-300">
          CL (Casual Leave)
        </span>
      );
    }

    if (status === 'HPL') {
      return (
        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300">
          HPL (Half Pay Leave)
        </span>
      );
    }

    if (status === 'LLP') {
      return (
        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold text-rose-900 bg-rose-50 border border-rose-300">
          LLP (Leave W/O Pay)
        </span>
      );
    }

    if (status === 'HOLIDAY') {
      return (
        <div className="space-y-1">
          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold text-purple-900 bg-purple-50 border border-purple-300">
            Holiday
          </span>
          {reason && (
            <p
              className="text-[10px] text-purple-700 italic leading-tight max-w-[170px]"
              title={`Holiday Reason: ${reason}`}
            >
              "{reason}"
            </p>
          )}
        </div>
      );
    }

    return (
      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold text-[#1F2933] bg-gray-50 border border-gray-200">
        {status}
      </span>
    );
  };

  const hasAnyRecords = stats && (stats.totalScheduledShifts > 0 || stats.holidayShifts > 0 || (data?.markedDatesCount ?? 0) > 0);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E3EAE6] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
                <CalendarDays className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#1F2933]">
                  My Attendance Register
                </h2>
                <p className="text-xs text-[#667085] flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[#0F6B50]" />
                  Three-shift personal faculty attendance record (Read Only)
                </p>
              </div>
            </div>

            {/* Month & Year Selectors */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedYearMonth(selectedYear, Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border border-[#E3EAE6] text-xs sm:text-sm font-bold text-[#1F2933] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6B50]/30"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYearMonth(Number(e.target.value), selectedMonth)}
                className="px-3 py-1.5 rounded-xl border border-[#E3EAE6] text-xs sm:text-sm font-bold text-[#1F2933] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6B50]/30"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <button
                onClick={() => fetchMyAttendance(selectedYear, selectedMonth)}
                className="p-2 rounded-xl border border-[#E3EAE6] hover:bg-[#F3F7F5] text-[#667085] hover:text-[#1F2933] transition-colors ml-1"
                title="Refresh Attendance"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* PDF Download Button */}
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleDownloadPdf}
              isLoading={isDownloadingPdf}
              leftIcon={<Download className="w-4 h-4" />}
              className="bg-[#0F6B50] hover:bg-[#084C3A] text-white font-extrabold shadow-md hover:shadow-lg w-full sm:w-auto text-xs sm:text-sm"
            >
              Download Monthly Attendance PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Muallim Profile Summary Strip */}
      {muallim && (
        <div className="bg-[#FAF8F2] p-4 rounded-2xl border border-[#E3EAE6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={muallim.name} size="md" />
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#1F2933]">{muallim.name}</h3>
              <p className="text-xs text-[#667085] mt-0.5">
                {muallim.designation || 'Muallim'} • Mobile: {muallim.phone}
                {muallim.assignedClasses && muallim.assignedClasses.length > 0 && (
                  <span> • Class: {muallim.assignedClasses.join(', ')}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#667085] self-end sm:self-center">
            <span>
              Month: <strong className="text-[#1F2933]">{data?.monthName} {selectedYear}</strong>
            </span>
            <span>•</span>
            <span>
              Days: <strong className="text-[#1F2933]">{data?.daysInMonth || 30}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Monthly Attendance Summary KPI Grid (7 metric cards) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Scheduled */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#E3EAE6] text-center shadow-xs">
            <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
              Scheduled
            </span>
            <span className="text-lg sm:text-xl font-black text-[#1F2933] mt-1 block">
              {stats.totalScheduledShifts}
            </span>
            <span className="text-[10px] text-[#667085]">Duty shifts</span>
          </div>

          {/* Present */}
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-center shadow-xs">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Present
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-900 mt-1 block">
              {stats.presentShifts}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">
              {stats.presentDayEquivalent} days
            </span>
          </div>

          {/* Casual Leave (CL) */}
          <div className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 text-center shadow-xs">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
              Casual Leave
            </span>
            <span className="text-lg sm:text-xl font-black text-blue-900 mt-1 block">
              {stats.clShifts}
            </span>
            <span className="text-[10px] text-blue-700 font-semibold">
              {stats.clDayEquivalent} days
            </span>
          </div>

          {/* Half Pay Leave (HPL) */}
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 text-center shadow-xs">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              Half Pay Leave
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-900 mt-1 block">
              {stats.hplShifts}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">
              {stats.hplDayEquivalent} days
            </span>
          </div>

          {/* Leave W/O Pay (LLP) */}
          <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200 text-center shadow-xs">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
              Leave W/O Pay
            </span>
            <span className="text-lg sm:text-xl font-black text-rose-900 mt-1 block">
              {stats.llpShifts}
            </span>
            <span className="text-[10px] text-rose-700 font-semibold">
              {stats.llpDayEquivalent} days
            </span>
          </div>

          {/* Holiday */}
          <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200 text-center shadow-xs">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
              Holiday
            </span>
            <span className="text-lg sm:text-xl font-black text-purple-900 mt-1 block">
              {stats.holidayShifts}
            </span>
            <span className="text-[10px] text-purple-700 font-semibold">
              {stats.holidayDayEquivalent} days
            </span>
          </div>

          {/* Attendance % */}
          <div className="bg-[#084C3A] text-white p-3.5 rounded-2xl border border-[#0F6B50] text-center col-span-2 sm:col-span-1 shadow-xs">
            <span className="text-[10px] font-bold text-[#C9A227] uppercase tracking-wider block">
              Attendance %
            </span>
            <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
              {stats.attendancePercentage}%
            </span>
            <span className="text-[10px] text-[#DDEDE5]">Monthly Ratio</span>
          </div>
        </div>
      )}

      {/* Date-wise Attendance Table Card */}
      <Card className="p-0 overflow-hidden border border-[#E3EAE6] shadow-xs">
        {/* Table Search & Meta Header */}
        <div className="p-4 bg-white border-b border-[#E3EAE6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search date, day of week or summary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E3EAE6] text-xs sm:text-sm text-[#1F2933] placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#0F6B50]/20"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-[#667085]">
            <span>
              Days Marked: <strong className="text-[#0F6B50]">{data?.markedDatesCount || 0}</strong>
            </span>
            <span>•</span>
            <span>
              Unrecorded Shifts:{' '}
              <strong className="text-gray-700">{stats?.notRecordedShifts || 0}</strong>
            </span>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="py-16 text-center">
            <div className="w-9 h-9 border-3 border-[#DDEDE5] border-t-[#0F6B50] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#667085] font-semibold">
              Loading your attendance records...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasAnyRecords ? (
          <div className="py-16 text-center px-4">
            <CalendarX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm sm:text-base font-bold text-[#1F2933]">
              No Attendance Records Found
            </p>
            <p className="text-xs text-[#667085] mt-1 max-w-md mx-auto">
              No shift attendance has been recorded for {data?.monthName || 'this month'} {selectedYear}.
              Attendance records will appear here as soon as they are saved by the Sadhr Muallim.
            </p>
          </div>
        ) : (
          !isLoading && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[780px]">
                <thead>
                  <tr className="bg-[#084C3A] text-white border-b border-[#0F6B50] text-xs font-extrabold uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-[160px] sticky left-0 bg-[#084C3A] z-10">
                      Date & Day
                    </th>
                    <th className="py-3.5 px-4 w-[180px]">
                      <div>Shift 1</div>
                      <div className="text-[10px] text-[#DDEDE5] font-normal normal-case">
                        6:00 AM – 7:15 AM
                      </div>
                    </th>
                    <th className="py-3.5 px-4 w-[180px]">
                      <div>Shift 2</div>
                      <div className="text-[10px] text-[#DDEDE5] font-normal normal-case">
                        7:30 AM – 9:30 AM
                      </div>
                    </th>
                    <th className="py-3.5 px-4 w-[180px]">
                      <div>Shift 3</div>
                      <div className="text-[10px] text-[#DDEDE5] font-normal normal-case">
                        6:30 PM – 9:30 PM
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-center w-[140px]">Daily Summary</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E3EAE6] bg-white text-xs text-[#1F2933]">
                  {filteredRecords.map((d, idx) => (
                    <tr
                      key={d.dateStr}
                      className={`hover:bg-[#FAF8F2] transition-colors ${
                        idx % 2 === 1 ? 'bg-white' : 'bg-[#FAFCFB]'
                      }`}
                    >
                      {/* Date & Day */}
                      <td className="py-3 px-4 font-bold sticky left-0 bg-inherit z-10 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                        <div className="font-extrabold text-[#1F2933]">
                          {String(d.dayNumber).padStart(2, '0')} {data?.monthName?.slice(0, 3)}
                        </div>
                        <div className="text-[11px] text-[#667085] font-normal">{d.dayName}</div>
                      </td>

                      {/* Shift 1 */}
                      <td className="py-3 px-4 align-top">
                        {renderStatusBadge(d.shift1, d.shift1Reason)}
                      </td>

                      {/* Shift 2 */}
                      <td className="py-3 px-4 align-top">
                        {renderStatusBadge(d.shift2, d.shift2Reason)}
                      </td>

                      {/* Shift 3 */}
                      <td className="py-3 px-4 align-top">
                        {renderStatusBadge(d.shift3, d.shift3Reason)}
                      </td>

                      {/* Daily Summary */}
                      <td className="py-3 px-4 text-center align-top">
                        <span className="text-[11px] font-semibold text-[#1F2933] bg-[#DDEDE5]/50 px-2.5 py-1 rounded-full inline-block">
                          {d.summary || 'Not Marked'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Footer Note */}
        <div className="p-3 bg-[#FAF8F2] border-t border-[#E3EAE6] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#667085] px-4">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0F6B50]" />
            Official institutional faculty attendance record. Strictly read-only.
          </span>
          <span>1 shift = 1/3 working day</span>
        </div>
      </Card>
    </div>
  );
};

