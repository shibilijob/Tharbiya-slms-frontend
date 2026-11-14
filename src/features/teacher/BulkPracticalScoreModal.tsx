import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Avatar } from '../../components/common/Avatar';
import { Student } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { usePracticalStore } from '../../stores';
import { practicalScoreService, PracticalScore } from '../../services/practicalScoreService';
import { practicalCriteriaService } from '../../services/practicalCriteriaService';
import { AkhlaqCategoryMeta } from '../../data/madrasaCurriculum';
import { api } from '../../lib/axios';
import { mapBackendStudentToFrontend } from '../../services/studentService';
import { sortStudentsByRollNumber } from '../../utils/studentSorting';
import {
  HeartHandshake,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  CheckCheck,
  RotateCcw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface CellState {
  score: string;
  remarks: string;
  isSaved: boolean;
  isDirty: boolean;
}

interface BulkPracticalScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClass?: string;
  initialMonth?: number;
  initialYear?: number;
  initialSubjectId?: string;
  initialStudentId?: string;
  assignedClasses?: string[];
  students?: Student[];
  onSaved?: () => void;
  isSadhr?: boolean;
  selectedClassAccess?: any;
  selectedClassId?: string;
  onOpenManageSubjects?: () => void;
}

export const BulkPracticalScoreModal: React.FC<BulkPracticalScoreModalProps> = ({
  isOpen,
  onClose,
  initialClass,
  initialMonth,
  initialYear,
  initialSubjectId,
  initialStudentId,
  assignedClasses,
  students: propStudents,
  onSaved,
  isSadhr,
  selectedClassAccess,
  selectedClassId,
  onOpenManageSubjects,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { students: contextStudents } = useData();

  const targetSadhrClassId = selectedClassAccess?.id || selectedClassId;
  const [sadhrStudents, setSadhrStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (!isSadhr || !targetSadhrClassId || propStudents || !isOpen) {
      setSadhrStudents([]);
      return;
    }
    let active = true;
    api
      .get(`/muallim/classes/${targetSadhrClassId}/students`)
      .then((res) => {
        if (!active) return;
        const rows = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setSadhrStudents(rows.map((row: any) => mapBackendStudentToFrontend(row)));
      })
      .catch((err) => {
        console.error('Failed to load sadhr practical roster:', err);
        if (active) setSadhrStudents([]);
      });
    return () => {
      active = false;
    };
  }, [isSadhr, targetSadhrClassId, propStudents, isOpen]);

  const students = propStudents || (isSadhr && targetSadhrClassId ? sadhrStudents : contextStudents) || [];

  const storeSelectedMonth = usePracticalStore((s) => s.selectedMonth);
  const storeSelectedYear = usePracticalStore((s) => s.selectedYear);
  const recordBulkMonthlyScores = usePracticalStore((s) => s.recordBulkMonthlyScores);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth || storeSelectedMonth || now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear || storeSelectedYear || now.getFullYear());

  // Determine available classes for Muallim
  const availableClasses = useMemo(() => {
    if (isSadhr && selectedClassAccess) {
      return [selectedClassAccess.name.replace(/^Class\s*/i, '').trim()];
    }
    if (assignedClasses && assignedClasses.length > 0) {
      return Array.from(new Set(assignedClasses.map(c => String(c).replace(/^Class\s*/i, '').trim())))
        .filter(Boolean)
        .sort((a, b) => Number(a) - Number(b));
    }
    return [initialClass ? initialClass.replace(/^Class\s*/i, '').trim() : '5'];
  }, [assignedClasses, initialClass, isSadhr, selectedClassAccess]);

  const [selectedClass, setSelectedClass] = useState<string>(
    initialClass ? initialClass.replace(/^Class\s*/i, '').trim() : (availableClasses[0] || '5')
  );

  // Sync selectedClass if availableClasses changes or initialClass changes
  useEffect(() => {
    if (initialClass && availableClasses.includes(initialClass.replace(/^Class\s*/i, '').trim())) {
      setSelectedClass(initialClass.replace(/^Class\s*/i, '').trim());
    } else if (availableClasses[0] && !availableClasses.includes(selectedClass)) {
      setSelectedClass(availableClasses[0]);
    }
  }, [initialClass, availableClasses, selectedClass]);

  const [activeSubjectTab, setActiveSubjectTab] = useState<string>(initialSubjectId || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // If initialStudentId was passed, optionally pre-filter to that student
  useEffect(() => {
    if (initialStudentId && isOpen) {
      const target = students.find((s) => s.id === initialStudentId);
      if (target) {
        setSearchQuery(target.name);
      }
    } else if (isOpen) {
      setSearchQuery('');
    }
  }, [initialStudentId, isOpen, students]);

  // Loaded data states
  const [subjects, setSubjects] = useState<AkhlaqCategoryMeta[]>([]);
  // marksGrid: studentId -> practicalSubjectId -> CellState
  const [marksGrid, setMarksGrid] = useState<Record<string, Record<string, CellState>>>({});

  // Input elements ref matrix for arrow navigation: [subjectIndex][studentIndex]
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // All active students belonging to the currently selected class
  const allClassStudents = useMemo(() => {
    const targetClass = selectedClass.replace(/^Class\s*/i, '').trim();
    const filtered = students.filter((s) => {
      const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
      const isActive =
        !s.status ||
        String(s.status).toUpperCase() === 'ACTIVE' ||
        (s as any).isActive !== false;
      return sClass === targetClass && isActive;
    });
    return sortStudentsByRollNumber(filtered);
  }, [students, selectedClass]);

  // Students displayed in UI table (filtered by search query if any)
  const classStudents = useMemo(() => {
    if (!searchQuery.trim()) return allClassStudents;
    const q = searchQuery.toLowerCase();
    return allClassStudents.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.admissionNo.toLowerCase().includes(q) ||
      (s.malayalamName && s.malayalamName.toLowerCase().includes(q))
    );
  }, [allClassStudents, searchQuery]);

  // Load practical subjects and existing marks whenever modal opens or class/month/year changes
  useEffect(() => {
    if (!isOpen || !selectedClass) return;

    let active = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        // 1. Fetch practical subjects for the selected class from MongoDB
        const loadedSubjects = await practicalCriteriaService.fetchFromApi(selectedClass);
        if (!active) return;
        setSubjects(loadedSubjects);

        // 2. Fetch existing scores for this class, month, and year across all subjects
        const existingScores = await practicalScoreService.getMonthlyScores({
          classId: selectedClass,
          month: selectedMonth,
          year: selectedYear,
        });
        if (!active) return;

        // Build grid of existing scores
        const grid: Record<string, Record<string, CellState>> = {};
        existingScores.forEach((scoreRecord: PracticalScore) => {
          const rawStudent = scoreRecord.studentId as any;
          const sId = String(rawStudent?._id || rawStudent?.id || rawStudent || '');
          const rawSubject = scoreRecord.practicalSubjectId as any;
          const subId = String(rawSubject?._id || rawSubject?.id || rawSubject || '');
          if (!sId || !subId) return;
          if (!grid[sId]) grid[sId] = {};
          grid[sId][subId] = {
            score: String(scoreRecord.score),
            remarks: scoreRecord.remarks || '',
            isSaved: true,
            isDirty: false,
          };
        });

        setMarksGrid(grid);
      } catch (err) {
        if (!active) return;
        console.error('Failed to load bulk practical score data:', err);
        showToast('Failed to load practical subjects or saved marks');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [isOpen, selectedClass, selectedMonth, selectedYear]);

  // Handle individual mark change
  const handleMarkChange = (studentId: string, subjectId: string, value: string, maxScore: number) => {
    let cleanVal = value.trim();

    // Allow empty string to clear a mark
    if (cleanVal === '') {
      setMarksGrid((prev) => ({
        ...prev,
        [studentId]: {
          ...(prev[studentId] || {}),
          [subjectId]: {
            score: '',
            remarks: prev[studentId]?.[subjectId]?.remarks || '',
            isSaved: false,
            isDirty: true,
          },
        },
      }));
      return;
    }

    const num = Number(cleanVal);
    if (isNaN(num)) return;

    // Disallow negative marks and clamp to maxScore
    const clamped = Math.max(0, Math.min(num, maxScore));

    setMarksGrid((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectId]: {
          score: String(clamped),
          remarks: prev[studentId]?.[subjectId]?.remarks || '',
          isSaved: prev[studentId]?.[subjectId]?.isSaved ?? false,
          isDirty: true,
        },
      },
    }));
  };

  // Batch action: Set all students to maximum marks for a specific subject
  const handleSetSubjectMax = (subjectId: string, maxScore: number) => {
    setMarksGrid((prev) => {
      const next = { ...prev };
      classStudents.forEach((s) => {
        const sId = String(s.id || (s as any)._id || '');
        if (!next[sId]) next[sId] = {};
        next[sId][subjectId] = {
          score: String(maxScore),
          remarks: next[sId]?.[subjectId]?.remarks || '',
          isSaved: next[sId]?.[subjectId]?.isSaved ?? false,
          isDirty: true,
        };
      });
      return next;
    });
    showToast(`Set all students to full mark (${maxScore}) for this subject`);
  };

  // Batch action: Clear all marks for a specific subject
  const handleClearSubject = (subjectId: string) => {
    setMarksGrid((prev) => {
      const next = { ...prev };
      classStudents.forEach((s) => {
        const sId = String(s.id || (s as any)._id || '');
        if (next[sId] && next[sId][subjectId]) {
          next[sId][subjectId] = {
            score: '',
            remarks: '',
            isSaved: false,
            isDirty: true,
          };
        }
      });
      return next;
    });
    showToast('Cleared marks for this subject');
  };

  // Keyboard navigation across student inputs
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    subjectId: string,
    studentIndex: number
  ) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const nextKey = `${subjectId}_${studentIndex + 1}`;
      inputRefs.current[nextKey]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevKey = `${subjectId}_${studentIndex - 1}`;
      inputRefs.current[prevKey]?.focus();
    }
  };

  // Save all non-empty marks
  const handleSaveAll = async () => {
    if (subjects.length === 0) {
      showToast('No practical subjects available to save marks for');
      return;
    }

    if (allClassStudents.length === 0) {
      showToast('No active students in this class to grade');
      return;
    }

    // Collect all valid entries across ALL students in this class
    const entries: Array<{
      studentId: string;
      practicalSubjectId: string;
      score: number;
      remarks?: string;
    }> = [];

    let hasValidationError = false;
    let validationErrorMessage = '';

    for (const student of allClassStudents) {
      const studentIdStr = String(student.id || (student as any)._id || '');
      for (const subject of subjects) {
        const cell = marksGrid[studentIdStr]?.[subject.id] || marksGrid[student.id]?.[subject.id];
        if (cell && cell.score !== '' && cell.score !== undefined && cell.score !== null) {
          const scoreNum = Number(cell.score);
          const maxScore = subject.maxScore ?? 5;
          if (isNaN(scoreNum) || scoreNum < 0) {
            hasValidationError = true;
            validationErrorMessage = `Negative or invalid mark entered for ${student.name}`;
            break;
          }
          if (scoreNum > maxScore) {
            hasValidationError = true;
            validationErrorMessage = `Mark (${scoreNum}) for ${student.name} exceeds max mark (${maxScore}) in ${subject.title}`;
            break;
          }
          entries.push({
            studentId: studentIdStr,
            practicalSubjectId: subject.id,
            score: scoreNum,
            remarks: cell.remarks?.trim() || undefined,
          });
        }
      }
      if (hasValidationError) break;
    }

    if (hasValidationError) {
      showToast(validationErrorMessage);
      return;
    }

    if (entries.length === 0) {
      showToast('Please enter at least one practical mark before saving');
      return;
    }

    setIsSaving(true);
    try {
      await recordBulkMonthlyScores({
        classId: selectedClass,
        month: selectedMonth,
        year: selectedYear,
        entries,
      });

      // Mark all saved cells as isSaved = true, isDirty = false
      setMarksGrid((prev) => {
        const next = { ...prev };
        entries.forEach((e) => {
          if (next[e.studentId] && next[e.studentId][e.practicalSubjectId]) {
            next[e.studentId][e.practicalSubjectId] = {
              ...next[e.studentId][e.practicalSubjectId],
              isSaved: true,
              isDirty: false,
            };
          }
        });
        return next;
      });

      showToast(`✓ Saved ${entries.length} practical score(s) for Class ${selectedClass} (${MONTH_NAMES[selectedMonth - 1]} ${selectedYear})!`);
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save bulk practical scores:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save bulk practical scores';
      showToast(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Compute overall count of entered marks across all class students
  const totalEntriesCount = useMemo(() => {
    let count = 0;
    allClassStudents.forEach((student) => {
      const sId = String(student.id || (student as any)._id || '');
      subjects.forEach((subject) => {
        const cell = marksGrid[sId]?.[subject.id] || marksGrid[student.id]?.[subject.id];
        if (cell && cell.score !== '' && cell.score !== undefined && cell.score !== null) {
          count++;
        }
      });
    });
    return count;
  }, [allClassStudents, subjects, marksGrid]);

  const maxPossibleEntries = allClassStudents.length * subjects.length;

  // Filter visible subjects according to active tab
  const visibleSubjects = useMemo(() => {
    if (activeSubjectTab === 'ALL') return subjects;
    return subjects.filter((s) => s.id === activeSubjectTab);
  }, [subjects, activeSubjectTab]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Practical Score Entry"
      subtitle={`Enter and edit monthly practical marks for Class ${selectedClass} • ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Top Control Bar: Class, Month, Year & Search */}
        <div className="p-4 bg-[#FAF8F2] rounded-2xl border border-[#E3EAE6] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Class Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-[#E3EAE6] px-3 py-1.5 rounded-xl shadow-2xs">
              <span className="text-xs font-bold text-[#667085]">Class:</span>
              {availableClasses.length > 1 && !isSadhr ? (
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-[#1F2933] outline-none cursor-pointer"
                >
                  {availableClasses.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-extrabold text-[#0F6B50]">
                  Class {selectedClass}
                </span>
              )}
            </div>

            {/* Month & Year Navigator */}
            <div className="flex items-center gap-1 bg-white border border-[#E3EAE6] p-1 rounded-xl shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  if (selectedMonth === 1) {
                    setSelectedMonth(12);
                    setSelectedYear((y) => y - 1);
                  } else {
                    setSelectedMonth((m) => m - 1);
                  }
                }}
                className="p-1 rounded-lg text-[#0F6B50] hover:bg-[#DDEDE5]/40 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <Calendar className="w-3.5 h-3.5 text-[#0F6B50] ml-1" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-extrabold text-[#1F2933] outline-none cursor-pointer py-0.5"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-extrabold text-[#1F2933] outline-none cursor-pointer py-0.5"
              >
                {[selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  if (selectedMonth === 12) {
                    setSelectedMonth(1);
                    setSelectedYear((y) => y + 1);
                  } else {
                    setSelectedMonth((m) => m + 1);
                  }
                }}
                className="p-1 rounded-lg text-[#0F6B50] hover:bg-[#DDEDE5]/40 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Student Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9AA5B1] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-xs rounded-xl border border-[#E3EAE6] bg-white text-[#1F2933] placeholder-[#9AA5B1] focus:border-[#0F6B50] outline-none w-full md:w-52"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9AA5B1] hover:text-[#1F2933] cursor-pointer"
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Subjects Tabs / Selection Header */}
        {subjects.length > 0 && (
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 border-b border-[#E3EAE6]">
            <div className="flex items-center gap-1.5 min-w-max">
              <button
                type="button"
                onClick={() => setActiveSubjectTab('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeSubjectTab === 'ALL'
                    ? 'bg-[#0F6B50] text-white shadow-xs'
                    : 'bg-[#FAF8F2] text-[#667085] hover:bg-[#DDEDE5]/40'
                }`}
              >
                All Subjects ({subjects.length})
              </button>

              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setActiveSubjectTab(sub.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeSubjectTab === sub.id
                      ? 'bg-[#0F6B50] text-white shadow-xs'
                      : 'bg-[#FAF8F2] text-[#667085] hover:bg-[#DDEDE5]/40'
                  }`}
                >
                  <span>{sub.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      activeSubjectTab === sub.id
                        ? 'bg-white/20 text-white'
                        : 'bg-[#E3EAE6] text-[#667085]'
                    }`}
                  >
                    Max {sub.maxScore}
                  </span>
                </button>
              ))}
            </div>

            {onOpenManageSubjects && (
              <button
                type="button"
                onClick={onOpenManageSubjects}
                className="text-xs font-bold text-[#0F6B50] hover:text-[#084C3A] hover:underline flex items-center gap-1 shrink-0 ml-auto cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" /> Manage Subjects
              </button>
            )}
          </div>
        )}

        {/* Progress & Quick Stats Banner */}
        <div className="flex items-center justify-between text-xs text-[#667085] px-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              Students: <strong className="text-[#1F2933]">{allClassStudents.length}</strong>
              {searchQuery && (
                <span className="text-[11px] text-[#667085] ml-1">
                  ({classStudents.length} matching search)
                </span>
              )}
            </span>
            <span>•</span>
            <span className="font-semibold">
              Marks Recorded:{' '}
              <strong className="text-[#0F6B50]">
                {totalEntriesCount} / {maxPossibleEntries}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#667085] italic hidden sm:inline">
              Tip: Use ↑ / ↓ arrow keys to jump between student inputs
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div className="py-16 text-center text-sm text-[#667085]">
            <div className="animate-spin w-6 h-6 border-2 border-[#0F6B50] border-t-transparent rounded-full mx-auto mb-2" />
            Loading practical subjects and saved marks for Class {selectedClass}...
          </div>
        ) : subjects.length === 0 ? (
          <div className="py-12 px-6 text-center bg-[#FAF8F2] rounded-2xl border border-[#E3EAE6] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#1F2933]">No Practical Subjects Found</h3>
            <p className="text-xs text-[#667085] max-w-md mx-auto">
              There are no active practical subjects assigned to Class {selectedClass}. Please create practical subjects (e.g. Wudu, Salah, Adab, Writing) to start entering marks.
            </p>
            {onOpenManageSubjects && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenManageSubjects}
                leftIcon={<Layers className="w-4 h-4" />}
                className="mt-2"
              >
                Create Practical Subjects
              </Button>
            )}
          </div>
        ) : classStudents.length === 0 ? (
          <div className="py-12 px-6 text-center bg-[#FAF8F2] rounded-2xl border border-[#E3EAE6]">
            <p className="text-sm font-bold text-[#1F2933]">No active students found in Class {selectedClass}</p>
            {searchQuery && (
              <p className="text-xs text-[#667085] mt-1">No student matched "{searchQuery}"</p>
            )}
          </div>
        ) : (
          <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-1">
            {visibleSubjects.map((subject, subjectIdx) => {
              return (
                <div
                  key={subject.id}
                  className="bg-white rounded-2xl border border-[#E3EAE6] shadow-2xs overflow-hidden"
                >
                  {/* Subject Header */}
                  <div className="p-3.5 bg-gradient-to-r from-[#FAF8F2] to-white border-b border-[#E3EAE6] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center font-bold text-xs">
                        {subjectIdx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-[#1F2933] flex items-center gap-2">
                          <span>{subject.title}</span>
                          <span className="text-[11px] font-semibold text-[#667085]">
                            (Max Mark: {subject.maxScore})
                          </span>
                        </h4>
                        {subject.titleMalayalam && subject.titleMalayalam !== subject.title && (
                          <p className="font-malayalam text-[11px] text-[#0F6B50] font-semibold">
                            {subject.titleMalayalam}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick batch tools per subject */}
                    {(() => {
                      const subjectMax = subject.maxScore ?? 5;
                      return (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSetSubjectMax(subject.id, subjectMax)}
                            className="text-[11px] text-[#0F6B50] hover:text-[#084C3A] font-bold flex items-center gap-1 hover:underline cursor-pointer bg-white border border-[#E3EAE6] px-2 py-1 rounded-lg shadow-2xs"
                          >
                            <CheckCheck className="w-3 h-3" /> All Full ({subjectMax})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleClearSubject(subject.id)}
                            className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-white border border-[#E3EAE6] px-2 py-1 rounded-lg shadow-2xs"
                          >
                            <RotateCcw className="w-3 h-3" /> Clear
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Student Table for this Subject */}
                  {(() => {
                    const subjectMax = subject.maxScore ?? 5;
                    return (
                      <div className="divide-y divide-[#E3EAE6]/60">
                        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-[#FAF8F2]/60 text-[10px] font-extrabold uppercase tracking-wider text-[#667085]">
                          <div className="col-span-1 text-center">#</div>
                          <div className="col-span-5 sm:col-span-6">Student</div>
                          <div className="col-span-3 sm:col-span-3 text-center">
                            Mark (Max: {subjectMax})
                          </div>
                          <div className="col-span-3 sm:col-span-2 text-right">Status</div>
                        </div>

                        {classStudents.map((student, studentIdx) => {
                          const sId = String(student.id || (student as any)._id || '');
                          const cell = marksGrid[sId]?.[subject.id] || marksGrid[student.id]?.[subject.id];
                          const currentVal = cell?.score ?? '';
                          const isEntered = currentVal !== '';
                          const isSaved = cell?.isSaved && !cell?.isDirty;
                          const isDirty = cell?.isDirty;
                          const inputKey = `${subject.id}_${studentIdx}`;

                          return (
                            <div
                              key={student.id}
                              className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center hover:bg-[#FAF8F2]/40 transition-colors"
                            >
                              {/* Row Number */}
                              <div className="col-span-1 text-center text-xs font-bold text-[#667085]">
                                {studentIdx + 1}
                              </div>

                              {/* Student Info */}
                              <div className="col-span-5 sm:col-span-6 flex items-center gap-2.5 min-w-0">
                                <Avatar name={student.name} gender={student.gender} size="sm" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#1F2933] uppercase truncate">
                                    {student.name}
                                  </p>
                                  <p className="text-[10px] text-[#667085] truncate">
                                    Adm: {student.admissionNo}
                                  </p>
                                </div>
                              </div>

                              {/* Mark Input Field */}
                              <div className="col-span-3 sm:col-span-3 flex items-center justify-center gap-1.5">
                                <input
                                  ref={(el) => {
                                    inputRefs.current[inputKey] = el;
                                  }}
                                  type="number"
                                  min={0}
                                  max={subjectMax}
                                  value={currentVal}
                                  placeholder="—"
                                  onChange={(e) =>
                                    handleMarkChange(student.id, subject.id, e.target.value, subjectMax)
                                  }
                                  onKeyDown={(e) => handleKeyDown(e, subject.id, studentIdx)}
                                  className={`w-14 sm:w-16 h-8 text-center font-bold text-xs rounded-lg border outline-none transition-all ${
                                    isEntered
                                      ? 'bg-[#DDEDE5]/30 border-[#0F6B50] text-[#084C3A] font-extrabold focus:ring-1 focus:ring-[#0F6B50]'
                                      : 'bg-white border-[#E3EAE6] text-[#667085] focus:border-[#0F6B50]'
                                  }`}
                                />
                                <span className="text-[11px] font-semibold text-[#667085]">
                                  / {subjectMax}
                                </span>
                              </div>

                              {/* Status Indicator */}
                              <div className="col-span-3 sm:col-span-2 text-right">
                                {isDirty ? (
                                  <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                                    Unsaved
                                  </span>
                                ) : isSaved ? (
                                  <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                                    ✓ Saved
                                  </span>
                                ) : (
                                  <span className="inline-block text-[10px] font-semibold text-[#9AA5B1] bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                                    Empty
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Footer with Save All Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E3EAE6]">
          <div className="flex items-center gap-1.5 text-xs text-[#667085]">
            <Info className="w-3.5 h-3.5 text-[#0F6B50]" />
            <span>
              Saving will atomically persist marks for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}. Empty marks will be left unassigned.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAll}
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
              className="shadow-sm shadow-[#0F6B50]/20 min-w-[140px]"
            >
              Save All Marks ({totalEntriesCount})
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
