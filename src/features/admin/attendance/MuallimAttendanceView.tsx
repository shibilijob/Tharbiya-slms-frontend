import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Modal } from '../../../components/common/Modal';
import { Avatar } from '../../../components/common/Avatar';
import { ConfirmationDialog } from '../../../components/feedback/ConfirmationDialog';
import { useNotifications } from '../../../context/NotificationContext';
import { useMuallimAttendanceStore } from '../../../stores/muallimAttendanceStore';
import { TeacherUser } from '../../../types';
import {
  MUALLIM_SHIFTS,
  MUALLIM_ATTENDANCE_STATUSES,
  STATUS_OPTIONS,
  MuallimShiftId,
  MuallimAttendanceStatusType,
} from '../../../constants/muallimShifts';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Save,
  CheckCheck,
  Palmtree,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldAlert,
  Edit3,
} from 'lucide-react';

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return dateObj.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getStatusBadge = (status: MuallimAttendanceStatusType | '') => {
  if (!status) {
    return (
      <span className="text-[11px] font-medium text-[#667085] bg-gray-100 px-2 py-0.5 rounded-md">
        Not Recorded
      </span>
    );
  }
  const config = MUALLIM_ATTENDANCE_STATUSES.find((s) => s.id === status);
  if (!config) return null;

  return (
    <span
      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${config.badgeClass}`}
    >
      {config.code} — {config.label}
    </span>
  );
};

export const MuallimAttendanceView: React.FC = () => {
  const { showToast } = useNotifications();

  const {
    selectedDate,
    muallims,
    matrix,
    reasonMatrix,
    isDirty,
    isLoading,
    isSaving,
    error,
    setSelectedDate,
    fetchDailyAttendance,
    setShiftStatus,
    setShiftHolidayReason,
    markAllPresent,
    declareShiftHoliday,
    declareFullDayHoliday,
    saveDailyAttendance,
  } = useMuallimAttendanceStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Modals for bulk holiday actions
  const [isShiftHolidayModalOpen, setIsShiftHolidayModalOpen] = useState(false);
  const [targetShiftForHoliday, setTargetShiftForHoliday] = useState<MuallimShiftId>('SHIFT_1');
  const [shiftHolidayRemarks, setShiftHolidayRemarks] = useState('');

  const [isFullDayHolidayConfirmOpen, setIsFullDayHolidayConfirmOpen] = useState(false);
  const [fullDayHolidayRemarks, setFullDayHolidayRemarks] = useState('');

  // Individual Holiday Reason Modal State
  const [individualHolidayModal, setIndividualHolidayModal] = useState<{
    isOpen: boolean;
    muallim: TeacherUser | null;
    shiftId: MuallimShiftId | null;
    reason: string;
    isEditingExisting: boolean;
    previousStatus: MuallimAttendanceStatusType | '';
  }>({
    isOpen: false,
    muallim: null,
    shiftId: null,
    reason: '',
    isEditingExisting: false,
    previousStatus: '',
  });

  // Load attendance when component mounts
  useEffect(() => {
    fetchDailyAttendance();
  }, [fetchDailyAttendance]);

  // Navigate dates
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const prev = new Date(Date.UTC(y, m - 1, d - 1));
    const prevStr = prev.toISOString().split('T')[0];
    setSelectedDate(prevStr);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    const nextStr = next.toISOString().split('T')[0];
    setSelectedDate(nextStr);
  };

  const handleToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Filter muallims by search
  const filteredMuallims = useMemo(() => {
    if (!searchQuery.trim()) return muallims;
    const q = searchQuery.toLowerCase();
    return muallims.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.designation.toLowerCase().includes(q) ||
        (m.assignedClasses && m.assignedClasses.some((c) => c.toLowerCase().includes(q)))
    );
  }, [muallims, searchQuery]);

  // Handle Save
  const handleSave = async () => {
    try {
      await saveDailyAttendance();
      showToast('Muallim attendance saved successfully to database!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save attendance');
    }
  };

  // Handle Mark All Present for a specific shift
  const handleMarkShiftPresent = (shiftId: MuallimShiftId, shiftName: string) => {
    markAllPresent(shiftId);
    showToast(`Marked all active Muallims as PRESENT for ${shiftName}. Remember to click Save Attendance!`);
  };

  // Handle Declare Shift Holiday
  const handleConfirmShiftHoliday = async () => {
    try {
      await declareShiftHoliday(targetShiftForHoliday, shiftHolidayRemarks);
      setIsShiftHolidayModalOpen(false);
      setShiftHolidayRemarks('');
      showToast(`Declared ${targetShiftForHoliday.replace('_', ' ')} as Holiday for all active Muallims!`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to declare shift holiday');
    }
  };

  // Handle Declare Full Day Holiday
  const handleConfirmFullDayHoliday = async () => {
    try {
      await declareFullDayHoliday(fullDayHolidayRemarks);
      setIsFullDayHolidayConfirmOpen(false);
      setFullDayHolidayRemarks('');
      showToast('Full day institutional holiday declared for all active Muallims across all 3 shifts!');
    } catch (err: any) {
      showToast(err?.message || 'Failed to declare full day holiday');
    }
  };

  // Handle individual shift status changes
  const handleShiftSelectChange = (
    muallim: TeacherUser,
    shiftId: MuallimShiftId,
    newStatus: MuallimAttendanceStatusType | '',
    prevStatus: MuallimAttendanceStatusType | ''
  ) => {
    if (newStatus === 'HOLIDAY') {
      const existingReason = reasonMatrix[muallim.id]?.[shiftId] || '';
      // Set status to HOLIDAY first
      setShiftStatus(muallim.id, shiftId, 'HOLIDAY');
      // Open modal to prompt for optional reason
      setIndividualHolidayModal({
        isOpen: true,
        muallim,
        shiftId,
        reason: existingReason,
        isEditingExisting: false,
        previousStatus: prevStatus,
      });
    } else {
      // Non-holiday automatically clears holiday reason
      setShiftStatus(muallim.id, shiftId, newStatus);
    }
  };

  const handleOpenEditReason = (
    muallim: TeacherUser,
    shiftId: MuallimShiftId,
    currentReason: string
  ) => {
    setIndividualHolidayModal({
      isOpen: true,
      muallim,
      shiftId,
      reason: currentReason,
      isEditingExisting: true,
      previousStatus: 'HOLIDAY',
    });
  };

  const handleSaveIndividualReason = () => {
    if (individualHolidayModal.muallim && individualHolidayModal.shiftId) {
      setShiftHolidayReason(
        individualHolidayModal.muallim.id,
        individualHolidayModal.shiftId,
        individualHolidayModal.reason.trim()
      );
      showToast('Holiday reason updated! Remember to click Save Attendance.');
    }
    setIndividualHolidayModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSkipIndividualReason = () => {
    if (individualHolidayModal.muallim && individualHolidayModal.shiftId) {
      setShiftStatus(
        individualHolidayModal.muallim.id,
        individualHolidayModal.shiftId,
        'HOLIDAY',
        ''
      );
    }
    setIndividualHolidayModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleClearIndividualReason = () => {
    if (individualHolidayModal.muallim && individualHolidayModal.shiftId) {
      setShiftHolidayReason(
        individualHolidayModal.muallim.id,
        individualHolidayModal.shiftId,
        ''
      );
      showToast('Holiday reason removed.');
    }
    setIndividualHolidayModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCloseHolidayModal = () => {
    if (
      !individualHolidayModal.isEditingExisting &&
      individualHolidayModal.muallim &&
      individualHolidayModal.shiftId
    ) {
      setShiftStatus(
        individualHolidayModal.muallim.id,
        individualHolidayModal.shiftId,
        individualHolidayModal.previousStatus
      );
    }
    setIndividualHolidayModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="space-y-6">
      {/* Date Header & Action Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E3EAE6] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Date Controls */}
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#1F2933]">
                  {formatDisplayDate(selectedDate)}
                </h2>
                <p className="text-xs text-[#667085] flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[#0F6B50]" />
                  Three-Shift Faculty Attendance System
                </p>
              </div>
            </div>

            {/* Date Stepper Controls */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handlePrevDay}
                className="p-2 rounded-xl border border-[#E3EAE6] hover:bg-[#F3F7F5] text-[#1F2933] transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#E3EAE6] text-xs sm:text-sm font-semibold text-[#1F2933] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6B50]/30"
              />

              <button
                onClick={handleNextDay}
                className="p-2 rounded-xl border border-[#E3EAE6] hover:bg-[#F3F7F5] text-[#1F2933] transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-xl bg-[#DDEDE5] hover:bg-[#cde4d9] text-[#084C3A] text-xs font-bold transition-colors"
              >
                Today
              </button>

              <button
                onClick={() => fetchDailyAttendance()}
                className="p-2 rounded-xl border border-[#E3EAE6] hover:bg-[#F3F7F5] text-[#667085] hover:text-[#1F2933] transition-colors ml-1"
                title="Refresh Attendance"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Right: Primary Save & Status Alert */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {isDirty && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Unsaved changes
              </span>
            )}

            <Button
              variant="primary"
              size="lg"
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              className="bg-[#0F6B50] hover:bg-[#084C3A] text-white font-extrabold shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              Save Attendance
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      <div className="bg-[#FAF8F2] rounded-2xl p-4 border border-[#E3EAE6] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C9A227]" />
            <h3 className="text-xs sm:text-sm font-extrabold text-[#1F2933]">
              Quick Bulk Actions (Selected Date Only)
            </h3>
          </div>
          <span className="text-[11px] text-[#667085]">
            Bulk actions apply to all {muallims.length} active Muallims
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Mark All Present for Shifts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-[#667085] mr-1 hidden sm:inline">
              Mark Present:
            </span>
            {MUALLIM_SHIFTS.map((shift) => (
              <Button
                key={shift.id}
                size="sm"
                variant="outline"
                className="bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold"
                onClick={() => handleMarkShiftPresent(shift.id, shift.name)}
                leftIcon={<CheckCheck className="w-3.5 h-3.5 text-emerald-600" />}
              >
                All {shift.name}
              </Button>
            ))}
          </div>

          <div className="h-5 w-px bg-gray-300 mx-1 hidden sm:block" />

          {/* Holiday Actions */}
          <Button
            size="sm"
            variant="outline"
            className="bg-white hover:bg-purple-50 text-purple-800 border-purple-200 text-xs font-bold"
            onClick={() => setIsShiftHolidayModalOpen(true)}
            leftIcon={<Palmtree className="w-3.5 h-3.5 text-purple-600" />}
          >
            Declare Shift Holiday
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="bg-white hover:bg-purple-100 text-purple-900 border-purple-300 text-xs font-extrabold"
            onClick={() => setIsFullDayHolidayConfirmOpen(true)}
            leftIcon={<Palmtree className="w-3.5 h-3.5 text-purple-700" />}
          >
            Full Day Holiday
          </Button>
        </div>
      </div>

      {/* Filter and Table Container */}
      <Card className="p-0 overflow-hidden border border-[#E3EAE6] shadow-xs">
        {/* Search header bar */}
        <div className="p-4 bg-white border-b border-[#E3EAE6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Muallim by name, phone, class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E3EAE6] text-xs sm:text-sm text-[#1F2933] placeholder-[#667085] focus:outline-none focus:ring-2 focus:ring-[#0F6B50]/20"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-[#667085]">
            <span>
              Showing <strong className="text-[#1F2933]">{filteredMuallims.length}</strong> of{' '}
              {muallims.length} Muallims
            </span>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="py-16 text-center">
            <div className="w-9 h-9 border-3 border-[#DDEDE5] border-t-[#0F6B50] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-[#667085] font-semibold">
              Loading attendance records for {selectedDate}...
            </p>
          </div>
        )}

        {/* Attendance Table */}
        {!isLoading && filteredMuallims.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#1F2933]">No Muallims found</p>
            <p className="text-xs text-[#667085] mt-1">
              {searchQuery ? 'Try adjusting your search criteria.' : 'No active Muallims enrolled.'}
            </p>
          </div>
        ) : (
          !isLoading && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#084C3A] text-white border-b border-[#0F6B50]">
                    <th className="py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider w-[240px] sticky left-0 bg-[#084C3A] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
                      Muallim Name
                    </th>
                    {MUALLIM_SHIFTS.map((shift) => (
                      <th
                        key={shift.id}
                        className="py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider w-[180px]"
                      >
                        <div className="leading-tight">
                          <span>{shift.name}</span>
                          <span className="block text-[10px] text-[#DDEDE5] font-normal mt-0.5">
                            {shift.time}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="py-3.5 px-4 text-xs font-extrabold uppercase tracking-wider w-[140px] text-center">
                      Daily Summary
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E3EAE6] bg-white text-xs text-[#1F2933]">
                  {filteredMuallims.map((m, idx) => {
                    const shifts = matrix[m.id] || {
                      SHIFT_1: '',
                      SHIFT_2: '',
                      SHIFT_3: '',
                    };
                    const reasons = reasonMatrix[m.id] || {
                      SHIFT_1: '',
                      SHIFT_2: '',
                      SHIFT_3: '',
                    };

                    // Compute row summary
                    const recordedStatuses = [shifts.SHIFT_1, shifts.SHIFT_2, shifts.SHIFT_3].filter(
                      Boolean
                    );
                    let summaryBadge = null;

                    if (recordedStatuses.length === 0) {
                      summaryBadge = (
                        <span className="text-[10px] text-[#667085] bg-gray-100 px-2 py-0.5 rounded-full">
                          Not Marked
                        </span>
                      );
                    } else if (
                      shifts.SHIFT_1 === 'HOLIDAY' &&
                      shifts.SHIFT_2 === 'HOLIDAY' &&
                      shifts.SHIFT_3 === 'HOLIDAY'
                    ) {
                      summaryBadge = (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                          Full Holiday
                        </span>
                      );
                    } else if (
                      shifts.SHIFT_1 === 'PRESENT' &&
                      shifts.SHIFT_2 === 'PRESENT' &&
                      shifts.SHIFT_3 === 'PRESENT'
                    ) {
                      summaryBadge = (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          3/3 Present
                        </span>
                      );
                    } else {
                      const presentCount = recordedStatuses.filter((s) => s === 'PRESENT').length;
                      summaryBadge = (
                        <span className="text-[10px] font-semibold text-[#1F2933] bg-[#DDEDE5]/40 px-2 py-0.5 rounded-full">
                          {presentCount}/3 Present
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={m.id}
                        className={`hover:bg-[#FAF8F2] transition-colors ${
                          idx % 2 === 1 ? 'bg-white' : 'bg-[#FAFCFB]'
                        }`}
                      >
                        {/* Muallim Name Column (Sticky left for scrolling) */}
                        <td className="py-3 px-4 font-bold sticky left-0 bg-inherit z-10 shadow-[2px_0_5px_rgba(0,0,0,0.04)]">
                          <div className="flex items-center gap-3">
                            <Avatar name={m.name} size="sm" />
                            <div>
                              <p className="text-xs sm:text-sm font-extrabold text-[#1F2933] leading-snug">
                                {m.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-[#0F6B50] font-semibold bg-[#DDEDE5]/60 px-1.5 py-0.2 rounded">
                                  {m.designation || 'Muallim'}
                                </span>
                                {m.assignedClasses && m.assignedClasses.length > 0 && (
                                  <span className="text-[10px] text-[#667085] hidden sm:inline">
                                    • {m.assignedClasses.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3 Shift Columns */}
                        {(['SHIFT_1', 'SHIFT_2', 'SHIFT_3'] as MuallimShiftId[]).map((sId) => {
                          const currentStatus = shifts[sId] || '';
                          const currentReason = reasons[sId] || '';

                          return (
                            <td key={sId} className="py-3 px-4 align-top">
                              <select
                                value={currentStatus}
                                onChange={(e) =>
                                  handleShiftSelectChange(
                                    m,
                                    sId,
                                    (e.target.value as MuallimAttendanceStatusType) || '',
                                    currentStatus
                                  )
                                }
                                className={`w-full text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-[#0F6B50]/30 ${
                                  currentStatus === 'PRESENT'
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                    : currentStatus === 'CL'
                                    ? 'bg-blue-50 text-blue-900 border-blue-300'
                                    : currentStatus === 'HPL'
                                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                                    : currentStatus === 'LLP'
                                    ? 'bg-rose-50 text-rose-900 border-rose-300'
                                    : currentStatus === 'HOLIDAY'
                                    ? 'bg-purple-50 text-purple-900 border-purple-300'
                                    : 'bg-white text-[#667085] border-[#E3EAE6]'
                                }`}
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>

                              {/* Holiday Reason - strictly below Holiday status only */}
                              {currentStatus === 'HOLIDAY' && (
                                <div className="mt-1.5">
                                  {currentReason ? (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditReason(m, sId, currentReason)}
                                      className="w-full text-left flex items-center justify-between gap-1 text-[10.5px] text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200 transition-colors group cursor-pointer"
                                      title={`Holiday Reason: "${currentReason}" (Click to edit)`}
                                    >
                                      <span className="truncate italic font-medium leading-tight max-w-[130px]">
                                        "{currentReason}"
                                      </span>
                                      <span className="text-[9px] text-purple-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        Edit
                                      </span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditReason(m, sId, '')}
                                      className="text-[10px] text-purple-700 hover:text-purple-900 font-medium hover:underline flex items-center gap-0.5"
                                    >
                                      + Add reason
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Daily Summary Column */}
                        <td className="py-3 px-4 text-center">
                          {summaryBadge}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Footer save reminder bar */}
        {isDirty && !isLoading && (
          <div className="p-3 bg-amber-50 border-t border-amber-200 flex items-center justify-between gap-4 px-4">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              You have unsaved attendance modifications for {formatDisplayDate(selectedDate)}.
            </span>
            <Button
              size="sm"
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={<Save className="w-3.5 h-3.5" />}
              className="bg-[#0F6B50] hover:bg-[#084C3A] text-white font-bold"
            >
              Save Now
            </Button>
          </div>
        )}
      </Card>

      {/* Modal: Declare Shift Holiday */}
      <Modal
        isOpen={isShiftHolidayModalOpen}
        onClose={() => setIsShiftHolidayModalOpen(false)}
        title="Declare Shift Holiday"
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <Palmtree className="w-4 h-4 text-purple-600" />
              Institutional Shift Holiday
            </p>
            <p>
              This will mark the chosen shift as <strong>HOLIDAY</strong> for <strong>ALL active Muallims</strong> on{' '}
              <strong>{formatDisplayDate(selectedDate)}</strong>. Any existing status for that shift will be overwritten.
              The other two shifts will remain completely unchanged.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
              Select Target Shift:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {MUALLIM_SHIFTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setTargetShiftForHoliday(s.id)}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                    targetShiftForHoliday === s.id
                      ? 'bg-purple-100 border-purple-500 text-purple-900 ring-2 ring-purple-500/20'
                      : 'bg-white border-[#E3EAE6] text-[#1F2933] hover:bg-gray-50'
                  }`}
                >
                  <p className="font-extrabold">{s.name}</p>
                  <p className="text-[10px] text-[#667085] font-normal mt-0.5">{s.time}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
              Holiday Reason (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Madrasa Anniversary, Special Institution Holiday"
              value={shiftHolidayRemarks}
              onChange={(e) => setShiftHolidayRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E3EAE6] text-xs text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E3EAE6]">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsShiftHolidayModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmShiftHoliday}
              isLoading={isSaving}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold"
            >
              Confirm & Save Shift Holiday
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Full Day Holiday Confirmation */}
      <Modal
        isOpen={isFullDayHolidayConfirmOpen}
        onClose={() => setIsFullDayHolidayConfirmOpen(false)}
        title="Declare Full Day Institutional Holiday"
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
            <p className="font-bold flex items-center gap-1.5 mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Full Day Overwrite Warning
            </p>
            <p>
              This will mark <strong>ALL THREE SHIFTS (Shift 1, Shift 2, and Shift 3)</strong> as{' '}
              <strong>HOLIDAY</strong> for <strong>ALL active Muallims</strong> on{' '}
              <strong>{formatDisplayDate(selectedDate)}</strong>.
            </p>
            <p className="mt-1 font-semibold text-rose-800">
              Any existing recorded attendance for this date will be replaced with institutional holiday.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
              Holiday Reason (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Public Holiday, Madrasa Vacation Day"
              value={fullDayHolidayRemarks}
              onChange={(e) => setFullDayHolidayRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E3EAE6] text-xs text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E3EAE6]">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsFullDayHolidayConfirmOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmFullDayHoliday}
              isLoading={isSaving}
              className="bg-rose-700 hover:bg-rose-800 text-white font-bold"
            >
              Yes, Declare Full Day Holiday
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Individual Shift Holiday Reason */}
      {individualHolidayModal.isOpen && individualHolidayModal.muallim && individualHolidayModal.shiftId && (
        <Modal
          isOpen={individualHolidayModal.isOpen}
          onClose={handleCloseHolidayModal}
          title={
            individualHolidayModal.isEditingExisting
              ? 'Edit Holiday Reason'
              : 'Set Individual Holiday'
          }
          maxWidth="md"
        >
          <div className="space-y-4 pt-1">
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <Palmtree className="w-4 h-4 text-purple-600" />
                {individualHolidayModal.isEditingExisting
                  ? 'Edit Shift Holiday Reason'
                  : 'Individual Shift Holiday'}
              </p>
              <p>
                Usthad: <strong>{individualHolidayModal.muallim.name}</strong> •{' '}
                {MUALLIM_SHIFTS.find((s) => s.id === individualHolidayModal.shiftId)?.name} •{' '}
                {formatDisplayDate(selectedDate)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
                Holiday Reason (Optional):
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Personal Holiday, Family Function, Medical"
                value={individualHolidayModal.reason}
                onChange={(e) =>
                  setIndividualHolidayModal((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveIndividualReason();
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#E3EAE6] text-xs text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <p className="text-[11px] text-[#667085] mt-1">
                This reason applies strictly to this Muallim and shift on the selected date.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E3EAE6]">
              {individualHolidayModal.isEditingExisting ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearIndividualReason}
                  className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs"
                >
                  Clear Reason
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkipIndividualReason}
                  className="text-[#667085] hover:bg-gray-50 text-xs"
                >
                  Continue Without Reason
                </Button>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseHolidayModal}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveIndividualReason}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold"
                >
                  Save Reason
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
