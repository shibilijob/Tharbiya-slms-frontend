import React, { useState } from 'react';
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
import { practicalCriteriaService } from '../../services/practicalCriteriaService';
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
  Layers
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

import { api } from '../../lib/axios';

export const AkhlaqRemarksTeacherView: React.FC = () => {
  const { user } = useAuth();
  const { students, achievements, awardAchievement, getStudentSummary, akhlaqRecords } = useData();
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

  // Practical Score Modal state
  const [isPracticalScoreModalOpen, setIsPracticalScoreModalOpen] = useState(false);
  const [selectedPracticalStudentId, setSelectedPracticalStudentId] = useState(teacherStudents[0]?.id || '');
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);

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

  const getBadgeIcon = (cat: string) => {
    switch (cat) {
      case 'Weekly Hifz Completion': return <BookmarkCheck className="w-5 h-5" />;
      case 'Monthly Practical Score Topper': return <Sparkles className="w-5 h-5" />;
      case 'Monthly Attendance Topper': return <CalendarCheck className="w-5 h-5" />;
      default: return <Award className="w-5 h-5" />;
    }
  };

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
              Practical Score & Milestone Awards
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Monitor practical character assessments, evaluate Adab scores, and award student milestone badges
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="md"
            variant="outline"
            onClick={() => setIsCriteriaModalOpen(true)}
            leftIcon={<Layers className="w-4 h-4 text-[#0F6B50]" />}
          >
            Create / Edit Criteria
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

      {/* Two Column Grid: Practical Scores & Awarded Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Class 5 & 6 Practical Scores Overview */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E3EAE6]">
              <div>
                <h3 className="text-base font-bold text-[#1F2933]">
                  Student Practical Scores ({teacherStudents.length})
                </h3>
                <p className="text-xs text-[#667085]">Daily Adab, Prayer Discipline & Akhlaq Assessment</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenPracticalScore()}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Evaluate Scores
              </Button>
            </div>

            <div className="space-y-3">
              {teacherStudents.map(student => {
                const existingRecord = akhlaqRecords.find(r => r.studentId === student.id);
                
                let obtainedMarks = 0;
                let maxMarks = 0;
                if (existingRecord?.scores && Object.keys(existingRecord.scores).length > 0) {
                  Object.values(existingRecord.scores).forEach(s => {
                    obtainedMarks += s.score;
                    maxMarks += s.maxScore || 5;
                  });
                } else {
                  const defaultList = practicalCriteriaService.getAll();
                  maxMarks = defaultList.reduce((acc, c) => acc + (c.maxScore || 5), 0) || 20;
                  obtainedMarks = 0;
                }
                const isEvaluated = Boolean(existingRecord?.scores && Object.keys(existingRecord.scores).length > 0);
                const pct = (isEvaluated && maxMarks > 0) ? Math.round((obtainedMarks / maxMarks) * 100) : 0;

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
                            {isEvaluated ? `${obtainedMarks} / ${maxMarks} Marks` : 'Not Evaluated'}
                          </span>
                          <span className="text-xs sm:text-sm font-black text-[#084C3A] bg-[#DDEDE5] px-2.5 py-1 rounded-xl inline-block">
                            {isEvaluated ? `${pct}%` : '—'}
                          </span>
                        </div>
                        <p className="text-[9px] text-[#667085] font-bold uppercase mt-0.5">Practical Mark & Percentage</p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPracticalScore(student.id)}
                        className="text-xs py-1 px-2.5"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Update
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: Awarded Badges Shelf */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 sm:p-6 border-[#C9A227]/30">
            <h3 className="text-base font-bold text-[#1F2933] mb-4 pb-3 border-b border-[#E3EAE6] flex items-center justify-between">
              <span>Awarded Badges ({achievements.filter(a => teacherStudents.some(s => s.id === a.studentId)).length})</span>
              <Button size="sm" variant="gold" onClick={() => setIsAwardModalOpen(true)}>
                + Award Badge
              </Button>
            </h3>

            <div className="space-y-3">
              {achievements.filter(a => teacherStudents.some(s => s.id === a.studentId)).slice(0, 8).map(ach => {
                const st = teacherStudents.find(s => s.id === ach.studentId);
                return (
                  <div key={ach.id} className="p-3 rounded-2xl bg-gradient-to-br from-[#FAF8F2] to-[#FBF4DE] border border-[#C9A227]/30 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#C9A227]/20 text-[#9A7B1C] flex items-center justify-center shrink-0">
                      {getBadgeIcon(ach.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-extrabold text-[#1F2933] truncate">{ach.title}</p>
                      <p className="text-[10px] text-[#084C3A] font-bold">Recipient: {st?.name}</p>
                      <p className="text-[9px] text-[#667085]">{formatDate(ach.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Update Practical Score Modal */}
      <UpdatePracticalScoreModal
        isOpen={isPracticalScoreModalOpen}
        onClose={() => setIsPracticalScoreModalOpen(false)}
        initialStudentId={selectedPracticalStudentId}
      />

      {/* Create Practical Criteria Modal */}
      <CreatePracticalCriteriaModal
        isOpen={isCriteriaModalOpen}
        onClose={() => setIsCriteriaModalOpen(false)}
      />

      {/* Award Badge Modal */}
      <Modal
        isOpen={isAwardModalOpen}
        onClose={() => setIsAwardModalOpen(false)}
        title="Award Milestone Badge"
        subtitle="Honor student dedication with an official Madrasa badge"
      >
        <form onSubmit={handleAwardAchievement} className="space-y-4">
          <Select
            label="Select Student"
            value={awardStudentId}
            onChange={(e) => setAwardStudentId(e.target.value)}
          >
            {teacherStudents.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} (Class {s.class}) - Adm: {s.admissionNo}
              </option>
            ))}
          </Select>

          <Select
            label="Achievement Category"
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
                {b.defaultTitle} ({b.defaultMalayalam})
              </option>
            ))}
          </Select>

          <Input
            label="Award Title"
            value={awardTitle}
            onChange={(e) => setAwardTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={awardDesc}
              onChange={(e) => setAwardDesc(e.target.value)}
              placeholder="Citation detailing reason for recognition..."
              className="w-full rounded-xl border border-[#E3EAE6] bg-white p-3 text-xs text-[#1F2933] focus:border-[#0F6B50] outline-none"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAwardModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" size="sm" isLoading={isSaving} rightIcon={<Award className="w-3.5 h-3.5" />}>
              Grant Badge
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

