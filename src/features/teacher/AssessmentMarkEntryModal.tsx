import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Student, ExamTerm } from '../../types';
import { EXAM_TERMS } from '../../data/madrasaCurriculum';
import {
  assessmentService,
  StudentMarksSubject,
  StudentMarkRecord,
} from '../../services/assessmentService';
import { useNotifications } from '../../context/NotificationContext';
import { ClassAccessItem } from '../../services/classService';
import {
  Save,
  Search,
  BookOpen,
  Calculator,
  AlertCircle,
  XCircle,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { calculateGradeFromMarks, getGradeColor } from '../../utils/gradeCalculator';

interface SubjectMarkRowState {
  marksObtained: number | '';
  maxMarks: number;
  isAbsent: boolean;
  remarks: string;
}

interface AssessmentMarkEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClass?: string;
  initialStudentId?: string;
  initialTerm?: ExamTerm;
  teacherClasses: string[];
  allStudents: Student[];
  isSadhr: boolean;
  selectedClassAccess: ClassAccessItem | null;
  onSaved?: () => void;
}


export const AssessmentMarkEntryModal: React.FC<AssessmentMarkEntryModalProps> = ({
  isOpen,
  onClose,
  initialClass,
  initialStudentId,
  initialTerm = 'Half Yearly',
  teacherClasses,
  allStudents,
  isSadhr,
  selectedClassAccess,
  onSaved,
}) => {
  const { showToast } = useNotifications();

  // Selection states
  const [selectedClass, setSelectedClass] = useState<string>(
    initialClass || (teacherClasses.length > 0 ? teacherClasses[0] : '5')
  );
  const [selectedTerm, setSelectedTerm] = useState<ExamTerm>(initialTerm);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || '');

  // Data states
  const [subjects, setSubjects] = useState<StudentMarksSubject[]>([]);
  const [markRows, setMarkRows] = useState<Record<string, SubjectMarkRowState>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Input refs for keyboard navigation (Enter key advances to next subject)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Sync initial props whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const cls = isSadhr
        ? selectedClassAccess?.name.replace(/^Class\s*/i, '').trim() || ''
        : initialClass || (teacherClasses.length > 0 ? teacherClasses[0] : '5');
      setSelectedClass(cls);
      setSelectedTerm(initialTerm);
      if (initialStudentId) {
        setSelectedStudentId(initialStudentId);
      }
      setStudentSearch('');
    }
  }, [isOpen, initialClass, initialStudentId, initialTerm, isSadhr, selectedClassAccess, teacherClasses]);

  // Students eligible for the selected class
  const classStudents = useMemo(() => {
    const cleanSelectedClass = String(selectedClass).replace(/^Class\s*/i, '').trim();
    return allStudents.filter((s) => {
      const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
      return sClass === cleanSelectedClass;
    });
  }, [allStudents, selectedClass]);

  // Search filtered students for quick selection
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return classStudents;
    const q = studentSearch.toLowerCase();
    return classStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        (s.malayalamName && s.malayalamName.includes(q))
    );
  }, [classStudents, studentSearch]);

  // If no student is selected or active student changed outside the class, default to first student
  useEffect(() => {
    if (!isOpen) return;
    const exists = classStudents.some((s) => s.id === selectedStudentId);
    if (!exists && classStudents.length > 0) {
      setSelectedStudentId(classStudents[0].id);
    } else if (classStudents.length === 0) {
      setSelectedStudentId('');
    }
  }, [classStudents, selectedStudentId, isOpen]);

  const activeStudent = useMemo(
    () => classStudents.find((s) => s.id === selectedStudentId) || null,
    [classStudents, selectedStudentId]
  );

  // Fetch subjects & existing marks when activeStudent, selectedClass, or selectedTerm changes
  useEffect(() => {
    if (!isOpen || !selectedStudentId) {
      setSubjects([]);
      setMarkRows({});
      return;
    }

    let active = true;
    setIsLoading(true);

    const targetClassId = isSadhr && selectedClassAccess?.id ? selectedClassAccess.id : selectedClass;

    assessmentService
      .getStudentMarks(targetClassId, selectedTerm, selectedStudentId)
      .then((res: any) => {
        if (!active) return;
        const subList: StudentMarksSubject[] = res?.subjects || res?.data?.subjects || [];
        const existingMarks: StudentMarkRecord[] = res?.marks || res?.data?.marks || [];

        setSubjects(subList);

        // Build state rows mapping
        const rows: Record<string, SubjectMarkRowState> = {};
        subList.forEach((sub) => {
          const matched = existingMarks.find(
            (m) =>
              String(m.subjectId) === String(sub.id) ||
              String(m.subject) === String(sub.name) ||
              String(m.subject) === String(sub.id)
          );

          if (matched) {
            rows[sub.id] = {
              marksObtained: matched.isAbsent ? '' : (matched.marksObtained ?? ''),
              maxMarks: matched.maxMarks || 100,
              isAbsent: Boolean(matched.isAbsent),
              remarks: matched.remarks || '',
            };
          } else {
            rows[sub.id] = {
              marksObtained: '',
              maxMarks: 100,
              isAbsent: false,
              remarks: '',
            };
          }
        });

        setMarkRows(rows);
      })
      .catch((err) => {
        console.error('Failed to load student assessment marks:', err);
        showToast('Unable to load subject marks for this student');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, selectedStudentId, selectedClass, selectedTerm, isSadhr, selectedClassAccess, showToast]);

  // Live Summary calculation
  const summary = useMemo(() => {
    let totalObtained = 0;
    let totalMax = 0;
    let evaluatedCount = 0;
    let absentCount = 0;

    subjects.forEach((sub) => {
      const row = markRows[sub.id];
      if (!row) return;

      if (row.isAbsent) {
        absentCount += 1;
        totalMax += row.maxMarks;
      } else if (row.marksObtained !== '' && !isNaN(Number(row.marksObtained))) {
        totalObtained += Number(row.marksObtained);
        totalMax += row.maxMarks;
        evaluatedCount += 1;
      }
    });

    const percent = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    const overallGrade = totalMax > 0 ? calculateGradeFromMarks(totalObtained, totalMax).grade : '-';

    return {
      totalObtained,
      totalMax,
      percent,
      overallGrade,
      evaluatedCount,
      absentCount,
      totalSubjects: subjects.length,
    };
  }, [subjects, markRows]);

  const handleMarkChange = (subjectId: string, val: string) => {
    const row = markRows[subjectId] || { marksObtained: '', maxMarks: 100, isAbsent: false, remarks: '' };
    if (val === '') {
      setMarkRows((prev) => ({
        ...prev,
        [subjectId]: { ...row, marksObtained: '', isAbsent: false },
      }));
      return;
    }

    const num = Math.max(0, Math.min(row.maxMarks, Number(val)));
    setMarkRows((prev) => ({
      ...prev,
      [subjectId]: {
        ...row,
        marksObtained: isNaN(num) ? '' : num,
        isAbsent: false,
      },
    }));
  };

  const handleMaxMarksChange = (subjectId: string, val: string) => {
    const num = Math.max(1, Number(val) || 100);
    setMarkRows((prev) => {
      const row = prev[subjectId] || { marksObtained: '', maxMarks: 100, isAbsent: false, remarks: '' };
      const currentObtained = row.marksObtained === '' ? '' : Math.min(Number(row.marksObtained), num);
      return {
        ...prev,
        [subjectId]: {
          ...row,
          maxMarks: num,
          marksObtained: currentObtained,
        },
      };
    });
  };

  const handleToggleAbsent = (subjectId: string) => {
    setMarkRows((prev) => {
      const row = prev[subjectId] || { marksObtained: '', maxMarks: 100, isAbsent: false, remarks: '' };
      const nextAbsent = !row.isAbsent;
      return {
        ...prev,
        [subjectId]: {
          ...row,
          isAbsent: nextAbsent,
          marksObtained: nextAbsent ? '' : row.marksObtained,
        },
      };
    });
  };

  const handleRemarksChange = (subjectId: string, remarks: string) => {
    setMarkRows((prev) => ({
      ...prev,
      [subjectId]: {
        ...(prev[subjectId] || { marksObtained: '', maxMarks: 100, isAbsent: false, remarks: '' }),
        remarks,
      },
    }));
  };

  // Keyboard navigation: Enter moves to next subject input
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextSubject = subjects[index + 1];
      if (nextSubject && inputRefs.current[nextSubject.id]) {
        inputRefs.current[nextSubject.id]?.focus();
        inputRefs.current[nextSubject.id]?.select();
      }
    }
  };

  const handleSaveMarks = async () => {
    if (!activeStudent) {
      showToast('Please select a student to enter marks');
      return;
    }
    if (subjects.length === 0) {
      showToast('No subjects found for this class');
      return;
    }

    setIsSaving(true);
    try {
      const targetClassId = isSadhr && selectedClassAccess?.id ? selectedClassAccess.id : selectedClass;

      const marksPayload = subjects.map((sub) => {
        const row = markRows[sub.id] || { marksObtained: '', maxMarks: 100, isAbsent: false, remarks: '' };
        return {
          subjectId: sub.id,
          subjectName: sub.name,
          marksObtained: row.isAbsent ? 0 : Number(row.marksObtained) || 0,
          maxMarks: row.maxMarks || 100,
          isAbsent: row.isAbsent,
          remarks: row.remarks || '',
        };
      });

      await assessmentService.saveStudentMarks({
        classId: targetClassId,
        assessmentId: selectedTerm,
        studentId: activeStudent.id,
        marks: marksPayload,
      });

      showToast(`✓ All marks saved successfully for ${activeStudent.name}!`);
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save student marks:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to save marks';
      showToast(`✕ ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add / Update Assessment Marks"
      subtitle="Enter all subject marks for a single selected student"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Step 1: Selection Header (Class, Term, Student) */}
        <div className="bg-[#FAF8F2] p-4 rounded-2xl border border-[#E3EAE6] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Class Selector */}
            {!isSadhr ? (
              <Select
                label="Class"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedStudentId('');
                }}
              >
                {teacherClasses.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </Select>
            ) : (
              <div>
                <label className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
                  Class
                </label>
                <div className="px-3 py-2 bg-white rounded-xl border border-[#E3EAE6] text-xs font-bold text-[#0F6B50]">
                  {selectedClassAccess?.name || `Class ${selectedClass}`}
                </div>
              </div>
            )}

            {/* Assessment / Exam Term Selector */}
            <Select
              label="Assessment (Exam / Term)"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value as ExamTerm)}
            >
              {EXAM_TERMS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.titleMalayalam})
                </option>
              ))}
            </Select>
          </div>

          {/* Student Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-5">
              <Input
                label="Search Student"
                placeholder="Type student name or admission no..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-[#667085]" />}
              />
            </div>
            <div className="sm:col-span-7">
              <Select
                label="Select Student"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {filteredStudents.length === 0 ? (
                  <option value="">No matching students</option>
                ) : (
                  filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Adm: {s.admissionNo}) - Class {s.class}
                    </option>
                  ))
                )}
              </Select>
            </div>
          </div>
        </div>

        {/* Active Student Card Banner */}
        {activeStudent && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-[#DDEDE5]/60 to-[#FAF8F2] rounded-2xl border border-[#bbdcd0]">
            <div className="flex items-center gap-3">
              <Avatar name={activeStudent.name} gender={activeStudent.gender} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-[#1F2933] uppercase tracking-wide">
                    {activeStudent.name}
                  </h4>
                  <Badge variant="green" size="sm">
                    Class {activeStudent.class}
                  </Badge>
                </div>
                {activeStudent.malayalamName && (
                  <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">
                    {activeStudent.malayalamName}
                  </p>
                )}
                <p className="text-[11px] text-[#667085]">Adm No: {activeStudent.admissionNo}</p>
              </div>
            </div>

            {/* Live Total & Percentage Summary */}
            <div className="flex items-center gap-2.5 sm:gap-3 bg-white px-3.5 py-2 rounded-xl border border-[#E3EAE6] shadow-2xs">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-[#0F6B50]" />
                <span className="text-xs font-bold text-[#667085]">Total:</span>
                <span className="text-xs font-extrabold text-[#1F2933]">
                  {summary.totalObtained} / {summary.totalMax}
                </span>
              </div>
              <div className="h-4 w-px bg-[#E3EAE6]" />
              <div>
                <span className="text-xs font-bold text-[#667085]">Score: </span>
                <span className="text-xs font-black text-[#0F6B50]">{summary.percent}%</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getGradeColor(
                  summary.overallGrade
                )}`}
              >
                Grade {summary.overallGrade}
              </span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-12 text-center text-xs text-[#667085] flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-[#0F6B50] border-t-transparent rounded-full animate-spin" />
            <span>Loading subjects & existing assessment records...</span>
          </div>
        )}

        {/* Empty Subject Warning */}
        {!isLoading && subjects.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#E3EAE6] text-xs text-[#667085]">
            <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="font-bold text-[#1F2933]">No Subjects Configured for this Class</p>
            <p className="mt-1">Add subjects in Class Management to enter marks.</p>
          </div>
        )}

        {/* Step 2: Multi-Subject Marks Form Table */}
        {!isLoading && subjects.length > 0 && activeStudent && (
          <div className="border border-[#E3EAE6] rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F2] border-b border-[#E3EAE6] sticky top-0 z-10 text-[#667085] font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-2 text-center w-24">Max Marks</th>
                    <th className="py-2.5 px-2 w-32">Obtained Marks</th>
                    <th className="py-2.5 px-2 text-center w-20">Absent?</th>
                    <th className="py-2.5 px-2 text-center w-16">Grade</th>
                    <th className="py-2.5 px-3 min-w-[140px]">Usthad Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3EAE6]">
                  {subjects.map((sub, index) => {
                    const row = markRows[sub.id] || {
                      marksObtained: '',
                      maxMarks: 100,
                      isAbsent: false,
                      remarks: '',
                    };
                    const numObtained = row.marksObtained === '' ? null : Number(row.marksObtained);
                    const grade = row.isAbsent
                      ? 'ABSENT'
                      : numObtained !== null
                      ? calculateGradeFromMarks(numObtained, row.maxMarks).grade
                      : '-';

                    return (
                      <tr
                        key={sub.id}
                        className={`hover:bg-[#FAF8F2]/60 transition-colors ${
                          row.isAbsent ? 'bg-rose-50/40' : ''
                        }`}
                      >
                        {/* Subject Name & Code */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-[10px]"
                              style={{ backgroundColor: sub.color || '#0F6B50' }}
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-[#1F2933] text-xs truncate">
                                  {sub.name}
                                </span>
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                  {sub.code || sub.name.substring(0, 3).toUpperCase()}
                                </span>
                              </div>
                              {sub.malayalamTitle && (
                                <p className="font-malayalam text-[10px] text-[#0F6B50] font-semibold truncate">
                                  {sub.malayalamTitle}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Max Marks */}
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={row.maxMarks}
                            onChange={(e) => handleMaxMarksChange(sub.id, e.target.value)}
                            className="w-16 text-center py-1 rounded-lg border border-[#E3EAE6] bg-[#FAF8F2] text-xs font-bold text-[#1F2933] focus:border-[#0F6B50] outline-none"
                          />
                        </td>

                        {/* Marks Obtained Input */}
                        <td className="py-2.5 px-2">
                          <input
                            ref={(el) => {
                              inputRefs.current[sub.id] = el;
                            }}
                            type="number"
                            min={0}
                            max={row.maxMarks}
                            disabled={row.isAbsent}
                            placeholder={row.isAbsent ? 'ABS' : '0'}
                            value={row.isAbsent ? '' : row.marksObtained}
                            onChange={(e) => handleMarkChange(sub.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-black transition-all outline-none ${
                              row.isAbsent
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-[#1F2933] border-[#E3EAE6] focus:border-[#0F6B50] focus:ring-1 focus:ring-[#0F6B50]/30'
                            }`}
                          />
                        </td>

                        {/* Absent Checkbox / Toggle */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleAbsent(sub.id)}
                            className={`px-2 py-1 rounded-md text-[10px] font-black uppercase transition-all ${
                              row.isAbsent
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            {row.isAbsent ? 'Absent' : 'Present'}
                          </button>
                        </td>

                        {/* Grade Badge */}
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black border ${getGradeColor(
                              grade
                            )}`}
                          >
                            {grade}
                          </span>
                        </td>

                        {/* Optional Remarks */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            placeholder="Optional remark..."
                            value={row.remarks}
                            onChange={(e) => handleRemarksChange(sub.id, e.target.value)}
                            className="w-full py-1 px-2 rounded-lg border border-[#E3EAE6] bg-white text-[11px] text-[#1F2933] focus:border-[#0F6B50] outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 3: Single Action Save Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E3EAE6]">
          <p className="text-xs text-[#667085]">
            <span className="font-bold text-[#1F2933]">Tip:</span> Press{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">
              Enter
            </kbd>{' '}
            or{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">
              Tab
            </kbd>{' '}
            to jump directly to the next subject input.
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveMarks}
              isLoading={isSaving}
              disabled={isLoading || subjects.length === 0 || !activeStudent}
              leftIcon={<Save className="w-4 h-4" />}
              className="shadow-sm shadow-[#0F6B50]/20"
            >
              Save Marks
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
