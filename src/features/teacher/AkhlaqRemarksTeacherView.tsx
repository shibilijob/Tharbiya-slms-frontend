import React, { useState, useEffect, useMemo } from 'react';
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
import { ACHIEVEMENT_BADGES } from '../../data/madrasaCurriculum';
import { AchievementCategory } from '../../types';
import { UpdatePracticalScoreModal } from './UpdatePracticalScoreModal';
import { CreatePracticalCriteriaModal } from './CreatePracticalCriteriaModal';
import {
  HeartHandshake,
  Award,
  Sparkles,
  BookmarkCheck,
  CalendarCheck,
  Edit2,
  Plus,
  Layers,
  ChevronLeft,
  ChevronRight,
  History,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useClassStore, usePracticalStore } from '../../stores';
import { PracticalScore } from '../../services/practicalScoreService';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const AkhlaqRemarksTeacherView: React.FC = () => {
  const { user } = useAuth();
  const { students, achievements, awardAchievement } = useData();
  const { showToast, pushNotification } = useNotifications();

  const teacherAssignedClasses = useClassStore((s) => s.teacherAssignedClasses);
  const fetchAssignedClassesForTeacher = useClassStore((s) => s.fetchAssignedClassesForTeacher);

  // Practical store
  const selectedMonth = usePracticalStore((s) => s.selectedMonth);
  const selectedYear = usePracticalStore((s) => s.selectedYear);
  const selectedPracticalSubjectId = usePracticalStore((s) => s.selectedPracticalSubjectId);
  const scoresByMonth = usePracticalStore((s) => s.scoresByMonth);
  const studentHistories = usePracticalStore((s) => s.studentHistories);
  const criteriaList = usePracticalStore((s) => s.criteriaList);
  const setSelectedMonth = usePracticalStore((s) => s.setSelectedMonth);
  const setSelectedYear = usePracticalStore((s) => s.setSelectedYear);
  const setSelectedPracticalSubjectId = usePracticalStore((s) => s.setSelectedPracticalSubjectId);
  const goToPreviousMonth = usePracticalStore((s) => s.goToPreviousMonth);
  const goToNextMonth = usePracticalStore((s) => s.goToNextMonth);
  const fetchMonthlyScores = usePracticalStore((s) => s.fetchMonthlyScores);
  const fetchCriteria = usePracticalStore((s) => s.fetchCriteria);
  const fetchStudentHistory = usePracticalStore((s) => s.fetchStudentHistory);

  useEffect(() => {
    if (user) {
      fetchAssignedClassesForTeacher(user);
    }
  }, [user, fetchAssignedClassesForTeacher]);

  // Dynamic assigned classes for this Muallim
  const teacherUser = user as any;
  const teacherClasses = useMemo(() => {
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
    return unique.length > 0 ? unique : ['4'];
  }, [teacherAssignedClasses, teacherUser, students, user]);

  const [selectedClass, setSelectedClass] = useState(teacherClasses[0] || '4');
  const [searchQuery, setSearchQuery] = useState('');

  // Keep selectedClass synced if classes change
  useEffect(() => {
    if (teacherClasses.length > 0 && !teacherClasses.includes(selectedClass) && selectedClass !== 'ALL') {
      setSelectedClass(teacherClasses[0]);
    }
  }, [teacherClasses, selectedClass]);

  // Fetch criteria and monthly scores whenever class, month, year, or subject changes
  useEffect(() => {
    if (selectedClass && selectedClass !== 'ALL') {
      fetchCriteria(selectedClass);
      fetchMonthlyScores(selectedClass, selectedPracticalSubjectId, selectedMonth, selectedYear);
    } else if (teacherClasses[0]) {
      fetchCriteria(teacherClasses[0]);
      fetchMonthlyScores(teacherClasses[0], selectedPracticalSubjectId, selectedMonth, selectedYear);
    }
  }, [selectedClass, selectedMonth, selectedYear, selectedPracticalSubjectId, teacherClasses, fetchCriteria, fetchMonthlyScores]);

  // Filter students assigned to teacher's assigned classes
  const teacherStudents = students.filter(s => {
    const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
    return teacherClasses.includes(sClass) || (user?.id && s.assignedTeacherId === user.id);
  });

  const filteredStudents = teacherStudents.filter(s => {
    const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
    const fClass = selectedClass.replace(/^Class\s*/i, '').trim();
    const matchesClass = selectedClass === 'ALL' || sClass === fClass;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.malayalamName && s.malayalamName.includes(searchQuery));
    return matchesClass && matchesSearch;
  });

  // Practical Score Modal state
  const [isPracticalScoreModalOpen, setIsPracticalScoreModalOpen] = useState(false);
  const [selectedPracticalStudentId, setSelectedPracticalStudentId] = useState(teacherStudents[0]?.id || '');
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);

  // Student History Modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Award Achievement Modal state
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [awardStudentId, setAwardStudentId] = useState(teacherStudents[0]?.id || '');
  const [awardCategory, setAwardCategory] = useState<AchievementCategory>('Weekly Hifz Completion');
  const [awardTitle, setAwardTitle] = useState('Weekly Hifz Completion');
  const [awardDesc, setAwardDesc] = useState(
    'Successfully completed the weekly designated Hifz target with accurate recitation and zero mistakes'
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenPracticalScore = (studentId?: string) => {
    if (studentId) setSelectedPracticalStudentId(studentId);
    setIsPracticalScoreModalOpen(true);
  };

  const handleOpenHistory = async (student: any) => {
    setHistoryStudent(student);
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);
    try {
      await fetchStudentHistory(student.id);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleJumpToMonth = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setIsHistoryModalOpen(false);
  };

  const handleAwardAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardStudentId) return;

    setIsSaving(true);
    try {
      const meta = ACHIEVEMENT_BADGES.find(b => b.category === awardCategory);
      await awardAchievement({
        studentId: awardStudentId,
        title: awardTitle || meta?.defaultTitle || 'Achievement Award',
        titleMalayalam: meta?.defaultMalayalam,
        category: awardCategory,
        description: awardDesc || meta?.description || 'Outstanding effort in Madrasa',
        badgeIcon: meta?.iconName || 'Award',
        awardedByTeacherName: user?.name || 'Usthad Shibili Ahsani'
      });

      const st = students.find(s => s.id === awardStudentId);
      showToast(`🏆 Milestone awarded to ${st?.name || 'Student'}`);

      if (st) {
        await pushNotification({
          userId: st.parentId,
          title: "Milestone Achieved! 🏆",
          message: `Congratulations! ${st.name} has been awarded "${awardTitle}" badge.`,
          category: "ACHIEVEMENT",
          actionUrl: "/parent/achievements"
        });
      }

      setIsAwardModalOpen(false);
    } catch (e) {
      console.error("Failed to award achievement", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Current Month's Scores Map for immediate O(1) lookup
  const currentKey = `${String(selectedClass).replace(/^Class\s*/i, '').trim()}_${selectedPracticalSubjectId}_${selectedYear}_${String(selectedMonth).padStart(2, '0')}`;
  const allKey = `${String(selectedClass).replace(/^Class\s*/i, '').trim()}_ALL_${selectedYear}_${String(selectedMonth).padStart(2, '0')}`;
  const currentScoresList: PracticalScore[] = scoresByMonth[currentKey] || scoresByMonth[allKey] || [];

  const selectedSubjectMeta = criteriaList.find(c => c.id === selectedPracticalSubjectId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <HeartHandshake className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Monthly Practical Scores & Awards
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Record month-wise practical scores (Writing, Swalath, Wudu, Adab) and monitor historical evaluations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="md"
            variant="outline"
            onClick={() => setIsCriteriaModalOpen(true)}
            leftIcon={<Layers className="w-4 h-4 text-[#0F6B50]" />}
          >
            Manage Subjects
          </Button>
          <Button
            size="md"
            variant="primary"
            onClick={() => handleOpenPracticalScore()}
            leftIcon={<HeartHandshake className="w-4 h-4" />}
            className="shadow-sm shadow-[#0F6B50]/20"
          >
            Update Practical Score
          </Button>
          <Button
            size="md"
            variant="gold"
            onClick={() => setIsAwardModalOpen(true)}
            leftIcon={<Award className="w-4 h-4" />}
          >
            Award Badge
          </Button>
        </div>
      </div>

      {/* Month Navigator & Filters Bar */}
      <Card className="p-4 sm:p-5 bg-white border border-[#E3EAE6] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Month Selector with Navigation Buttons */}
          <div className="flex items-center gap-2 bg-[#FAF8F2] border border-[#E3EAE6] p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-2 rounded-xl text-[#0F6B50] hover:bg-white hover:shadow-xs transition-all"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 px-3">
              <Calendar className="w-4 h-4 text-[#0F6B50]" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-sm font-extrabold text-[#1F2933] outline-none cursor-pointer"
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
                className="bg-transparent text-sm font-extrabold text-[#1F2933] outline-none cursor-pointer"
              >
                {[selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2 rounded-xl text-[#0F6B50] hover:bg-white hover:shadow-xs transition-all"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Class and Practical Subject Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Class Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F2] border border-[#E3EAE6] px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-[#667085]">Class:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#1F2933] outline-none cursor-pointer"
              >
                {teacherClasses.map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>

            {/* Practical Subject Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F2] border border-[#E3EAE6] px-3 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-[#667085]">Subject:</span>
              <select
                value={selectedPracticalSubjectId}
                onChange={(e) => setSelectedPracticalSubjectId(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#1F2933] outline-none cursor-pointer max-w-[180px] truncate"
              >
                <option value="ALL">All Subjects</option>
                {criteriaList.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title} (Max {cat.maxScore ?? 5})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-[#E3EAE6] bg-[#FAF8F2] text-[#1F2933] placeholder-[#9AA5B1] focus:border-[#0F6B50] outline-none w-36 sm:w-44"
            />
          </div>
        </div>
      </Card>

      {/* Two Column Grid: Practical Scores & Awarded Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Practical Scores List */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E3EAE6]">
              <div>
                <h3 className="text-base font-bold text-[#1F2933] flex items-center gap-2">
                  <span>Student Scores ({filteredStudents.length})</span>
                  <Badge variant="green" size="sm">
                    {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                  </Badge>
                </h3>
                <p className="text-xs text-[#667085]">
                  {selectedPracticalSubjectId !== 'ALL' && selectedSubjectMeta
                    ? `Showing monthly marks for ${selectedSubjectMeta.title} (Max: ${selectedSubjectMeta.maxScore ?? 5})`
                    : 'Showing overall monthly practical assessments'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenPracticalScore()}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Enter Scores
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-6 bg-[#FAF8F2] rounded-xl text-xs text-[#667085]">
                  No students found for the selected filter.
                </div>
              ) : (
                filteredStudents.map(student => {
                  // Find score for this student in the current month
                  const studentScores = currentScoresList.filter(s => s.studentId === student.id);

                  let isEvaluated = false;
                  let displayText = '';
                  let percentText = '';
                  let levelBadgeVariant: 'green' | 'gold' | 'gray' = 'gray';
                  let levelBadgeText = 'Not Evaluated';

                  if (selectedPracticalSubjectId !== 'ALL') {
                    // Specific subject selected
                    const subjectScore = studentScores.find(s => s.practicalSubjectId === selectedPracticalSubjectId);
                    if (subjectScore) {
                      isEvaluated = true;
                      displayText = `${subjectScore.score} / ${subjectScore.maxScore} Marks`;
                      percentText = `${subjectScore.percentage || Math.round((subjectScore.score / subjectScore.maxScore) * 100)}%`;
                      const pct = subjectScore.percentage || 0;
                      levelBadgeVariant = pct >= 75 ? 'green' : 'gold';
                      levelBadgeText = pct >= 90 ? 'Excellent' : pct >= 75 ? 'Very Good' : pct >= 50 ? 'Good' : 'Needs Practice';
                    } else {
                      displayText = 'Not Evaluated';
                      percentText = '—';
                    }
                  } else {
                    // All subjects
                    if (studentScores.length > 0) {
                      isEvaluated = true;
                      const totalScore = studentScores.reduce((sum, s) => sum + s.score, 0);
                      const totalMax = studentScores.reduce((sum, s) => sum + s.maxScore, 0);
                      displayText = `${totalScore} / ${totalMax} Marks`;
                      const pct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
                      percentText = `${pct}%`;
                      levelBadgeVariant = pct >= 75 ? 'green' : 'gold';
                      levelBadgeText = `${studentScores.length} of ${criteriaList.length} Graded`;
                    } else {
                      displayText = 'Not Evaluated';
                      percentText = '—';
                    }
                  }

                  return (
                    <div
                      key={student.id}
                      className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E3EAE6] hover:border-[#0F6B50] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} gender={student.gender} size="md" />
                        <div>
                          <p className="text-sm font-bold text-[#1F2933]">{student.name}</p>
                          <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">{student.malayalamName}</p>
                          <p className="text-[10px] text-[#667085]">Class {student.class} • Adm: {student.admissionNo}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-xs sm:text-sm font-black text-[#1F2933] bg-white border border-[#E3EAE6] px-2.5 py-1 rounded-xl inline-block shadow-2xs">
                              {displayText}
                            </span>
                            <span className="text-xs sm:text-sm font-black text-[#084C3A] bg-[#DDEDE5] px-2.5 py-1 rounded-xl inline-block">
                              {percentText}
                            </span>
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            {isEvaluated && (
                              <Badge variant={levelBadgeVariant} size="sm">
                                {levelBadgeText}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPracticalScore(student.id)}
                            className="text-xs py-1 px-2.5"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            {isEvaluated ? 'Edit' : 'Score'}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenHistory(student)}
                            className="text-xs py-1 px-2 text-[#0F6B50] border-[#0F6B50]/30 hover:bg-[#DDEDE5]/30"
                            title="View all months history"
                          >
                            <History className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right: Awarded Badges Shelf */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 sm:p-6 border-[#C9A227]/30">
            <h3 className="text-base font-bold text-[#1F2933] mb-4 pb-3 border-b border-[#E3EAE6] flex items-center justify-between">
              <span>Awarded Badges ({achievements.filter(a => teacherStudents.some(s => s.id === a.studentId)).length})</span>
              <Button size="sm" variant="gold" onClick={() => setIsAwardModalOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Award
              </Button>
            </h3>

            <div className="space-y-3">
              {achievements.length === 0 ? (
                <div className="text-center py-6 bg-[#FAF8F2] rounded-xl text-xs text-[#667085]">
                  No badges awarded yet. Award milestone badges to motivate students!
                </div>
              ) : (
                achievements.slice(0, 6).map(badge => {
                  const student = students.find(s => s.id === badge.studentId);
                  return (
                    <div
                      key={badge.id}
                      className="p-3 rounded-2xl bg-[#FAF8F2] border border-[#E3EAE6] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1F2933]">{badge.title}</p>
                          <p className="text-[10px] text-[#667085]">
                            {student?.name} (Class {student?.class}) • {new Date(badge.date || Date.now()).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="gold" size="sm">
                        Awarded
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Practical Score Modal (Month-Aware) */}
      <UpdatePracticalScoreModal
        isOpen={isPracticalScoreModalOpen}
        onClose={() => setIsPracticalScoreModalOpen(false)}
        initialStudentId={selectedPracticalStudentId}
        initialMonth={selectedMonth}
        initialYear={selectedYear}
        initialSubjectId={selectedPracticalSubjectId !== 'ALL' ? selectedPracticalSubjectId : undefined}
        onUpdated={() => {
          fetchMonthlyScores(selectedClass, selectedPracticalSubjectId, selectedMonth, selectedYear);
        }}
      />

      {/* Student Monthly History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Practical Score History: ${historyStudent?.name || 'Student'}`}
        subtitle={`Class ${historyStudent?.class || ''} • Historical Monthly Record`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {isLoadingHistory ? (
            <div className="text-center py-8 text-xs text-[#667085]">
              Loading historical monthly records...
            </div>
          ) : (
            (() => {
              const historyList: PracticalScore[] = (historyStudent && studentHistories[historyStudent.id]) || [];

              if (historyList.length === 0) {
                return (
                  <div className="text-center py-8 bg-[#FAF8F2] rounded-2xl border border-[#E3EAE6] text-xs text-[#667085]">
                    No historical practical scores recorded yet for this student.
                  </div>
                );
              }

              // Group scores by Year & Month
              const grouped: Record<string, PracticalScore[]> = {};
              historyList.forEach(item => {
                const key = `${MONTH_NAMES[item.month - 1]} ${item.year}`;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(item);
              });

              return (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {Object.entries(grouped).map(([monthLabel, items]) => {
                    const firstItem = items[0];
                    const isCurrentViewing = firstItem.month === selectedMonth && firstItem.year === selectedYear;

                    return (
                      <div
                        key={monthLabel}
                        className={`p-4 rounded-2xl border transition-all ${
                          isCurrentViewing
                            ? 'bg-emerald-50/60 border-[#0F6B50]'
                            : 'bg-[#FAF8F2] border-[#E3EAE6]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#E3EAE6]">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#0F6B50]" />
                            <span className="text-xs font-extrabold text-[#1F2933]">{monthLabel}</span>
                            {isCurrentViewing && (
                              <Badge variant="green" size="sm">Currently Viewing</Badge>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleJumpToMonth(firstItem.month, firstItem.year)}
                            className="text-xs py-0.5 px-2 text-[#0F6B50] border-[#0F6B50]/30"
                          >
                            Jump to {monthLabel}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {items.map(s => (
                            <div
                              key={s.id}
                              className="bg-white p-2.5 rounded-xl border border-[#E3EAE6] flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-bold text-[#1F2933]">{s.practicalSubjectName || 'Practical Subject'}</p>
                                {s.remarks && (
                                  <p className="text-[10px] text-[#667085] line-clamp-1 italic">"{s.remarks}"</p>
                                )}
                              </div>
                              <span className="font-black text-[#084C3A] bg-[#DDEDE5] px-2 py-0.5 rounded-lg whitespace-nowrap">
                                {s.score} / {s.maxScore}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}

          <div className="flex justify-end pt-3 border-t border-[#E3EAE6]">
            <Button variant="outline" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Practical Criteria Modal */}
      <CreatePracticalCriteriaModal
        isOpen={isCriteriaModalOpen}
        onClose={() => setIsCriteriaModalOpen(false)}
        initialClass={selectedClass !== 'ALL' ? selectedClass : teacherClasses[0] || '4'}
        assignedClasses={teacherClasses}
        onUpdated={() => {
          fetchCriteria(selectedClass !== 'ALL' ? selectedClass : teacherClasses[0]);
          fetchMonthlyScores(selectedClass !== 'ALL' ? selectedClass : teacherClasses[0], selectedPracticalSubjectId, selectedMonth, selectedYear);
        }}
      />

      {/* Award Badge Modal */}
      <Modal
        isOpen={isAwardModalOpen}
        onClose={() => setIsAwardModalOpen(false)}
        title="Award Milestone Badge"
        subtitle="Recognize student character, attendance & memorization milestones"
        maxWidth="md"
      >
        <form onSubmit={handleAwardAchievement} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
              Select Student
            </label>
            <Select
              value={awardStudentId}
              onChange={(e) => setAwardStudentId(e.target.value)}
            >
              {teacherStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (Class {s.class})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
              Milestone Category
            </label>
            <Select
              value={awardCategory}
              onChange={(e) => {
                const cat = e.target.value as AchievementCategory;
                setAwardCategory(cat);
                const meta = ACHIEVEMENT_BADGES.find(b => b.category === cat);
                if (meta) {
                  setAwardTitle(meta.defaultTitle);
                  setAwardDesc(meta.description);
                }
              }}
            >
              {ACHIEVEMENT_BADGES.map(b => (
                <option key={b.category} value={b.category}>
                  {b.category}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Badge Title"
            value={awardTitle}
            onChange={(e) => setAwardTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
              Description / Reason
            </label>
            <textarea
              rows={2}
              value={awardDesc}
              onChange={(e) => setAwardDesc(e.target.value)}
              className="w-full rounded-xl border border-[#E3EAE6] bg-white p-2.5 text-xs text-[#1F2933] focus:border-[#0F6B50] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button variant="outline" size="sm" onClick={() => setIsAwardModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" type="submit" isLoading={isSaving}>
              Award Badge
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
