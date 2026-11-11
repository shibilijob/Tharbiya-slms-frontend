import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Avatar } from '../../../components/common/Avatar';
import { useNotifications } from '../../../context/NotificationContext';
import { useMuallimAttendanceStore } from '../../../stores/muallimAttendanceStore';
import { MuallimMonthlySummary } from '../../../types';
import { MuallimMonthlyDetailModal } from './MuallimMonthlyDetailModal';
import {
  Calendar,
  Download,
  Search,
  RefreshCw,
  Users,
  Award,
  Clock,
  ChevronRight,
  FileSpreadsheet,
  AlertCircle,
  Palmtree,
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

export const MuallimMonthlyReportView: React.FC = () => {
  const { showToast } = useNotifications();

  const {
    selectedYear,
    selectedMonth,
    monthlyReport,
    isLoadingMonthly,
    setSelectedYearMonth,
    fetchMonthlyReport,
    downloadPdf,
  } = useMuallimAttendanceStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuallimDetail, setSelectedMuallimDetail] = useState<MuallimMonthlySummary | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExportingAllPdf, setIsExportingAllPdf] = useState(false);
  const [selectedIndividualMuallimId, setSelectedIndividualMuallimId] = useState('');
  const [isExportingIndividualPdf, setIsExportingIndividualPdf] = useState(false);

  useEffect(() => {
    fetchMonthlyReport(selectedYear, selectedMonth);
  }, [fetchMonthlyReport, selectedYear, selectedMonth]);

  const summaries = monthlyReport?.summaries || [];

  // Filter summaries by search query
  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return summaries;
    const q = searchQuery.toLowerCase();
    return summaries.filter(
      (s) =>
        s.muallim.name.toLowerCase().includes(q) ||
        s.muallim.phone.includes(q) ||
        s.muallim.designation.toLowerCase().includes(q) ||
        (s.muallim.assignedClasses && s.muallim.assignedClasses.some((c) => c.toLowerCase().includes(q)))
    );
  }, [summaries, searchQuery]);

  // Madrasa level overview aggregates
  const aggregates = useMemo(() => {
    if (summaries.length === 0) {
      return {
        facultyCount: 0,
        averagePercentage: 0,
        totalPresentDays: 0,
        totalLeaves: 0,
        totalHolidays: 0,
      };
    }

    let sumPct = 0;
    let totalPresentEq = 0;
    let totalLeavesCount = 0;
    let totalHolidaysCount = 0;

    summaries.forEach((s) => {
      sumPct += s.stats.attendancePercentage;
      totalPresentEq += s.stats.presentDayEquivalent;
      totalLeavesCount += s.stats.clShifts + s.stats.hplShifts + s.stats.llpShifts;
      totalHolidaysCount += s.stats.holidayShifts;
    });

    return {
      facultyCount: summaries.length,
      averagePercentage: Number((sumPct / summaries.length).toFixed(1)),
      totalPresentDays: Number(totalPresentEq.toFixed(1)),
      totalLeaves: totalLeavesCount,
      totalHolidays: totalHolidaysCount,
    };
  }, [summaries]);

  // Handle Export Full Register PDF
  const handleExportFullPdf = async () => {
    setIsExportingAllPdf(true);
    try {
      await downloadPdf(selectedYear, selectedMonth);
      showToast('Downloaded full Madrasa monthly attendance register PDF!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to download PDF');
    } finally {
      setIsExportingAllPdf(false);
    }
  };

  // Handle Export Individual Muallim PDF
  const handleExportIndividualPdf = async () => {
    if (!selectedIndividualMuallimId) {
      showToast('Please select a Muallim first');
      return;
    }
    const targetItem = summaries.find((s) => s.muallim.id === selectedIndividualMuallimId);
    const teacherName = targetItem?.muallim.name || 'Muallim';
    setIsExportingIndividualPdf(true);
    try {
      await downloadPdf(selectedYear, selectedMonth, selectedIndividualMuallimId);
      showToast(`Downloaded individual monthly attendance report for ${teacherName}!`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to download individual PDF report');
    } finally {
      setIsExportingIndividualPdf(false);
    }
  };

  const handleOpenDetail = (summary: MuallimMonthlySummary) => {
    setSelectedMuallimDetail(summary);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E3EAE6] shadow-xs space-y-4 sm:space-y-5">
        {/* ROW 1: Title and Description */}
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-[#DDEDE5] text-[#0F6B50] shrink-0">
            <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-black text-[#1F2933] tracking-tight">
              Monthly Muallim Attendance Register
            </h2>
            <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
              Shift totals, day-equivalent summaries, and institutional reports
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#E3EAE6] w-full" />

        {/* ROW 2: Controls Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
          {/* Left Sub-Group: Month, Year, and Refresh */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedYearMonth(selectedYear, Number(e.target.value))}
              aria-label="Select Month"
              className="h-10 px-3 rounded-xl border border-[#E3EAE6] text-xs sm:text-sm font-bold text-[#1F2933] bg-white hover:border-[#0F6B50]/40 focus:outline-none focus:ring-2 focus:ring-[#0F6B50]/20 transition-colors cursor-pointer flex-1 sm:flex-initial"
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
              aria-label="Select Year"
              className="h-10 px-3 rounded-xl border border-[#E3EAE6] text-xs sm:text-sm font-bold text-[#1F2933] bg-white hover:border-[#0F6B50]/40 focus:outline-none focus:ring-2 focus:ring-[#0F6B50]/20 transition-colors cursor-pointer flex-1 sm:flex-initial"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchMonthlyReport(selectedYear, selectedMonth)}
              className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl border border-[#E3EAE6] bg-white hover:bg-[#F3F7F5] text-[#667085] hover:text-[#0F6B50] hover:border-[#0F6B50]/40 transition-colors shadow-2xs"
              title="Refresh Report"
              disabled={isLoadingMonthly}
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingMonthly ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Right Sub-Group: PDF Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Download Full Monthly Register PDF button */}
            <Button
              variant="primary"
              onClick={handleExportFullPdf}
              isLoading={isExportingAllPdf}
              leftIcon={<Download className="w-4 h-4" />}
              className="h-10 px-4 bg-[#0F6B50] hover:bg-[#084C3A] text-white font-extrabold shadow-xs hover:shadow text-xs sm:text-sm whitespace-nowrap justify-center"
            >
              Download Full Monthly Register (PDF)
            </Button>

            {/* Individual Muallim selector + Download Individual Muallim Report PDF button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 p-1 sm:h-10 rounded-xl bg-[#FAF8F2] border border-[#E3EAE6]">
              <select
                value={selectedIndividualMuallimId}
                onChange={(e) => setSelectedIndividualMuallimId(e.target.value)}
                aria-label="Select Individual Muallim"
                className="h-8 px-2.5 rounded-lg border border-[#E3EAE6] text-xs font-semibold text-[#1F2933] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6B50]/30 w-full sm:w-44 truncate"
              >
                <option value="">Select Muallim...</option>
                {summaries.map((s) => (
                  <option key={s.muallim.id} value={s.muallim.id}>
                    {s.muallim.name}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportIndividualPdf}
                isLoading={isExportingIndividualPdf}
                disabled={!selectedIndividualMuallimId || isExportingIndividualPdf}
                leftIcon={<Download className="w-3.5 h-3.5 text-[#0F6B50]" />}
                className="h-8 px-3 font-bold text-xs text-[#0F6B50] border-[#0F6B50]/30 hover:bg-[#DDEDE5] whitespace-nowrap justify-center"
              >
                Download Individual Muallim Report (PDF)
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E3EAE6] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#667085] uppercase tracking-wider block">
            Faculty Members
          </span>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mt-1.5">
            <span className="text-xl sm:text-2xl font-black text-[#1F2933]">{aggregates.facultyCount}</span>
            <span className="text-[11px] sm:text-xs text-[#667085] font-medium">active Usthads</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E3EAE6] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#667085] uppercase tracking-wider block">
            Average Attendance
          </span>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mt-1.5">
            <span className="text-xl sm:text-2xl font-black text-[#0F6B50]">
              {aggregates.averagePercentage}%
            </span>
            <span className="text-[11px] sm:text-xs text-[#667085] font-medium">this month</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E3EAE6] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#667085] uppercase tracking-wider block">
            Total Working Attendance
          </span>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mt-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-800">
              {aggregates.totalPresentDays}
            </span>
            <span className="text-[11px] sm:text-xs text-[#667085] font-medium">faculty days</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#E3EAE6] shadow-xs flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#667085] uppercase tracking-wider block">
            Recorded Leaves
          </span>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mt-1.5">
            <span className="text-xl sm:text-2xl font-black text-amber-700">{aggregates.totalLeaves}</span>
            <span className="text-[11px] sm:text-xs text-[#667085] font-medium">shifts (CL+HPL+LLP)</span>
          </div>
        </div>
      </div>

      {/* Monthly Report Table Card */}
      <Card className="p-0 overflow-hidden border border-[#E3EAE6] shadow-xs">
        {/* Table Search & Meta Header */}
        <div className="p-3.5 sm:p-4 bg-white border-b border-[#E3EAE6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Usthad by name, mobile, designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#E3EAE6] text-xs sm:text-sm text-[#1F2933] placeholder-[#667085] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6B50]/20 hover:border-[#0F6B50]/40 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8FAF9] border border-[#E3EAE6] text-[#667085]">
              <span>Days in Month:</span>
              <strong className="text-[#1F2933] font-black">{monthlyReport?.daysInMonth || 30}</strong>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#DDEDE5]/60 border border-[#0F6B50]/20 text-[#0F6B50]">
              <span>Active School Days:</span>
              <strong className="text-[#084C3A] font-black">{monthlyReport?.markedDatesCount || 0}</strong>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoadingMonthly && (
          <div className="py-16 text-center">
            <div className="w-9 h-9 border-3 border-[#DDEDE5] border-t-[#0F6B50] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#667085] font-semibold">
              Compiling monthly attendance register...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingMonthly && filteredSummaries.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#1F2933]">No records found</p>
            <p className="text-xs text-[#667085] mt-1">
              {searchQuery ? 'No Muallims match your search.' : 'No active Muallim records found.'}
            </p>
          </div>
        ) : (
          !isLoadingMonthly && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="bg-[#084C3A] text-white border-b border-[#0F6B50] text-xs font-extrabold uppercase tracking-wider">
                    <th className="py-3.5 px-4 sticky left-0 bg-[#084C3A] z-10 w-[220px] shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
                      Muallim
                    </th>
                    <th className="py-3.5 px-3 text-center">Scheduled</th>
                    <th className="py-3.5 px-3 text-center">Present (Shifts / Days)</th>
                    <th className="py-3.5 px-3 text-center">CL</th>
                    <th className="py-3.5 px-3 text-center">HPL</th>
                    <th className="py-3.5 px-3 text-center">LLP</th>
                    <th className="py-3.5 px-3 text-center">Holiday</th>
                    <th className="py-3.5 px-3 text-center">Not Recorded</th>
                    <th className="py-3.5 px-3 text-center">Attendance %</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E3EAE6] bg-white text-xs text-[#1F2933]">
                  {filteredSummaries.map((item, idx) => {
                    const { muallim, stats } = item;
                    const isEven = idx % 2 === 0;

                    return (
                      <tr
                        key={muallim.id}
                        className={`group transition-colors ${
                          isEven ? 'bg-[#FAFCFB]' : 'bg-white'
                        } hover:bg-[#FAF8F2]`}
                      >
                        {/* Muallim Info (Sticky left with explicit opaque background) */}
                        <td
                          className={`py-3 px-4 font-bold sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.06)] transition-colors ${
                            isEven ? 'bg-[#FAFCFB]' : 'bg-white'
                          } group-hover:bg-[#FAF8F2]`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Avatar name={muallim.name} size="sm" />
                            <div>
                              <p className="font-extrabold text-[#1F2933]">{muallim.name}</p>
                              <p className="text-[10px] text-[#667085]">
                                {muallim.designation || 'Muallim'}
                                {muallim.assignedClasses?.length ? ` • ${muallim.assignedClasses.join(', ')}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Scheduled Shifts */}
                        <td className="py-3 px-3 text-center font-bold text-[#1F2933]">
                          {stats.totalScheduledShifts}
                        </td>

                        {/* Present */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-extrabold text-emerald-800">
                            {stats.presentShifts}
                          </span>{' '}
                          <span className="text-[11px] text-emerald-700 font-semibold">
                            ({stats.presentDayEquivalent} d)
                          </span>
                        </td>

                        {/* CL */}
                        <td className="py-3 px-3 text-center">
                          {stats.clShifts > 0 ? (
                            <span className="font-bold text-blue-700">
                              {stats.clShifts} ({stats.clDayEquivalent} d)
                            </span>
                          ) : (
                            <span className="text-[#667085]">-</span>
                          )}
                        </td>

                        {/* HPL */}
                        <td className="py-3 px-3 text-center">
                          {stats.hplShifts > 0 ? (
                            <span className="font-bold text-amber-700">
                              {stats.hplShifts} ({stats.hplDayEquivalent} d)
                            </span>
                          ) : (
                            <span className="text-[#667085]">-</span>
                          )}
                        </td>

                        {/* LLP */}
                        <td className="py-3 px-3 text-center">
                          {stats.llpShifts > 0 ? (
                            <span className="font-bold text-rose-700">
                              {stats.llpShifts} ({stats.llpDayEquivalent} d)
                            </span>
                          ) : (
                            <span className="text-[#667085]">-</span>
                          )}
                        </td>

                        {/* Holiday */}
                        <td className="py-3 px-3 text-center">
                          {stats.holidayShifts > 0 ? (
                            <span className="font-bold text-purple-700">
                              {stats.holidayShifts} ({stats.holidayDayEquivalent} d)
                            </span>
                          ) : (
                            <span className="text-[#667085]">-</span>
                          )}
                        </td>

                        {/* Not Recorded */}
                        <td className="py-3 px-3 text-center">
                          {stats.notRecordedShifts > 0 ? (
                            <span className="text-gray-600 font-semibold bg-gray-100 px-1.5 py-0.5 rounded">
                              {stats.notRecordedShifts}
                            </span>
                          ) : (
                            <span className="text-[#667085]">0</span>
                          )}
                        </td>

                        {/* Percentage */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-black text-[11px] ${
                              stats.attendancePercentage >= 90
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : stats.attendancePercentage >= 75
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : stats.attendancePercentage >= 50
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}
                          >
                            {stats.attendancePercentage}%
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetail(item)}
                            className="font-bold text-[#0F6B50] hover:bg-[#DDEDE5]"
                            rightIcon={<ChevronRight className="w-3 h-3" />}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>

      {/* Individual Muallim Monthly Detail Modal */}
      <MuallimMonthlyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        summary={selectedMuallimDetail}
        year={selectedYear}
        month={selectedMonth}
        monthName={monthlyReport?.monthName || `Month ${selectedMonth}`}
        onSaved={() => fetchMonthlyReport(selectedYear, selectedMonth)}
      />
    </div>
  );
};
