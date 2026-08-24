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
import { QURAN_SURAHS } from '../../data/quranSurahs';
import { TajweedLevel, LessonStatus } from '../../types';
import {
  BookOpen,
  Edit2
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

import { api } from '../../lib/axios';

export const QuranHifzTeacherView: React.FC = () => {
  const { user } = useAuth();
  const { students, quranRecords, updateQuranProgress } = useData();
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

  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [currentSurah, setCurrentSurah] = useState('Al-Mulk');
  const [ayahStart, setAyahStart] = useState('1');
  const [ayahEnd, setAyahEnd] = useState('15');
  const [hifzCount, setHifzCount] = useState('28');
  const [tajweedLevel, setTajweedLevel] = useState<TajweedLevel>('Proficient');
  const [mistakes, setMistakes] = useState('1');
  const [status, setStatus] = useState<LessonStatus>('In Progress');
  const [remarks, setRemarks] = useState('');
  const [sabaqi, setSabaqi] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = (studentId: string) => {
    const existing = quranRecords.find(q => q.studentId === studentId);
    setActiveStudentId(studentId);
    if (existing) {
      setCurrentSurah(existing.currentSurahName || (QURAN_SURAHS.find(s => s.number === existing.currentSurahNumber)?.name) || 'Al-Fatihah');
      setAyahStart(String(existing.currentAyahStart || 1));
      setAyahEnd(String(existing.currentAyahEnd || 7));
      setHifzCount(String(existing.hifzSurahsCount || 0));
      setTajweedLevel(existing.tajweedLevel || 'Beginner');
      setMistakes(String(existing.mistakesCount || 0));
      setStatus(existing.lessonStatus || 'In Progress');
      setRemarks(existing.teacherRemarks || '');
      setSabaqi(existing.sabaqiRevision || '');
    } else {
      setCurrentSurah('Al-Fatihah');
      setAyahStart('1');
      setAyahEnd('7');
      setHifzCount('0');
      setTajweedLevel('Beginner');
      setMistakes('0');
      setStatus('In Progress');
      setRemarks('');
      setSabaqi('');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudentId) return;

    setIsSaving(true);
    try {
      const cleanSurahName = currentSurah.trim() || 'Al-Fatihah';
      const existing = quranRecords.find(q => q.studentId === activeStudentId);
      const matchedSurah = QURAN_SURAHS.find(s => 
        s.name.toLowerCase() === cleanSurahName.toLowerCase() || 
        s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSurahName.toLowerCase().replace(/[^a-z0-9]/g, '') ||
        String(s.number) === cleanSurahName
      );
      const surahNumber = matchedSurah ? matchedSurah.number : (existing?.currentSurahNumber || 1);
      const startNum = parseInt(ayahStart) || 1;
      const endNum = parseInt(ayahEnd) || 7;

      await updateQuranProgress(activeStudentId, {
        currentSurahNumber: surahNumber,
        currentSurahName: cleanSurahName,
        currentAyahStart: startNum,
        currentAyahEnd: endNum,
        hifzSurahsCount: parseInt(hifzCount) || 0,
        tajweedLevel,
        mistakesCount: parseInt(mistakes) || 0,
        lessonStatus: status,
        sabaqLesson: `Surah ${cleanSurahName} (Ayah ${startNum}-${endNum})`,
        sabaqiRevision: sabaqi.trim() || undefined,
        teacherRemarks: remarks.trim() || undefined
      }, user?.id || 'teacher-1');

      showToast('✓ Quran & Hifz progress saved successfully!');
      setActiveStudentId(null);
    } catch (e) {
      console.error('Failed to save Quran progress', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Quran & Hifz Progress Manager
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Update daily lessons, Surah revision, Tajweed levels, and memorization counts
          </p>
        </div>

        <Badge variant="green" size="lg">
          114 Surahs Catalog Active
        </Badge>
      </div>

      {/* Student Quran Cards */}
      <div className="space-y-3">
        {teacherStudents.map(student => {
          const rec = quranRecords.find(q => q.studentId === student.id);

          return (
            <Card key={student.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#0F6B50] transition-all">
              <div className="flex items-center gap-3.5">
                <Avatar name={student.name} gender={student.gender} size="lg" ring />
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#1F2933]">{student.name}</h4>
                  <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">{student.malayalamName}</p>
                  <p className="text-[11px] text-[#667085] mt-0.5">
                    Class {student.class} • Adm: {student.admissionNo}
                  </p>
                </div>
              </div>

              {/* Progress metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-[#FAF8F2] p-2.5 rounded-xl">
                  <p className="text-[9px] text-[#667085] font-bold uppercase">Current Surah</p>
                  <p className="font-extrabold text-[#1F2933] mt-0.5 truncate">
                    {rec?.sabaqLesson || (rec?.currentSurahName ? `Surah ${rec.currentSurahName}` : 'Not Started')}
                  </p>
                </div>

                <div className="bg-[#FAF8F2] p-2.5 rounded-xl">
                  <p className="text-[9px] text-[#667085] font-bold uppercase">Hifz Surahs</p>
                  <p className="font-extrabold text-[#0F6B50] mt-0.5">
                    {rec?.hifzSurahsCount ?? 0} Completed
                  </p>
                </div>

                <div className="bg-[#FAF8F2] p-2.5 rounded-xl">
                  <p className="text-[9px] text-[#667085] font-bold uppercase">Tajweed</p>
                  <p className="font-extrabold text-[#1F2933] mt-0.5">
                    {rec?.tajweedLevel || 'Not Evaluated'}
                  </p>
                </div>

                <div className="bg-[#FAF8F2] p-2.5 rounded-xl">
                  <p className="text-[9px] text-[#667085] font-bold uppercase">Mistakes</p>
                  <p className="font-extrabold text-amber-700 mt-0.5">
                    {rec?.mistakesCount ?? 0}
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenEdit(student.id)}
                className="shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" /> Update Hifz
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Edit Quran Progress Modal */}
      {activeStudentId && (
        <Modal
          isOpen={!!activeStudentId}
          onClose={() => setActiveStudentId(null)}
          title="Update Quran & Hifz Progress"
          subtitle={`Student: ${students.find(s => s.id === activeStudentId)?.name}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="Current Surah"
                  placeholder="e.g. Al-Mulk"
                  value={currentSurah}
                  onChange={(e) => setCurrentSurah(e.target.value)}
                />
              </div>

              <Input
                label="Completed Hifz Surahs"
                type="number"
                value={hifzCount}
                onChange={(e) => setHifzCount(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Ayah Start"
                type="number"
                value={ayahStart}
                onChange={(e) => setAyahStart(e.target.value)}
              />
              <Input
                label="Ayah End"
                type="number"
                value={ayahEnd}
                onChange={(e) => setAyahEnd(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Tajweed Level"
                value={tajweedLevel}
                onChange={(e) => setTajweedLevel(e.target.value as TajweedLevel)}
              >
                <option value="Beginner">Beginner</option>
                <option value="Developing">Developing</option>
                <option value="Good">Good</option>
                <option value="Proficient">Proficient</option>
                <option value="Mastery">Mastery</option>
              </Select>

              <Input
                label="Mistakes Count"
                type="number"
                value={mistakes}
                onChange={(e) => setMistakes(e.target.value)}
              />

              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as LessonStatus)}
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Revision Needed">Revision Needed</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
                Usthad Quran Remarks
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Beautiful recitation rhythm. Practice Madd in Ayah 12."
                className="w-full rounded-xl border border-[#E3EAE6] bg-white p-3 text-xs text-[#1F2933] focus:border-[#0F6B50] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveStudentId(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                Save Progress
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
