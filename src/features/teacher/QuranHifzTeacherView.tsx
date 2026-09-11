import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Check, CheckCircle2, Clock, Edit2, Plus, Search, Target, Trash2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { useClassStore, useHifzStore, useStudentStore } from '../../stores';
import type { HifzRecordStatus, HifzSchedule, HifzTarget } from '../../services/hifzService';
import { api } from '../../lib/axios';
import { formatDate } from '../../utils/formatters';

const today = () => new Date().toISOString().split('T')[0];
const nextMonth = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const toDateInput = (value?: string) => (value ? value.split('T')[0] : today());
const emptySchedule = (): HifzSchedule => ({ dateFrom: today(), dateTo: today(), ayahFrom: 1, ayahTo: 1 });

export const QuranHifzTeacherView: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const teacherAssignedClasses = useClassStore((s) => s.teacherAssignedClasses);
  const fetchAssignedClassesForTeacher = useClassStore((s) => s.fetchAssignedClassesForTeacher);
  const allStudents = useStudentStore((s) => s.students);
  const fetchStudents = useStudentStore((s) => s.fetchStudents);
  const targets = useHifzStore((s) => s.targets);
  const selectedTarget = useHifzStore((s) => s.selectedTarget);
  const setSelectedTarget = useHifzStore((s) => s.setSelectedTarget);
  const records = useHifzStore((s) => s.records);
  const fetchTargets = useHifzStore((s) => s.fetchTargets);
  const fetchRecords = useHifzStore((s) => s.fetchRecords);
  const createTarget = useHifzStore((s) => s.createTarget);
  const updateTarget = useHifzStore((s) => s.updateTarget);
  const deleteTarget = useHifzStore((s) => s.deleteTarget);
  const createRecord = useHifzStore((s) => s.createRecord);
  const updateRecord = useHifzStore((s) => s.updateRecord);

  const [selectedClass, setSelectedClass] = useState('');
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetIdToEdit, setTargetIdToEdit] = useState<string | null>(null);
  const [surahName, setSurahName] = useState('');
  const [totalAyahsToMemorize, setTotalAyahsToMemorize] = useState('20');
  const [targetStartDate, setTargetStartDate] = useState(today());
  const [targetEndDate, setTargetEndDate] = useState(nextMonth());
  const [schedules, setSchedules] = useState<HifzSchedule[]>([emptySchedule()]);
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any | null>(null);
  const [selectedTargetIdForRecord, setSelectedTargetIdForRecord] = useState('');
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);
  const [recordDate, setRecordDate] = useState(today());
  const [completedAyahFrom, setCompletedAyahFrom] = useState('1');
  const [completedAyahTo, setCompletedAyahTo] = useState('1');
  const [recordStatus, setRecordStatus] = useState<HifzRecordStatus>('COMPLETED');
  const [recordRemark, setRecordRemark] = useState('');
  const [isSavingRecord, setIsSavingRecord] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAssignedClassesForTeacher(user);
      fetchStudents();
    }
  }, [fetchAssignedClassesForTeacher, fetchStudents, user]);

  const assignedClasses = useMemo(() => {
    if (teacherAssignedClasses.length > 0) return teacherAssignedClasses;
    const raw = (user as any)?.assignedClasses;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const cleaned = list.map((item) => String(item).replace(/^Class\s*/i, '').trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned : ['4'];
  }, [teacherAssignedClasses, user]);

  useEffect(() => {
    if (assignedClasses.length > 0 && (!selectedClass || !assignedClasses.includes(selectedClass))) {
      setSelectedClass(assignedClasses[0]);
    }
  }, [assignedClasses, selectedClass]);

  const loadClassData = useCallback(async (classId: string) => {
    if (!classId) return;
    setIsLoading(true);
    try {
      await fetchTargets(classId);
      await fetchRecords({ classId });
      try {
        const res = await api.get(`/muallim/classes/${classId}/students`);
        setClassStudents(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch {
        setClassStudents(allStudents.filter((s) => String(s.class).replace(/^Class\s*/i, '').trim() === classId));
      }
    } finally {
      setIsLoading(false);
    }
  }, [allStudents, fetchRecords, fetchTargets]);

  useEffect(() => {
    loadClassData(selectedClass);
  }, [loadClassData, selectedClass]);

  const currentTarget = selectedTarget || targets[0] || null;

  const openTargetModal = (target?: HifzTarget) => {
    if (target) {
      const targetSchedules = target.schedules?.length
        ? target.schedules
        : [{ dateFrom: target.startDate, dateTo: target.endDate, ayahFrom: target.fromAyah || 1, ayahTo: target.toAyah || 1 }];
      setTargetIdToEdit(target.id);
      setSurahName(target.surahName || target.criteria || '');
      setTotalAyahsToMemorize(String(target.totalAyahsToMemorize || target.toAyah || 20));
      setTargetStartDate(toDateInput(target.startDate));
      setTargetEndDate(toDateInput(target.endDate));
      setSchedules(targetSchedules.map((schedule) => ({
        dateFrom: toDateInput(schedule.dateFrom),
        dateTo: toDateInput(schedule.dateTo),
        ayahFrom: schedule.ayahFrom || 1,
        ayahTo: schedule.ayahTo || 1,
      })));
    } else {
      setTargetIdToEdit(null);
      setSurahName('');
      setTotalAyahsToMemorize('20');
      setTargetStartDate(today());
      setTargetEndDate(nextMonth());
      setSchedules([emptySchedule()]);
    }
    setIsTargetModalOpen(true);
  };

  const updateSchedule = (index: number, patch: Partial<HifzSchedule>) => {
    setSchedules((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const validateTargetForm = () => {
    if (!surahName.trim()) return 'Surah Name is required';
    if (!Number(totalAyahsToMemorize) || Number(totalAyahsToMemorize) < 1) return 'Total Ayahs Need to Memorize must be positive';
    if (!targetStartDate || !targetEndDate) return 'Overall Date From and Date To are required';
    if (new Date(targetEndDate) < new Date(targetStartDate)) return 'Overall Date To cannot be before Date From';
    for (const [index, schedule] of schedules.entries()) {
      if (!schedule.dateFrom || !schedule.dateTo) return `Week ${index + 1}: Date From and Date To are required`;
      if (new Date(schedule.dateTo) < new Date(schedule.dateFrom)) return `Week ${index + 1}: Date To cannot be before Date From`;
      if (!schedule.ayahFrom || !schedule.ayahTo) return `Week ${index + 1}: Ayah From and Ayah To are required`;
      if (schedule.ayahFrom < 1 || schedule.ayahTo < 1) return `Week ${index + 1}: Ayah numbers must be positive`;
      if (schedule.ayahFrom > schedule.ayahTo) return `Week ${index + 1}: Ayah From cannot exceed Ayah To`;
    }
    return null;
  };

  const handleSaveTarget = async (event: React.FormEvent) => {
    event.preventDefault();
    const error = validateTargetForm();
    if (error) {
      showToast(error);
      return;
    }
    setIsSavingTarget(true);
    try {
      const firstSchedule = schedules[0];
      const payload = {
        classId: selectedClass,
        criteria: surahName.trim(),
        surahName: surahName.trim(),
        totalAyahsToMemorize: Number(totalAyahsToMemorize),
        startDate: targetStartDate,
        endDate: targetEndDate,
        fromAyah: firstSchedule.ayahFrom,
        toAyah: firstSchedule.ayahTo,
        schedules,
      };
      if (targetIdToEdit) {
        await updateTarget(targetIdToEdit, payload);
        showToast('Hifz target updated successfully');
      } else {
        await createTarget(payload);
        showToast(`New Hifz target added to Class ${selectedClass}`);
      }
      setIsTargetModalOpen(false);
      await loadClassData(selectedClass);
    } catch (err: any) {
      showToast(err?.data?.message || err?.message || 'Failed to save target');
    } finally {
      setIsSavingTarget(false);
    }
  };

  const handleDeleteTarget = async (target: HifzTarget) => {
    if (!window.confirm(`Delete or archive "${target.surahName || target.criteria}" for Class ${selectedClass}?`)) return;
    await deleteTarget(target.id);
    await loadClassData(selectedClass);
  };

  const syncRecordForm = (student: any, targetId: string) => {
    const studentId = student.id || student._id;
    const existing = records.find((r) => r.studentId === studentId && r.hifzTargetId === targetId);
    const target = targets.find((t) => t.id === targetId);
    const firstRange = existing?.completedRanges?.[0];
    const firstSchedule = target?.schedules?.[0];
    setExistingRecordId(existing?.id || null);
    setRecordDate(existing?.date ? toDateInput(existing.date) : today());
    setCompletedAyahFrom(String(firstRange?.ayahFrom || existing?.completedAyahFrom || firstSchedule?.ayahFrom || 1));
    setCompletedAyahTo(String(firstRange?.ayahTo || existing?.completedAyahTo || firstSchedule?.ayahTo || 1));
    setRecordStatus(existing?.status || 'COMPLETED');
    setRecordRemark(existing?.remark || '');
  };

  const openRecordModal = (student: any, target?: HifzTarget) => {
    const targetId = target?.id || currentTarget?.id || targets[0]?.id || '';
    setActiveStudent(student);
    setSelectedTargetIdForRecord(targetId);
    syncRecordForm(student, targetId);
    setIsRecordModalOpen(true);
  };

  const handleSaveRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeStudent || !selectedTargetIdForRecord) {
      showToast('Please select a valid class Hifz target');
      return;
    }
    const ayahFrom = Number(completedAyahFrom);
    const ayahTo = Number(completedAyahTo);
    if (!ayahFrom || !ayahTo || ayahFrom < 1 || ayahTo < 1 || ayahFrom > ayahTo) {
      showToast('Completed Ayah From and To must be positive, valid numbers');
      return;
    }
    setIsSavingRecord(true);
    try {
      const studentId = activeStudent.id || activeStudent._id;
      const payload = {
        studentId,
        classId: selectedClass,
        hifzTargetId: selectedTargetIdForRecord,
        date: recordDate,
        progress: `Ayah ${ayahFrom}-${ayahTo}`,
        completedAyahFrom: ayahFrom,
        completedAyahTo: ayahTo,
        completedRanges: [{ ayahFrom, ayahTo }],
        status: recordStatus,
        remark: recordRemark.trim(),
      };
      if (existingRecordId) await updateRecord(existingRecordId, payload);
      else await createRecord(payload);
      showToast(`Hifz progress saved for ${activeStudent.name}`);
      setIsRecordModalOpen(false);
      await loadClassData(selectedClass);
    } catch (err: any) {
      showToast(err?.data?.message || err?.message || 'Failed to save record');
    } finally {
      setIsSavingRecord(false);
    }
  };

  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return classStudents.filter((student) => {
      if (!query) return true;
      return [student.name, student.admissionNumber, student.admissionNo, student.malayalamName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [classStudents, searchQuery]);

  const stats = useMemo(() => {
    const total = classStudents.length;
    if (!currentTarget) return { total, completed: 0, partial: 0, pending: total };
    const targetRecords = records.filter((record) => record.hifzTargetId === currentTarget.id);
    const completed = targetRecords.filter((record) => record.status === 'COMPLETED').length;
    const partial = targetRecords.filter((record) => record.status === 'PARTIAL').length;
    return { total, completed, partial, pending: Math.max(0, total - completed - partial) };
  }, [classStudents.length, currentTarget, records]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#0F6B50] via-[#0A4D39] to-[#063326] rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-white/10 text-emerald-200"><Award className="w-6 h-6" /></span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Hifz Tracking</h1>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 max-w-xl leading-relaxed">Class-level Hifz targets with student-specific progress records.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/15">
          <label className="text-xs font-bold text-emerald-100 whitespace-nowrap pl-2">Assigned Class:</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-4 py-2 text-xs font-bold rounded-xl bg-white text-[#1F2933] shadow-xs outline-none focus:ring-2 focus:ring-emerald-400">
            {assignedClasses.map((classId) => <option key={classId} value={classId}>Class {classId}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#1F2933] flex items-center gap-2"><Target className="w-4 h-4 text-[#0F6B50]" />Class {selectedClass} Hifz Targets ({targets.length})</h2>
            <p className="text-[11px] text-[#667085] mt-0.5">Create targets for the selected class, then record each student&apos;s completion against one target.</p>
          </div>
          <Button size="sm" variant="primary" onClick={() => openTargetModal()} className="bg-[#0F6B50] hover:bg-[#0A4D39] text-white font-extrabold text-xs"><Plus className="w-4 h-4 mr-1.5" /> Add New Hifz Target</Button>
        </div>

        {targets.length === 0 ? (
          <Card className="p-8 text-center bg-[#FAF8F2] border-2 border-dashed border-[#E3EAE6] rounded-2xl">
            <Target className="w-10 h-10 mx-auto text-[#667085] opacity-60 mb-2.5" />
            <h3 className="text-sm font-extrabold text-[#1F2933]">No Hifz target has been assigned to this class yet.</h3>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {targets.map((target, index) => {
              const isCurrent = currentTarget?.id === target.id;
              const completedCount = records.filter((record) => record.hifzTargetId === target.id && record.status === 'COMPLETED').length;
              return (
                <Card key={target.id} onClick={() => setSelectedTarget(target)} className={`p-4 rounded-2xl border transition-all cursor-pointer ${isCurrent ? 'border-[#0F6B50] bg-emerald-50/40 ring-1 ring-[#0F6B50]' : 'border-[#E3EAE6] bg-white hover:border-[#0F6B50]'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#0F6B50] text-white">Target {index + 1}</span>
                        {isCurrent && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Check className="w-3 h-3" /> Selected</span>}
                      </div>
                      <h4 className="text-sm font-extrabold text-[#1F2933] truncate">{target.surahName || target.criteria}</h4>
                      <p className="text-[11px] text-[#667085] mt-1">{target.totalAyahsToMemorize || '-'} ayahs | {formatDate(target.startDate)} - {formatDate(target.endDate)}</p>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => openTargetModal(target)} className="p-1.5 rounded-lg text-[#667085] hover:text-[#0F6B50] hover:bg-white" title="Edit target"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => handleDeleteTarget(target)} className="p-1.5 rounded-lg text-[#667085] hover:text-rose-600 hover:bg-rose-50" title="Delete target"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {(target.schedules || []).map((schedule, scheduleIndex) => (
                      <div key={`${target.id}-${scheduleIndex}`} className="text-[11px] bg-[#FAF8F2] border border-[#E3EAE6] rounded-lg px-2.5 py-1.5 flex justify-between gap-2">
                        <span className="font-bold text-[#1F2933]">Week {scheduleIndex + 1}</span>
                        <span className="text-[#667085]">Ayah {schedule.ayahFrom}-{schedule.ayahTo}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#E3EAE6]/60 flex items-center justify-between text-[11px]">
                    <span className="text-[#667085]">Completed:</span><span className="font-extrabold text-[#1F2933]">{completedCount} / {classStudents.length} Students</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {currentTarget && (
          <Card className="p-4 sm:p-5 bg-white border border-[#E3EAE6] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><span className="text-[10px] font-bold uppercase tracking-wider text-[#0F6B50]">Target In Focus</span><h3 className="text-base font-extrabold text-[#1F2933]">{currentTarget.surahName || currentTarget.criteria}</h3></div>
            <div className="grid grid-cols-3 gap-4 bg-[#FAF8F2] px-4 py-2 rounded-xl border border-[#E3EAE6]">
              <div className="text-center"><span className="text-[9px] font-bold uppercase text-[#667085]">Completed</span><p className="text-sm font-extrabold text-emerald-700">{stats.completed}</p></div>
              <div className="text-center border-x border-[#E3EAE6] px-3"><span className="text-[9px] font-bold uppercase text-[#667085]">Partial</span><p className="text-sm font-extrabold text-amber-700">{stats.partial}</p></div>
              <div className="text-center"><span className="text-[9px] font-bold uppercase text-[#667085]">Pending</span><p className="text-sm font-extrabold text-[#667085]">{stats.pending}</p></div>
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E3EAE6]">
          <div className="relative w-full sm:w-72"><Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#667085]" /><input type="text" placeholder="Search student by name or adm..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[#E3EAE6] focus:border-[#0F6B50] outline-none" /></div>
          <div className="flex items-center gap-2 text-xs text-[#667085]"><span className="font-bold text-[#1F2933]">{filteredStudents.length}</span> Students in Class {selectedClass}</div>
        </div>
        {isLoading ? (
          <div className="text-center py-10"><div className="w-6 h-6 border-2 border-[#0F6B50] border-t-transparent rounded-full animate-spin mx-auto mb-2" /><p className="text-xs text-[#667085]">Loading Hifz data...</p></div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#E3EAE6]"><p className="text-sm font-bold text-[#1F2933]">No students found in Class {selectedClass}</p></div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((student) => {
              const studentId = student.id || student._id;
              const currentRecord = currentTarget ? records.find((record) => record.studentId === studentId && record.hifzTargetId === currentTarget.id) : null;
              return (
                <Card key={studentId} className="p-4 sm:p-5 bg-white border border-[#E3EAE6] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#0F6B50] transition-all">
                  <div className="flex items-center gap-3.5 min-w-[220px]"><Avatar name={student.name} gender={student.gender} size="md" ring /><div><h4 className="text-sm font-extrabold text-[#1F2933]">{student.name}</h4><p className="text-[11px] text-[#667085] mt-0.5">Adm: {student.admissionNumber || student.admissionNo || 'N/A'}</p></div></div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs flex-1 max-w-xl">
                    <div className="bg-[#FAF8F2] p-2.5 rounded-xl"><p className="text-[9px] font-bold text-[#667085] uppercase truncate">{currentTarget ? currentTarget.surahName || currentTarget.criteria : 'Target'}</p><p className="font-extrabold text-[#1F2933] mt-0.5 truncate">{currentRecord?.progress || 'Not Evaluated'}</p></div>
                    <div className="bg-[#FAF8F2] p-2.5 rounded-xl"><p className="text-[9px] font-bold text-[#667085] uppercase">Status</p><div className="mt-0.5">{currentRecord?.status === 'COMPLETED' ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700"><CheckCircle2 className="w-3 h-3" /> Completed</span> : currentRecord?.status === 'PARTIAL' ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700"><Clock className="w-3 h-3" /> Partial</span> : <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#667085]"><XCircle className="w-3 h-3" /> Pending</span>}</div></div>
                    <div className="bg-[#FAF8F2] p-2.5 rounded-xl col-span-2 sm:col-span-1"><p className="text-[9px] font-bold text-[#667085] uppercase">Remark</p><p className="text-[11px] text-[#667085] mt-0.5 truncate">{currentRecord?.remark || '-'}</p></div>
                  </div>
                  <Button size="sm" variant={currentRecord ? 'outline' : 'primary'} onClick={() => openRecordModal(student, currentTarget || undefined)} disabled={targets.length === 0} className={`text-xs font-bold ${currentRecord ? 'border-[#0F6B50] text-[#0F6B50] hover:bg-[#DDEDE5]' : 'bg-[#0F6B50] hover:bg-[#0A4D39] text-white'}`}>{currentRecord ? <><Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Record</> : <><Plus className="w-3.5 h-3.5 mr-1" /> Record Progress</>}</Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={isTargetModalOpen} onClose={() => setIsTargetModalOpen(false)} title={targetIdToEdit ? `Edit Hifz Target (Class ${selectedClass})` : `Create Hifz Target (Class ${selectedClass})`}>
        <form onSubmit={handleSaveTarget} className="space-y-4 pt-2">
          <div><label className="block text-xs font-bold text-[#1F2933] mb-1">Surah Name</label><Input value={surahName} onChange={(e) => setSurahName(e.target.value)} placeholder="Al-Baqarah" required /></div>
          <div><label className="block text-xs font-bold text-[#1F2933] mb-1">Total Ayath Need to Memorize</label><Input type="number" min={1} value={totalAyahsToMemorize} onChange={(e) => setTotalAyahsToMemorize(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-[#1F2933] mb-1">Date From</label><Input type="date" value={targetStartDate} onChange={(e) => setTargetStartDate(e.target.value)} required /></div>
            <div><label className="block text-xs font-bold text-[#1F2933] mb-1">Date To</label><Input type="date" value={targetEndDate} onChange={(e) => setTargetEndDate(e.target.value)} required /></div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3"><h4 className="text-xs font-extrabold text-[#1F2933]">Date and Ayath Numbers</h4><button type="button" onClick={() => setSchedules((items) => [...items, emptySchedule()])} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F6B50] hover:underline"><Plus className="w-3.5 h-3.5" /> Add New Date and Ayath Number</button></div>
            {schedules.map((schedule, index) => (
              <div key={index} className="rounded-2xl border border-[#E3EAE6] bg-[#FAF8F2] p-3 space-y-3">
                <div className="flex items-center justify-between"><span className="text-[11px] font-extrabold text-[#1F2933]">Week {index + 1}</span>{schedules.length > 1 && <button type="button" onClick={() => setSchedules((items) => items.filter((_, i) => i !== index))} className="text-[11px] font-bold text-rose-600">Remove</button>}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[11px] font-bold text-[#667085] mb-1">Date From</label><Input type="date" value={toDateInput(schedule.dateFrom)} onChange={(e) => updateSchedule(index, { dateFrom: e.target.value })} required /></div>
                  <div><label className="block text-[11px] font-bold text-[#667085] mb-1">Date To</label><Input type="date" value={toDateInput(schedule.dateTo)} onChange={(e) => updateSchedule(index, { dateTo: e.target.value })} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[11px] font-bold text-[#667085] mb-1">Ayath From</label><Input type="number" min={1} value={schedule.ayahFrom} onChange={(e) => updateSchedule(index, { ayahFrom: Number(e.target.value) })} required /></div>
                  <div><label className="block text-[11px] font-bold text-[#667085] mb-1">Ayath To</label><Input type="number" min={1} value={schedule.ayahTo} onChange={(e) => updateSchedule(index, { ayahTo: Number(e.target.value) })} required /></div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E3EAE6]"><Button type="button" variant="outline" size="sm" onClick={() => setIsTargetModalOpen(false)}>Cancel</Button><Button type="submit" variant="primary" size="sm" disabled={isSavingTarget} className="bg-[#0F6B50] hover:bg-[#0A4D39] text-white font-bold">{isSavingTarget ? 'Saving...' : targetIdToEdit ? 'Update Target' : 'Create Target'}</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)} title={`Record Hifz Progress: ${activeStudent?.name || ''}`}>
        <form onSubmit={handleSaveRecord} className="space-y-4 pt-2">
          <div className="bg-[#FAF8F2] p-3.5 rounded-2xl border border-[#E3EAE6] flex items-center justify-between"><div><h4 className="text-xs font-extrabold text-[#1F2933]">{activeStudent?.name}</h4><p className="text-[11px] text-[#667085]">Adm: {activeStudent?.admissionNumber || activeStudent?.admissionNo} | Class {selectedClass}</p></div><span className="text-[10px] font-bold text-[#0F6B50] bg-[#DDEDE5] px-2.5 py-1 rounded-md">Class {selectedClass}</span></div>
          <div><label className="block text-xs font-bold text-[#1F2933] mb-1">Select Class Hifz Target</label><select value={selectedTargetIdForRecord} onChange={(e) => { setSelectedTargetIdForRecord(e.target.value); if (activeStudent) syncRecordForm(activeStudent, e.target.value); }} className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#0F6B50] focus:ring-2 focus:ring-emerald-400 outline-none font-bold bg-white text-[#1F2933]" required>{targets.map((target, index) => <option key={target.id} value={target.id}>Target {index + 1}: {target.surahName || target.criteria} ({formatDate(target.startDate)} - {formatDate(target.endDate)})</option>)}</select></div>
          <div><label className="block text-xs font-bold text-[#1F2933] mb-1">Evaluation Date</label><Input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-bold text-[#1F2933] mb-1">Completed Ayath From</label><Input type="number" min={1} value={completedAyahFrom} onChange={(e) => setCompletedAyahFrom(e.target.value)} required /></div>
            <div><label className="block text-xs font-bold text-[#1F2933] mb-1">Completed Ayath To</label><Input type="number" min={1} value={completedAyahTo} onChange={(e) => setCompletedAyahTo(e.target.value)} required /></div>
          </div>
          <div><label className="block text-xs font-bold text-[#1F2933] mb-1.5">Evaluation Status</label><div className="grid grid-cols-3 gap-2">{(['COMPLETED', 'PARTIAL', 'NOT_COMPLETED'] as HifzRecordStatus[]).map((status) => <button key={status} type="button" onClick={() => setRecordStatus(status)} className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${recordStatus === status ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20' : 'bg-white border-[#E3EAE6] text-[#667085]'}`}>{status === 'NOT_COMPLETED' ? 'Incomplete' : status === 'PARTIAL' ? 'Partial' : 'Completed'}</button>)}</div></div>
          <div><label className="block text-xs font-bold text-[#1F2933] mb-1">Teacher Remark / Notes</label><textarea value={recordRemark} onChange={(e) => setRecordRemark(e.target.value)} rows={2} className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#E3EAE6] focus:border-[#0F6B50] outline-none" /></div>
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E3EAE6]"><Button type="button" variant="outline" size="sm" onClick={() => setIsRecordModalOpen(false)}>Cancel</Button><Button type="submit" variant="primary" size="sm" disabled={isSavingRecord} className="bg-[#0F6B50] hover:bg-[#0A4D39] text-white font-bold">{isSavingRecord ? 'Saving...' : 'Save Hifz Record'}</Button></div>
        </form>
      </Modal>
    </div>
  );
};
