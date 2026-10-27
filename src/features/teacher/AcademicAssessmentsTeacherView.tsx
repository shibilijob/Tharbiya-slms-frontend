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
import { useClassStore, useSubjectStore, useAssessmentStore } from '../../stores';
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
import { Link, useSearchParams } from 'react-router-dom';
import { classService, ClassAccessItem } from '../../services/classService';
import { AssessmentMarkEntryModal } from './AssessmentMarkEntryModal';
import { calculateGradeFromMarks } from '../../utils/gradeCalculator';

const normalizeClassValue = (value?: string) =>
  String(value || '').replace(/^Class\s*/i, '').trim();

const subjectBelongsToClass = (subject: SubjectMeta, classValue: string) => {
  const selectedClass = normalizeClassValue(classValue);
  const subjectClassName = normalizeClassValue(subject.className);
  const subjectClassId = normalizeClassValue(String(subject.classId || ''));

  return subjectClassName === selectedClass || subjectClassId === selectedClass;
};

export const AcademicAssessmentsTeacherView: React.FC = () => {
  const { user } = useAuth();
  const { students, assessments } = useData();
  const fetchAssessments = useAssessmentStore((s) => s.fetchAssessments);
  const { showToast } = useNotifications();
  const [searchParams] = useSearchParams();
  const selectedClassId = searchParams.get('classId') || '';
  const isSadhr = user?.role === 'SADHR_MUALLIM';
  const [selectedClassAccess, setSelectedClassAccess] = useState<ClassAccessItem | null>(null);
  const [classAccessLoaded, setClassAccessLoaded] = useState(!isSadhr);

  const teacherAssignedClasses = useClassStore((s) => s.teacherAssignedClasses);
  const fetchAssignedClassesForTeacher = useClassStore((s) => s.fetchAssignedClassesForTeacher);

  React.useEffect(() => {
    if (user) {
      fetchAssignedClassesForTeacher(user);
    }
  }, [user, fetchAssignedClassesForTeacher]);

  useEffect(() => {
    if (!isSadhr) return;
    let active = true;
    setClassAccessLoaded(false);
    setSelectedClassAccess(null);
    setSelectedClassFilter('');
    if (!selectedClassId) { setClassAccessLoaded(true); return () => { active = false; }; }
    classService.getClassAccessList().then((classes) => {
      if (!active) return;
      const selected = classes.find((item) => item.id === selectedClassId) || null;
      setSelectedClassAccess(selected);
      setSelectedClassFilter(selected?.name.replace(/^Class\s*/i, '').trim() || '');
      setClassAccessLoaded(true);
    }).catch(() => { if (active) setClassAccessLoaded(true); });
    return () => { active = false; };
  }, [isSadhr, selectedClassId]);

  useEffect(() => {
    if (isSadhr && selectedClassAccess) {
      void fetchAssessments(selectedClassAccess.id);
    }
  }, [isSadhr, selectedClassAccess, fetchAssessments]);

  // Dynamic assigned classes for this Muallim
  const teacherUser = user as any;
  const teacherClasses = React.useMemo(() => {
    if (teacherAssignedClasses.length > 0) return teacherAssignedClasses;

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
    return unique.length > 0 ? unique : (user?.role === 'SADHR_MUALLIM' ? [] : ['4']);
  }, [teacherAssignedClasses, teacherUser, students, user]);

  // Filter students assigned to teacher's assigned classes
  const teacherStudents = students.filter(s => {
    const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
    return (isSadhr ? selectedClassAccess?.name.replace(/^Class\s*/i, '').trim() === sClass : teacherClasses.includes(sClass) || (user?.id && s.assignedTeacherId === user.id));
  });

  // Subjects list from service for the active class filter
  const [subjectsList, setSubjectsList] = useState<SubjectMeta[]>([]);

  // Filter toolbar state
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedTerm, setSelectedTerm] = useState<ExamTerm>('Half Yearly');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load subjects for filter view based on selected class
  useEffect(() => {
    const targetClass = selectedClassFilter || teacherClasses[0] || '';
    if (!targetClass) {
      setSubjectsList([]);
      return;
    }

    useSubjectStore.getState().fetchSubjects(targetClass).then((list) => {
      const classSubjects = (list || []).filter((subject) =>
        subjectBelongsToClass(subject, targetClass)
      );
      setSubjectsList(classSubjects);
      setSelectedSubject((current) =>
        current === 'All' || classSubjects.some((subject) => subject.id === current)
          ? current
          : 'All'
      );
    });
  }, [selectedClassFilter, teacherClasses]);

  useEffect(() => {
    if (!isSadhr && teacherClasses.length > 0 && !selectedClassFilter) {
      setSelectedClassFilter(teacherClasses[0]);
    }
  }, [teacherClasses, selectedClassFilter, isSadhr]);

  // Assessment Mark Entry Modal state
  const [modalInitialStudentId, setModalInitialStudentId] = useState<string>('');
  const [modalInitialClass, setModalInitialClass] = useState<string>('');
  const [modalInitialTerm, setModalInitialTerm] = useState<ExamTerm>('Half Yearly');


  // Filter students for marksheet view
  const filteredStudents = teacherStudents.filter(s => {
    const matchesClass = !selectedClassFilter || normalizeClassValue(s.class) === normalizeClassValue(selectedClassFilter);
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const handleOpenAddModal = (studentId?: string, _subject?: string, term?: ExamTerm) => {
    const student = studentId ? teacherStudents.find(s => s.id === studentId) : undefined;
    const initialClass = student ? normalizeClassValue(student.class) : (selectedClassFilter || teacherClasses[0] || '5');
    setModalInitialClass(initialClass);
    setModalInitialStudentId(studentId || '');
    setModalInitialTerm(term || selectedTerm);
    setIsModalOpen(true);
  };

  const handleModalSaved = () => {
    if (isSadhr && selectedClassAccess) {
      void fetchAssessments(selectedClassAccess.id);
    } else if (selectedClassFilter) {
      void fetchAssessments(selectedClassFilter);
    } else if (teacherClasses[0]) {
      void fetchAssessments(teacherClasses[0]);
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
    const overallGrade = calculateGradeFromMarks(totalEarned, totalMax).grade;

    return {
      evaluatedCount: studentRecords.length,
      totalEarned,
      totalMax,
      percent,
      overallGrade,
      records: studentRecords
    };
  };

  if (isSadhr && (!selectedClassId || (classAccessLoaded && !selectedClassAccess))) return <Card className="p-8 text-center"><h1 className="text-xl font-extrabold text-[#1F2933]">{selectedClassId ? 'Class unavailable' : 'Choose a class'}</h1><p className="mt-2 text-sm text-[#667085]">Open assessments from a valid selected class dashboard.</p><Link to="/admin/classes" className="mt-4 inline-flex text-sm font-bold text-[#0F6B50]">Go to Class Management</Link></Card>;
  if (isSadhr && !classAccessLoaded) return <Card className="p-8 text-center">Loading selected class assessments…</Card>;

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
        {!isSadhr && <Select
          label="Filter Class"
          value={selectedClassFilter}
          onChange={(e) => setSelectedClassFilter(e.target.value)}
        >
          {teacherClasses.map(c => (
            <option key={c} value={c}>
              Class {c} ({c}-ാം ക്ലാസ്)
            </option>
          ))}
        </Select>}

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

      {/* Multi-Subject Mark Entry Modal for Single Student */}
      <AssessmentMarkEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialClass={modalInitialClass}
        initialStudentId={modalInitialStudentId}
        initialTerm={modalInitialTerm}
        teacherClasses={teacherClasses}
        allStudents={teacherStudents}
        isSadhr={isSadhr}
        selectedClassAccess={selectedClassAccess}
        onSaved={handleModalSaved}
      />
    </div>
  );
};
