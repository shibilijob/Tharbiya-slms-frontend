import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Avatar } from '../../components/common/Avatar';
import { subjectService } from '../../services/subjectService';
import { SubjectMeta, EXAM_TERMS } from '../../data/madrasaCurriculum';
import { SubjectName, ExamTerm, AcademicAssessment } from '../../types';
import {
  GraduationCap,
  Plus,
  Edit2,
  Search,
  BookOpen,
  Users,
  Award,
  CheckCircle2,
  Calculator,
  Sparkles,
  TrendingUp,
  Layers
} from 'lucide-react';
import { formatDate, getGradeBadgeClass } from '../../utils/formatters';
import { api } from '../../lib/axios';

export const AcademicAssessmentsTeacherView: React.FC = () => {
  const { user } = useAuth();
  const { students, assessments, saveAssessment } = useData();
  const { showToast, pushNotification } = useNotifications();

  const [dynamicClasses, setDynamicClasses] = useState<string[]>([]);

  React.useEffect(() => {
    api.get<any>('/faculty-members')
      .then(res => {
        const teachers = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (Array.isArray(teachers) && teachers.length > 0) {
          const matched = teachers.find((t: any) =>
            (user?.id && (t.id === user.id || t._id === user.id)) ||
            (user?.email && t.email === user.email) ||
            (user?.phone && t.phone === user.phone) ||
            (user?.name && t.name && (
              t.name.toLowerCase() === user.name.toLowerCase() ||
              t.name.toLowerCase().includes(user.name.toLowerCase()) ||
              user.name.toLowerCase().includes(t.name.toLowerCase())
            ))
          ) || teachers.find((t: any) => t.role === 'MUALLIM') || teachers[0];

          if (matched && Array.isArray(matched.assignedClasses) && matched.assignedClasses.length > 0) {
            const classes = matched.assignedClasses
              .map((c: any) => String(c).replace(/^Class\s*/i, '').trim())
              .filter(Boolean);
            if (classes.length > 0) {
              setDynamicClasses(classes);
            }
          }
        }
      })
      .catch(() => {});
  }, [user]);

  // Dynamic assigned classes for this Muallim
  const teacherUser = user as any;
  const teacherClasses = React.useMemo(() => {
    if (dynamicClasses.length > 0) return dynamicClasses;

    let rawList: any[] = [];
    if (Array.isArray(teacherUser?.assignedClasses)) {
      rawList = teacherUser.assignedClasses;
    } else if (typeof teacherUser?.assignedClasses === 'string') {
      try {
        const parsed = JSON.parse(teacherUser.assignedClasses);
        rawList = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        rawList = [teacherUser.assignedClasses];
      }
    } else if (teacherUser?.assignedClass) {
      rawList = Array.isArray(teacherUser.assignedClass) ? teacherUser.assignedClass : [teacherUser.assignedClass];
    }

    const cleaned = rawList
      .map((c: any) => String(c).replace(/^Class\s*/i, '').trim())
      .filter(Boolean);

    if (cleaned.length > 0) return cleaned;

    const fromStudents = students
      .filter(s => s.assignedTeacherId === user?.id || (user?.name && s.teacherName === user.name))
      .map(s => String(s.class).replace(/^Class\s*/i, '').trim());
    const unique = Array.from(new Set(fromStudents)).filter(Boolean);
    return unique.length > 0 ? unique : ['4'];
  }, [dynamicClasses, teacherUser, students, user]);

  // Filter students assigned to teacher's assigned classes
  const teacherStudents = students.filter(s => {
    const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
    return teacherClasses.includes(sClass) || (user?.id && s.assignedTeacherId === user.id);
  });

  // Subjects list from service
  const [subjectsList, setSubjectsList] = useState<SubjectMeta[]>([]);

  useEffect(() => {
    subjectService.fetchFromApi().then((list) => {
      if (list && list.length > 0) setSubjectsList(list);
      else setSubjectsList(subjectService.getAll());
    });
  }, []);

  // Filter toolbar state
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedTerm, setSelectedTerm] = useState<ExamTerm>('Half Yearly');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form state
  const [formClass, setFormClass] = useState<string>(teacherClasses[0] || '5');
  const [targetStudentId, setTargetStudentId] = useState(teacherStudents[0]?.id || '');
  const [formSubject, setFormSubject] = useState<string>('Quran');
  const [formExamTerm, setFormExamTerm] = useState<ExamTerm>('Half Yearly');
  const [formMarks, setFormMarks] = useState('90');
  const [formMaxMarks, setFormMaxMarks] = useState('100');
  const [formGrade, setFormGrade] = useState<'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D'>('A+');
  const [formRemarks, setFormRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto calculate grade from marks
  const computeGrade = (obtained: number, max: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' => {
    if (!max || max <= 0) return 'A+';
    const ratio = obtained / max;
    if (ratio >= 0.9) return 'A+';
    if (ratio >= 0.8) return 'A';
    if (ratio >= 0.7) return 'B+';
    if (ratio >= 0.6) return 'B';
    if (ratio >= 0.5) return 'C+';
    if (ratio >= 0.4) return 'C';
    return 'D';
  };

  const handleMarksChange = (marksVal: string, maxMarksVal: string) => {
    setFormMarks(marksVal);
    setFormMaxMarks(maxMarksVal);
    const ob = parseInt(marksVal) || 0;
    const mx = parseInt(maxMarksVal) || 100;
    setFormGrade(computeGrade(ob, mx));
  };

  // Filter students for marksheet view
  const filteredStudents = teacherStudents.filter(s => {
    const matchesClass = selectedClassFilter === 'All' || s.class === selectedClassFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // Filter students for modal dropdown based on formClass
  const modalClassStudents = teacherStudents.filter(s => s.class === formClass);

  const handleOpenAddModal = (studentId?: string, subject?: string, term?: ExamTerm) => {
    const student = studentId ? teacherStudents.find(s => s.id === studentId) : teacherStudents[0];
    const initialClass = student?.class || (selectedClassFilter !== 'All' ? selectedClassFilter : (teacherClasses[0] || '5'));
    const initialStudentId = studentId || teacherStudents.find(s => s.class === initialClass)?.id || teacherStudents[0]?.id || '';
    const initialSub = (subject && subject !== 'All') ? subject : (selectedSubject !== 'All' ? selectedSubject : (subjectsList[0]?.id || 'Quran'));
    const initialTerm = term || selectedTerm;

    setFormClass(initialClass);
    setTargetStudentId(initialStudentId);
    setFormSubject(initialSub);
    setFormExamTerm(initialTerm);

    // Check if existing record exists
    const existing = assessments.find(
      a => a.studentId === initialStudentId && a.subject === initialSub && a.examTerm === initialTerm
    );

    if (existing) {
      setFormMarks(String(existing.obtainedMarks));
      setFormMaxMarks(String(existing.maxMarks));
      setFormGrade(existing.grade);
      setFormRemarks(existing.remarks || '');
    } else {
      setFormMarks('');
      setFormMaxMarks('100');
      setFormGrade('A');
      setFormRemarks('');
    }

    setIsModalOpen(true);
  };

  // When class changes inside modal, sync student selection
  const handleModalClassChange = (newClass: string) => {
    setFormClass(newClass);
    const firstInClass = teacherStudents.find(s => s.class === newClass);
    if (firstInClass) {
      setTargetStudentId(firstInClass.id);
      syncExistingRecord(firstInClass.id, formSubject, formExamTerm);
    }
  };

  // When student, subject, or term changes inside modal, check if record exists and prefill
  const syncExistingRecord = (stId: string, sub: string, term: ExamTerm) => {
    const existing = assessments.find(
      a => a.studentId === stId && a.subject === sub && a.examTerm === term
    );
    if (existing) {
      setFormMarks(String(existing.obtainedMarks));
      setFormMaxMarks(String(existing.maxMarks));
      setFormGrade(existing.grade);
      setFormRemarks(existing.remarks || '');
    }
  };

  const handleSaveAssessmentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId) return;

    setIsSaving(true);
    try {
      const marksNum = parseInt(formMarks) || 0;
      const maxMarksNum = parseInt(formMaxMarks) || 100;

      await saveAssessment({
        studentId: targetStudentId,
        subject: formSubject as SubjectName,
        examTerm: formExamTerm,
        date: new Date().toISOString().split('T')[0],
        maxMarks: maxMarksNum,
        obtainedMarks: marksNum,
        grade: formGrade,
        remarks: formRemarks || undefined,
        teacherId: user?.id || 'teacher-1'
      });

      const st = students.find(s => s.id === targetStudentId);
      showToast(`✓ ${formSubject} (${formExamTerm}) marks saved for ${st?.name || 'Student'}`);

      // Push notification to parent
      if (st) {
        await pushNotification({
          userId: st.parentId,
          title: "New Assessment Marks Published",
          message: `${formSubject} ${formExamTerm} marks entered for ${st.name}: ${marksNum}/${maxMarksNum} (Grade ${formGrade})`,
          category: "ASSESSMENT",
          actionUrl: "/parent/progress"
        });
      }

      setIsModalOpen(false);
    } catch (e) {
      console.error("Failed to save assessment", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to compute a student's total marks and overall percentage across all evaluated subjects for the selected term
  const getStudentTermTotals = (studentId: string) => {
    const studentRecords = assessments.filter(
      a => a.studentId === studentId && a.examTerm === selectedTerm
    );

    let totalEarned = 0;
    let totalMax = 0;
    studentRecords.forEach(r => {
      totalEarned += r.obtainedMarks;
      totalMax += r.maxMarks;
    });

    const percent = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
    const overallGrade = computeGrade(totalEarned, totalMax);

    return {
      evaluatedCount: studentRecords.length,
      totalEarned,
      totalMax,
      percent,
      overallGrade,
      records: studentRecords
    };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Academic Assessments & All Subjects Marksheet
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Comprehensive Madrasa marksheet showing all subject scores for <strong>{selectedTerm}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="md"
            variant="primary"
            onClick={() => handleOpenAddModal()}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm shadow-[#0F6B50]/20"
          >
            Add Assessment Mark
          </Button>
        </div>
      </div>

      {/* Control Selectors: Class, Subject, Exam Term, Search */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-[#E3EAE6] shadow-2xs">
        {/* Class Filter */}
        <Select
          label="Filter Class"
          value={selectedClassFilter}
          onChange={(e) => setSelectedClassFilter(e.target.value)}
        >
          <option value="All">All Assigned Classes ({teacherClasses.map(c => `Class ${c}`).join(' & ')})</option>
          {teacherClasses.map(c => (
            <option key={c} value={c}>
              Class {c} ({c}-ാം ക്ലാസ്)
            </option>
          ))}
        </Select>

        {/* Subject Filter */}
        <Select
          label="Subject View"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="All">📚 All Subjects (Comprehensive View)</option>
          {subjectsList.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.malayalamName})
            </option>
          ))}
        </Select>

        {/* Exam Term Filter */}
        <Select
          label="Exam Term"
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value as ExamTerm)}
        >
          {EXAM_TERMS.map(t => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.titleMalayalam})
            </option>
          ))}
        </Select>

        {/* Search Student */}
        <div>
          <label className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
            Search Student
          </label>
          <Input
            placeholder="Search student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Marksheet Cards / Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-[#667085]">
            Showing {filteredStudents.length} Students • {selectedSubject === 'All' ? 'All Subjects View' : `Subject: ${selectedSubject}`} • Term: <strong className="text-[#0F6B50]">{selectedTerm}</strong>
          </p>
        </div>

        {filteredStudents.map(student => {
          const totals = getStudentTermTotals(student.id);

          if (selectedSubject === 'All') {
            // COMPREHENSIVE ALL SUBJECTS VIEW PER STUDENT
            return (
              <Card key={student.id} className="p-5 sm:p-6 bg-white border border-[#E3EAE6] hover:border-[#0F6B50] transition-all space-y-4">
                {/* Student Top Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E3EAE6]">
                  <div className="flex items-center gap-3">
                    <Avatar name={student.name} gender={student.gender} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-[#1F2933]">{student.name}</h4>
                        <span className="text-[10px] font-bold bg-[#DDEDE5] text-[#084C3A] px-2 py-0.5 rounded-full border border-[#bbdcd0]">
                          Class {student.class}
                        </span>
                      </div>
                      <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">{student.malayalamName}</p>
                      <p className="text-[11px] text-[#667085]">Adm No: {student.admissionNo}</p>
                    </div>
                  </div>

                  {/* Student Overall Summary Stats */}
                  <div className="flex items-center gap-3 bg-[#FAF8F2] p-2.5 rounded-2xl border border-[#E3EAE6]">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#667085] uppercase">Total Marks</p>
                      <p className="text-sm font-black text-[#1F2933]">
                        {totals.totalEarned} <span className="text-xs font-semibold text-[#667085]">/ {totals.totalMax}</span>
                      </p>
                    </div>
                    <div className="h-8 w-px bg-[#E3EAE6]" />
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-[#667085] uppercase">Overall</p>
                      <span className="text-sm font-black text-[#0F6B50]">
                        {totals.percent}%
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${getGradeBadgeClass(totals.overallGrade)}`}>
                      Grade {totals.overallGrade}
                    </span>
                  </div>
                </div>

                {/* All Subjects Marks Grid for this student */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-[#667085]">
                      Subject Marks Breakdown ({subjectsList.length} Subjects)
                    </h5>
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(student.id)}
                      className="text-xs font-bold text-[#0F6B50] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Quick Mark Entry
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5">
                    {subjectsList.map(sub => {
                      const record = assessments.find(
                        a => a.studentId === student.id && a.subject === sub.id && a.examTerm === selectedTerm
                      );

                      if (record) {
                        return (
                          <div
                            key={sub.id}
                            onClick={() => handleOpenAddModal(student.id, sub.id, selectedTerm)}
                            className="p-2.5 sm:p-3 rounded-2xl bg-[#FAF8F2] border-2 border-[#0F6B50] hover:bg-[#DDEDE5]/30 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-[#1F2933] group-hover:text-[#0F6B50] transition-colors truncate">
                                  {sub.name}
                                </p>
                                <p className="font-malayalam text-[10px] text-[#0F6B50] font-semibold truncate">{sub.malayalamName}</p>
                              </div>
                              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black shrink-0 ${getGradeBadgeClass(record.grade)}`}>
                                {record.grade}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#0F6B50]/20">
                              <span className="text-[11px] sm:text-xs font-black text-[#1F2933]">
                                {record.obtainedMarks} <span className="text-[10px] font-semibold text-[#667085]">/ {record.maxMarks}</span>
                              </span>
                              <span className="text-[10px] text-[#0F6B50] font-bold group-hover:underline flex items-center gap-0.5">
                                <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Edit
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Pending subject mark entry
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleOpenAddModal(student.id, sub.id, selectedTerm)}
                          className="p-2.5 sm:p-3 rounded-2xl bg-white border-2 border-[#0F6B50]/40 hover:border-[#0F6B50] hover:bg-[#FAF8F2] text-left transition-all flex flex-col justify-between shadow-2xs"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1F2933] truncate">{sub.name}</p>
                            <p className="font-malayalam text-[10px] text-[#0F6B50] font-medium truncate">{sub.malayalamName}</p>
                          </div>
                          <div className="mt-2 pt-1.5 border-t border-[#0F6B50]/20 flex items-center justify-between text-[10px] text-[#0F6B50] font-bold">
                            <span className="text-[#667085] font-normal">Pending</span>
                            <span className="flex items-center gap-0.5">+ Enter</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>
            );
          }

          // SINGLE SUBJECT VIEW (when a specific subject is filtered)
          const singleRecord = assessments.find(
            a => a.studentId === student.id && a.subject === selectedSubject && a.examTerm === selectedTerm
          );

          return (
            <Card key={student.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#0F6B50] transition-colors">
              <div className="flex items-center gap-3">
                <Avatar name={student.name} gender={student.gender} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#1F2933]">{student.name}</h4>
                    <span className="text-[10px] font-bold bg-[#DDEDE5] text-[#084C3A] px-2 py-0.5 rounded-full border border-[#bbdcd0]">
                      Class {student.class}
                    </span>
                  </div>
                  <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">{student.malayalamName}</p>
                  <p className="text-[10px] text-[#667085]">Adm: {student.admissionNo}</p>
                </div>
              </div>

              {singleRecord ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-black text-[#1F2933]">
                      {singleRecord.obtainedMarks} / {singleRecord.maxMarks}
                    </p>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${getGradeBadgeClass(singleRecord.grade)}`}>
                      Grade {singleRecord.grade}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenAddModal(student.id, selectedSubject, selectedTerm)}
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1 text-[#0F6B50]" /> Edit Mark
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleOpenAddModal(student.id, selectedSubject, selectedTerm)}
                  leftIcon={<Plus className="w-3.5 h-3.5 mr-0.5" />}
                >
                  Enter Mark
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Assessment Mark Modal with Class, Student, Subject, Exam Term */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add / Update Assessment Mark"
        subtitle="Record official examination score & Usthad academic evaluation"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAssessmentForm} className="space-y-4">
          {/* Row 1: Class and Student Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <Select
                label="Class"
                value={formClass}
                onChange={(e) => handleModalClassChange(e.target.value)}
              >
                {teacherClasses.map(c => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Select
                label="Select Student"
                value={targetStudentId}
                onChange={(e) => {
                  setTargetStudentId(e.target.value);
                  syncExistingRecord(e.target.value, formSubject, formExamTerm);
                }}
              >
                {modalClassStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Class {s.class}) - Adm: {s.admissionNo}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Row 2: Subject and Exam Term Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Subject"
              value={formSubject}
              onChange={(e) => {
                setFormSubject(e.target.value);
                syncExistingRecord(targetStudentId, e.target.value, formExamTerm);
              }}
            >
              {subjectsList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.malayalamName})
                </option>
              ))}
            </Select>

            <Select
              label="Exam Term"
              value={formExamTerm}
              onChange={(e) => {
                const termVal = e.target.value as ExamTerm;
                setFormExamTerm(termVal);
                syncExistingRecord(targetStudentId, formSubject, termVal);
              }}
            >
              {EXAM_TERMS.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.titleMalayalam})
                </option>
              ))}
            </Select>
          </div>

          {/* Row 3: Obtained Marks, Max Marks, and Auto-Grade */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Input
                label="Obtained Marks"
                type="number"
                min={0}
                max={parseInt(formMaxMarks) || 100}
                value={formMarks}
                onChange={(e) => handleMarksChange(e.target.value, formMaxMarks)}
                required
              />
            </div>
            <div>
              <Input
                label="Max Marks"
                type="number"
                min={1}
                max={500}
                value={formMaxMarks}
                onChange={(e) => handleMarksChange(formMarks, e.target.value)}
                required
              />
            </div>
            <div>
              <Select
                label="Calculated Grade"
                value={formGrade}
                onChange={(e) => setFormGrade(e.target.value as any)}
              >
                <option value="A+">A+ (90-100%)</option>
                <option value="A">A (80-89%)</option>
                <option value="B+">B+ (70-79%)</option>
                <option value="B">B (60-69%)</option>
                <option value="C+">C+ (50-59%)</option>
                <option value="C">C (40-49%)</option>
                <option value="D">D (&lt;40%)</option>
              </Select>
            </div>
          </div>

          {/* Row 4: Remarks */}
          <div>
            <label className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
              Usthad Remarks & Observations
            </label>
            <textarea
              rows={2}
              value={formRemarks}
              onChange={(e) => setFormRemarks(e.target.value)}
              placeholder="e.g. Excellent recitation, sound understanding of rules..."
              className="w-full rounded-xl border border-[#E3EAE6] bg-white p-3 text-xs text-[#1F2933] focus:border-[#0F6B50] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Assessment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


