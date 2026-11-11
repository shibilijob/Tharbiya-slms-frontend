import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Avatar } from '../../../components/common/Avatar';
import { useNotifications } from '../../../context/NotificationContext';
import {
  MuallimMonthlySummary,
  MuallimShiftId,
  MuallimAttendanceStatusType,
} from '../../../types';
import {
  MUALLIM_SHIFTS,
  STATUS_OPTIONS,
} from '../../../constants/muallimShifts';
import { muallimAttendanceService } from '../../../services/muallimAttendanceService';
import { useMuallimAttendanceStore } from '../../../stores/muallimAttendanceStore';
import {
  Calendar,
  Download,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Palmtree,
} from 'lucide-react';

interface MuallimMonthlyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: MuallimMonthlySummary | null;
  year: number;
  month: number;
  monthName: string;
  onSaved?: () => void;
}

export const MuallimMonthlyDetailModal: React.FC<MuallimMonthlyDetailModalProps> = ({
  isOpen,
  onClose,
  summary,
  year,
  month,
  monthName,
  onSaved,
}) => {
  const { showToast } = useNotifications();
  const downloadPdf = useMuallimAttendanceStore((s) => s.downloadPdf);

  // Local editable copy of daily records for this teacher
  const [editableRecords, setEditableRecords] = useState<
    Record<string, Record<MuallimShiftId, MuallimAttendanceStatusType | ''>>
  >({});
  const [editableReasons, setEditableReasons] = useState<
    Record<string, Record<MuallimShiftId, string>>
  >({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Reason editing modal state
  const [reasonModal, setReasonModal] = useState<{
    dateStr: string;
    shiftId: MuallimShiftId;
    shiftName: string;
    dateDisplay: string;
    reason: string;
    isNew: boolean;
    previousStatus: MuallimAttendanceStatusType | '';
  } | null>(null);

  useEffect(() => {
    if (summary && summary.dailyRecords) {
      const map: Record<string, Record<MuallimShiftId, MuallimAttendanceStatusType | ''>> = {};
      const reasonMap: Record<string, Record<MuallimShiftId, string>> = {};

      summary.dailyRecords.forEach((d) => {
        map[d.dateStr] = {
          SHIFT_1: (d.shift1 as MuallimAttendanceStatusType) || '',
          SHIFT_2: (d.shift2 as MuallimAttendanceStatusType) || '',
          SHIFT_3: (d.shift3 as MuallimAttendanceStatusType) || '',
        };
        reasonMap[d.dateStr] = {
          SHIFT_1: d.shift1 === 'HOLIDAY' ? (d.shift1Reason || '') : '',
          SHIFT_2: d.shift2 === 'HOLIDAY' ? (d.shift2Reason || '') : '',
          SHIFT_3: d.shift3 === 'HOLIDAY' ? (d.shift3Reason || '') : '',
        };
      });
      setEditableRecords(map);
      setEditableReasons(reasonMap);
      setIsDirty(false);
    }
  }, [summary]);

  if (!summary) return null;

  const { muallim, stats } = summary;

  // Handle cell edit
  const handleCellChange = (
    dateStr: string,
    shiftId: MuallimShiftId,
    newStatus: MuallimAttendanceStatusType | '',
    dateDisplay: string
  ) => {
    const prevStatus = editableRecords[dateStr]?.[shiftId] || '';

    setEditableRecords((prev) => {
      const currentDay = prev[dateStr] || { SHIFT_1: '', SHIFT_2: '', SHIFT_3: '' };
      return {
        ...prev,
        [dateStr]: {
          ...currentDay,
          [shiftId]: newStatus,
        },
      };
    });

    if (newStatus === 'HOLIDAY') {
      const existingReason = editableReasons[dateStr]?.[shiftId] || '';
      setReasonModal({
        dateStr,
        shiftId,
        shiftName: MUALLIM_SHIFTS.find((s) => s.id === shiftId)?.name || shiftId,
        dateDisplay,
        reason: existingReason,
        isNew: true,
        previousStatus: prevStatus,
      });
    } else {
      // Clear holiday reason if status changed away from HOLIDAY
      setEditableReasons((prev) => {
        const currentReasons = prev[dateStr] || { SHIFT_1: '', SHIFT_2: '', SHIFT_3: '' };
        return {
          ...prev,
          [dateStr]: {
            ...currentReasons,
            [shiftId]: '',
          },
        };
      });
    }

    setIsDirty(true);
  };

  const handleSaveReasonModal = () => {
    if (reasonModal) {
      setEditableReasons((prev) => {
        const currentReasons = prev[reasonModal.dateStr] || { SHIFT_1: '', SHIFT_2: '', SHIFT_3: '' };
        return {
          ...prev,
          [reasonModal.dateStr]: {
            ...currentReasons,
            [reasonModal.shiftId]: reasonModal.reason.trim(),
          },
        };
      });
      setIsDirty(true);
      setReasonModal(null);
    }
  };

  const handleClearReasonModal = () => {
    if (reasonModal) {
      setEditableReasons((prev) => {
        const currentReasons = prev[reasonModal.dateStr] || { SHIFT_1: '', SHIFT_2: '', SHIFT_3: '' };
        return {
          ...prev,
          [reasonModal.dateStr]: {
            ...currentReasons,
            [reasonModal.shiftId]: '',
          },
        };
      });
      setIsDirty(true);
      setReasonModal(null);
    }
  };

  const handleCloseReasonModal = () => {
    if (reasonModal && reasonModal.isNew && !reasonModal.reason) {
      // If closing newly set holiday without reason, keep HOLIDAY status with empty reason
    }
    setReasonModal(null);
  };

  // Save changes
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const datesToSave = Object.keys(editableRecords);

      for (const dStr of datesToSave) {
        const shifts = editableRecords[dStr];
        const reasons = editableReasons[dStr] || { SHIFT_1: '', SHIFT_2: '', SHIFT_3: '' };
        const records = (['SHIFT_1', 'SHIFT_2', 'SHIFT_3'] as MuallimShiftId[]).map((sId) => ({
          userId: muallim.id,
          shiftId: sId,
          status: (shifts[sId] || '') as MuallimAttendanceStatusType | '',
          holidayReason: shifts[sId] === 'HOLIDAY' ? (reasons[sId] || null) : null,
        }));
        await muallimAttendanceService.saveBulkAttendance(dStr, records);
      }

      showToast(`Saved attendance changes for ${muallim.name}!`);
      setIsDirty(false);
      if (onSaved) onSaved();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save attendance edits');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadPdf(year, month, muallim.id);
      showToast(`Downloaded attendance register for ${muallim.name}`);
    } catch (err: any) {
      showToast(err?.message || 'Failed to download PDF');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${muallim.name} — Monthly Attendance Register`}
      maxWidth="3xl"
    >
      <div className="space-y-6 pt-1 max-h-[82vh] overflow-y-auto pr-1">
        {/* Muallim Profile Card */}
        <div className="bg-[#FAF8F2] p-4 rounded-2xl border border-[#E3EAE6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={muallim.name} size="md" />
            <div>
              <h3 className="text-base font-extrabold text-[#1F2933]">{muallim.name}</h3>
              <p className="text-xs text-[#667085] mt-0.5">
                {muallim.designation || 'Muallim'} • Mobile: {muallim.phone}
                {muallim.assignedClasses && muallim.assignedClasses.length > 0 && (
                  <span> • Class: {muallim.assignedClasses.join(', ')}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadPdf}
              isLoading={isDownloadingPdf}
              leftIcon={<Download className="w-3.5 h-3.5 text-[#0F6B50]" />}
            >
              Export PDF
            </Button>
            {isDirty && (
              <Button
                size="sm"
                variant="primary"
                onClick={handleSaveChanges}
                isLoading={isSaving}
                leftIcon={<Save className="w-3.5 h-3.5" />}
                className="bg-[#0F6B50] hover:bg-[#084C3A] text-white font-bold"
              >
                Save Edits
              </Button>
            )}
          </div>
        </div>

        {/* Monthly Summary Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <div className="bg-white p-3 rounded-2xl border border-[#E3EAE6] text-center">
            <span className="text-[10px] font-bold text-[#667085] uppercase block">
              Scheduled
            </span>
            <span className="text-base font-black text-[#1F2933] mt-0.5 block">
              {stats.totalScheduledShifts}
            </span>
            <span className="text-[10px] text-[#667085]">Duty shifts</span>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 text-center">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">
              Present
            </span>
            <span className="text-base font-black text-emerald-900 mt-0.5 block">
              {stats.presentShifts}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold">
              {stats.presentDayEquivalent} days
            </span>
          </div>

          <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-200 text-center">
            <span className="text-[10px] font-bold text-blue-800 uppercase block">
              Casual Leave
            </span>
            <span className="text-base font-black text-blue-900 mt-0.5 block">
              {stats.clShifts}
            </span>
            <span className="text-[10px] text-blue-700 font-semibold">
              {stats.clDayEquivalent} days
            </span>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 text-center">
            <span className="text-[10px] font-bold text-amber-800 uppercase block">
              Half Pay Leave
            </span>
            <span className="text-base font-black text-amber-900 mt-0.5 block">
              {stats.hplShifts}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">
              {stats.hplDayEquivalent} days
            </span>
          </div>

          <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200 text-center">
            <span className="text-[10px] font-bold text-rose-800 uppercase block">
              Leave W/O Pay
            </span>
            <span className="text-base font-black text-rose-900 mt-0.5 block">
              {stats.llpShifts}
            </span>
            <span className="text-[10px] text-rose-700 font-semibold">
              {stats.llpDayEquivalent} days
            </span>
          </div>

          <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-200 text-center">
            <span className="text-[10px] font-bold text-purple-800 uppercase block">
              Holiday
            </span>
            <span className="text-base font-black text-purple-900 mt-0.5 block">
              {stats.holidayShifts}
            </span>
            <span className="text-[10px] text-purple-700 font-semibold">
              {stats.holidayDayEquivalent} days
            </span>
          </div>

          <div className="bg-[#084C3A] text-white p-3 rounded-2xl border border-[#0F6B50] text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-[#C9A227] uppercase block">
              Attendance %
            </span>
            <span className="text-lg font-black text-white mt-0.5 block">
              {stats.attendancePercentage}%
            </span>
            <span className="text-[10px] text-[#DDEDE5]">Monthly</span>
          </div>
        </div>

        {/* Date-wise Editable Table */}
        <div className="bg-white rounded-2xl border border-[#E3EAE6] overflow-hidden">
          <div className="p-3 bg-[#FAF8F2] border-b border-[#E3EAE6] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0F6B50]" />
              <h4 className="text-xs font-extrabold text-[#1F2933]">
                Daily Shift Breakdown — {monthName} {year}
              </h4>
            </div>
            <span className="text-[11px] text-[#667085]">
              You can edit statuses directly and click Save Edits
            </span>
          </div>

          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#FAF8F2] text-[#667085] sticky top-0 z-10 border-b border-[#E3EAE6]">
                <tr>
                  <th className="py-2.5 px-3 font-bold w-[130px]">Date & Day</th>
                  <th className="py-2.5 px-3 font-bold w-[160px]">
                    Shift 1 <span className="font-normal text-[10px]">(6:00–7:15 AM)</span>
                  </th>
                  <th className="py-2.5 px-3 font-bold w-[160px]">
                    Shift 2 <span className="font-normal text-[10px]">(7:30–9:30 AM)</span>
                  </th>
                  <th className="py-2.5 px-3 font-bold w-[160px]">
                    Shift 3 <span className="font-normal text-[10px]">(6:30–9:30 PM)</span>
                  </th>
                  <th className="py-2.5 px-3 font-bold text-center w-[120px]">Summary</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E3EAE6] bg-white">
                {summary.dailyRecords.map((d) => {
                  const shifts = editableRecords[d.dateStr] || {
                    SHIFT_1: (d.shift1 as any) || '',
                    SHIFT_2: (d.shift2 as any) || '',
                    SHIFT_3: (d.shift3 as any) || '',
                  };
                  const reasons = editableReasons[d.dateStr] || {
                    SHIFT_1: '',
                    SHIFT_2: '',
                    SHIFT_3: '',
                  };
                  const dateDisplay = `${d.dayNumber} ${monthName.slice(0, 3)} (${d.dayName.slice(0, 3)})`;

                  return (
                    <tr key={d.dateStr} className="hover:bg-gray-50/70">
                      <td className="py-2 px-3 font-bold text-[#1F2933]">
                        {dateDisplay}
                      </td>

                      {(['SHIFT_1', 'SHIFT_2', 'SHIFT_3'] as MuallimShiftId[]).map((sId) => {
                        const currentStatus = shifts[sId] || '';
                        const currentReason = reasons[sId] || '';

                        return (
                          <td key={sId} className="py-2 px-3 align-top">
                            <select
                              value={currentStatus}
                              onChange={(e) =>
                                handleCellChange(
                                  d.dateStr,
                                  sId,
                                  (e.target.value as MuallimAttendanceStatusType) || '',
                                  dateDisplay
                                )
                              }
                              className={`w-full text-xs font-bold px-2 py-1 rounded-lg border transition-all ${
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
                              <div className="mt-1">
                                {currentReason ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReasonModal({
                                        dateStr: d.dateStr,
                                        shiftId: sId,
                                        shiftName:
                                          MUALLIM_SHIFTS.find((s) => s.id === sId)?.name || sId,
                                        dateDisplay,
                                        reason: currentReason,
                                        isNew: false,
                                        previousStatus: 'HOLIDAY',
                                      })
                                    }
                                    className="w-full text-left flex items-center justify-between gap-1 text-[10px] text-purple-800 bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 transition-colors cursor-pointer group"
                                    title={`Holiday Reason: "${currentReason}" (Click to edit)`}
                                  >
                                    <span className="truncate italic font-medium max-w-[110px]">
                                      "{currentReason}"
                                    </span>
                                    <span className="text-[9px] text-purple-600 font-bold opacity-0 group-hover:opacity-100">
                                      Edit
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReasonModal({
                                        dateStr: d.dateStr,
                                        shiftId: sId,
                                        shiftName:
                                          MUALLIM_SHIFTS.find((s) => s.id === sId)?.name || sId,
                                        dateDisplay,
                                        reason: '',
                                        isNew: false,
                                        previousStatus: 'HOLIDAY',
                                      })
                                    }
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

                      <td className="py-2 px-3 text-center text-[10px] text-[#667085]">
                        {d.summary}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E3EAE6]">
          <div className="text-xs text-[#667085]">
            {isDirty ? (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Unsaved modifications exist
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All changes in sync with database
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={onClose}>
              Close
            </Button>
            {isDirty && (
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveChanges}
                isLoading={isSaving}
                className="bg-[#0F6B50] hover:bg-[#084C3A] text-white font-bold"
              >
                Save Edits
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modal for editing holiday reason inside monthly detail view */}
      {reasonModal && (
        <Modal
          isOpen={true}
          onClose={handleCloseReasonModal}
          title="Holiday Reason"
          maxWidth="sm"
        >
          <div className="space-y-4 pt-1">
            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <Palmtree className="w-4 h-4 text-purple-600" />
                Shift Holiday Details
              </p>
              <p>
                Usthad: <strong>{muallim.name}</strong> • {reasonModal.shiftName} • {reasonModal.dateDisplay}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2933] mb-1.5">
                Holiday Reason (Optional):
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Personal Leave, Medical, Family Event"
                value={reasonModal.reason}
                onChange={(e) =>
                  setReasonModal((prev) => (prev ? { ...prev, reason: e.target.value } : null))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveReasonModal();
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#E3EAE6] text-xs text-[#1F2933] focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E3EAE6]">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearReasonModal}
                className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs"
              >
                Clear Reason
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCloseReasonModal}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveReasonModal}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold"
                >
                  Save Reason
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
