import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { practicalCriteriaService } from '../../services/practicalCriteriaService';
import { AkhlaqCategoryMeta } from '../../data/madrasaCurriculum';
import { AkhlaqLevel, AkhlaqRecord, AkhlaqScore } from '../../types';
import { CreatePracticalCriteriaModal } from './CreatePracticalCriteriaModal';
import {
  HeartHandshake,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';

interface UpdatePracticalScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
  onUpdated?: () => void;
}

export const UpdatePracticalScoreModal: React.FC<UpdatePracticalScoreModalProps> = ({
  isOpen,
  onClose,
  initialStudentId,
  onUpdated
}) => {
  const { user } = useAuth();
  const { students, akhlaqRecords, saveAkhlaq } = useData();
  const { showToast, pushNotification } = useNotifications();

  const teacherUser = user as any;
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

  const rawAssigned: string[] = rawList.map((c: any) => String(c).replace(/^Class\s*/i, '').trim()).filter(Boolean);
  const teacherStudents = students.filter(s => {
    const sClass = String(s.class).replace(/^Class\s*/i, '').trim();
    return (rawAssigned.length > 0 && rawAssigned.includes(sClass)) ||
      (user?.id && s.assignedTeacherId === user.id) ||
      (user?.name && s.teacherName === user.name);
  });

  const [targetStudentId, setTargetStudentId] = useState<string>(
    initialStudentId || teacherStudents[0]?.id || ''
  );
  const [overallScore, setOverallScore] = useState<number>(90);
  const [evaluatedDate, setEvaluatedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [remarks, setRemarks] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic criteria list
  const [criteriaList, setCriteriaList] = useState<AkhlaqCategoryMeta[]>([]);
  const [isCriteriaManagerOpen, setIsCriteriaManagerOpen] = useState(false);

  // Individual category scores
  const [categoryScores, setCategoryScores] = useState<Record<string, AkhlaqScore>>({});

  const loadCriteriaAndScores = () => {
    const list = practicalCriteriaService.getAll();
    setCriteriaList(list);

    setCategoryScores(prev => {
      const updated: Record<string, AkhlaqScore> = { ...prev };
      list.forEach(cat => {
        if (!updated[cat.id]) {
          updated[cat.id] = {
            category: cat.id,
            categoryMalayalam: cat.titleMalayalam,
            level: 'Very Good',
            score: 4,
            remarks: ''
          };
        }
      });
      return updated;
    });
  };

  useEffect(() => {
    if (isOpen) {
      loadCriteriaAndScores();
    }
  }, [isOpen]);

  // When student or modal opens, load existing akhlaq record if available
  useEffect(() => {
    if (isOpen && targetStudentId) {
      const existing = akhlaqRecords.find(r => r.studentId === targetStudentId);
      if (existing) {
        setOverallScore(existing.overallScore || 0);
        setEvaluatedDate(existing.evaluatedDate || new Date().toISOString().split('T')[0]);
        setRemarks(existing.teacherRemarks || '');
        if (existing.scores) {
          setCategoryScores(existing.scores);
        }
      } else {
        setOverallScore(0);
        setEvaluatedDate(new Date().toISOString().split('T')[0]);
        setRemarks('');
      }
    }
  }, [isOpen, targetStudentId, akhlaqRecords]);

  // Update targetStudentId if initialStudentId changes
  useEffect(() => {
    if (initialStudentId) {
      setTargetStudentId(initialStudentId);
    }
  }, [initialStudentId]);

  const handleCategoryScoreChange = (catId: string, score: number, level?: AkhlaqLevel) => {
    const catMeta = criteriaList.find(c => c.id === catId);
    const catMax = catMeta?.maxScore || 5;
    const clampedScore = Math.max(0, Math.min(score, catMax));

    let calculatedLevel: AkhlaqLevel = level || 'Good';
    if (!level) {
      const ratio = clampedScore / catMax;
      if (ratio >= 0.9) calculatedLevel = 'Excellent';
      else if (ratio >= 0.75) calculatedLevel = 'Very Good';
      else if (ratio >= 0.6) calculatedLevel = 'Good';
      else if (ratio >= 0.4) calculatedLevel = 'Developing';
      else calculatedLevel = 'Needs Attention';
    }

    const updated: Record<string, AkhlaqScore> = {
      ...categoryScores,
      [catId]: {
        category: catId,
        categoryMalayalam: catMeta?.titleMalayalam || catId,
        score: clampedScore,
        maxScore: catMax,
        level: calculatedLevel
      }
    };
    setCategoryScores(updated);

    // Auto recalculate average percentage across all active criteria based on their respective maxScores
    let totalEarned = 0;
    let totalMax = 0;
    criteriaList.forEach(c => {
      const cMax = c.maxScore || 5;
      const cScore = updated[c.id]?.score ?? Math.round(cMax * 0.8);
      totalEarned += cScore;
      totalMax += cMax;
    });

    const avgPercent = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 90;
    setOverallScore(Math.min(avgPercent, 100));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId) return;

    setIsSaving(true);
    try {
      const record: AkhlaqRecord = {
        id: `akhlaq-${targetStudentId}-${Date.now()}`,
        studentId: targetStudentId,
        evaluatedDate,
        overallScore,
        scores: categoryScores,
        teacherRemarks: remarks,
        teacherId: user?.id || 'teacher-1'
      };

      await saveAkhlaq(record);

      const st = students.find(s => s.id === targetStudentId);
      showToast(`✓ Practical score for ${st?.name || 'Student'} updated: ${totalEarnedMarks}/${totalMaxMarks} Marks (${overallScore}%)!`);

      if (st) {
        await pushNotification({
          userId: st.parentId,
          title: "Practical Score & Adab Evaluated",
          message: `${st.name}'s Practical & Adab score has been evaluated: ${totalEarnedMarks}/${totalMaxMarks} Marks (${overallScore}%).`,
          category: "REMARK",
          actionUrl: "/parent/akhlaq"
        });
      }

      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error("Failed to update practical score", err);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedStudent = students.find(s => s.id === targetStudentId);

  // Dynamic Total Marks & Percentage calculation across criteria
  const totalEarnedMarks = criteriaList.reduce((acc, c) => {
    const cMax = c.maxScore || 5;
    const cScore = categoryScores[c.id]?.score ?? Math.round(cMax * 0.8);
    return acc + cScore;
  }, 0);

  const totalMaxMarks = criteriaList.reduce((acc, c) => acc + (c.maxScore || 5), 0);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Update Practical Score & Adab"
        subtitle="Comprehensive Madrasa Practical & Behavioral Evaluation"
        maxWidth="3xl"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Student Selector Card */}
          <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#E3EAE6] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
                  Select Student to Evaluate
                </label>
                <Select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                >
                  {teacherStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Class {s.class}) - Adm: {s.admissionNo}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="w-full sm:w-44">
                <Input
                  label="Evaluation Date"
                  type="date"
                  value={evaluatedDate}
                  onChange={(e) => setEvaluatedDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {selectedStudent && (
              <div className="flex items-center gap-3 pt-2 border-t border-[#E3EAE6]">
                <Avatar name={selectedStudent.name} gender={selectedStudent.gender} size="md" />
                <div>
                  <p className="text-xs font-bold text-[#1F2933]">{selectedStudent.name}</p>
                  <p className="font-malayalam text-[11px] text-[#0F6B50] font-semibold">{selectedStudent.malayalamName}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="green" size="sm">
                    Class {selectedStudent.class}
                  </Badge>
                  <div className="flex items-center gap-1.5 bg-[#DDEDE5] px-3 py-1 rounded-xl text-xs font-black text-[#084C3A]">
                    <span>{totalEarnedMarks} / {totalMaxMarks} Marks</span>
                    <span className="text-[#0F6B50]">({overallScore}%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Overall Score Slider & Indicator with Mark and Percentage */}
          <div className="p-4 rounded-2xl bg-white border border-[#E3EAE6] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1F2933]">
                  Overall Practical & Adab Score
                </h4>
                <p className="text-[11px] text-[#667085]">Calculated from daily practical behavior, Sunnah adherence & Adab</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-[#FAF8F2] border border-[#E3EAE6] px-3.5 py-1.5 rounded-xl text-right">
                  <p className="text-[9px] text-[#667085] font-bold uppercase">Total Marks</p>
                  <p className="text-base font-black text-[#1F2933]">{totalEarnedMarks} / {totalMaxMarks}</p>
                </div>
                <div className="bg-[#DDEDE5] border border-[#0F6B50]/20 px-3.5 py-1.5 rounded-xl text-right">
                  <p className="text-[9px] text-[#0F6B50] font-bold uppercase">Percentage</p>
                  <p className="text-base font-black text-[#084C3A]">{overallScore}%</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold text-[#667085]">
                <span>Score Scale</span>
                <span>{totalEarnedMarks} / {totalMaxMarks} Marks ({overallScore}%)</span>
              </div>
              <input
                type="range"
                min={40}
                max={100}
                value={overallScore}
                onChange={(e) => setOverallScore(Number(e.target.value))}
                className="w-full h-2 bg-[#DDEDE5] rounded-lg appearance-none cursor-pointer accent-[#0F6B50]"
              />
            </div>
          </div>

          {/* Category Breakdown Evaluation Grid with Create Option */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#667085]">
                  Individual Practical Criteria ({criteriaList.length} Categories • Total {totalMaxMarks} Marks)
                </h4>
                <p className="text-[11px] text-[#667085]">Grade each specific moral and behavioral category</p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCriteriaManagerOpen(true)}
                leftIcon={<Layers className="w-3.5 h-3.5 text-[#0F6B50]" />}
                className="text-xs border-[#0F6B50]/30 text-[#0F6B50] hover:bg-[#DDEDE5]/30"
              >
                + Create / Edit Criteria
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {criteriaList.map(cat => {
                const catMax = cat.maxScore || 5;
                const currentScore = categoryScores[cat.id]?.score ?? Math.round(catMax * 0.8);
                const catPercent = catMax > 0 ? Math.round((currentScore / catMax) * 100) : 0;

                return (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#E3EAE6] hover:border-[#0F6B50] transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-extrabold text-[#1F2933]">{cat.title}</p>
                          <span className="text-[10px] text-[#0F6B50] font-bold bg-white px-1.5 py-0.5 rounded border border-[#E3EAE6]">
                            Max {catMax}
                          </span>
                        </div>
                        <p className="font-malayalam text-[11px] text-[#0F6B50] font-semibold">{cat.titleMalayalam}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-[#084C3A] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                          {currentScore}/{catMax} ({catPercent}%)
                        </span>
                        <Badge variant={currentScore / catMax >= 0.75 ? 'green' : 'gold'} size="sm">
                          {categoryScores[cat.id]?.level || 'Very Good'}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-[10px] text-[#667085] line-clamp-1">{cat.description}</p>

                    {/* Numerical Mark Selection & Entry */}
                    <div className="space-y-2 pt-1">
                      {catMax <= 6 ? (
                        /* Numerical Pill Buttons: 0 to catMax */
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: catMax + 1 }, (_, i) => i).map(scoreVal => {
                            const isSelected = currentScore === scoreVal;
                            return (
                              <button
                                key={scoreVal}
                                type="button"
                                onClick={() => handleCategoryScoreChange(cat.id, scoreVal)}
                                className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all ${
                                  isSelected
                                    ? 'bg-[#0F6B50] text-white shadow-xs scale-102 ring-2 ring-[#0F6B50]/30'
                                    : 'bg-white text-[#1F2933] hover:bg-[#DDEDE5]/50 border border-[#E3EAE6]'
                                }`}
                                title={`${scoreVal} Marks`}
                              >
                                {scoreVal}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        /* Direct Number Input with +/- Incrementers & Presets */
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center bg-white rounded-xl border border-[#E3EAE6] px-2 py-1 shadow-2xs">
                              <input
                                type="number"
                                min={0}
                                max={catMax}
                                value={currentScore}
                                onChange={(e) => handleCategoryScoreChange(cat.id, Number(e.target.value))}
                                className="w-full text-center text-sm font-black text-[#1F2933] outline-none"
                              />
                              <span className="text-xs font-bold text-[#667085] whitespace-nowrap pl-1">
                                / {catMax} Marks
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCategoryScoreChange(cat.id, Math.max(0, currentScore - 1))}
                                className="w-8 h-8 bg-white rounded-xl border border-[#E3EAE6] text-sm font-black text-[#667085] hover:bg-gray-100 flex items-center justify-center transition-colors"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCategoryScoreChange(cat.id, Math.min(catMax, currentScore + 1))}
                                className="w-8 h-8 bg-white rounded-xl border border-[#E3EAE6] text-sm font-black text-[#0F6B50] hover:bg-emerald-50 flex items-center justify-center transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Quick Percentage Presets */}
                          <div className="flex items-center gap-1 justify-between">
                            {[
                              { label: '0', val: 0 },
                              { label: '50%', val: Math.round(catMax * 0.5) },
                              { label: '75%', val: Math.round(catMax * 0.75) },
                              { label: '90%', val: Math.round(catMax * 0.9) },
                              { label: 'Full', val: catMax }
                            ].map(preset => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => handleCategoryScoreChange(cat.id, preset.val)}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition-all ${
                                  currentScore === preset.val
                                    ? 'bg-[#0F6B50] text-white border-[#0F6B50]'
                                    : 'bg-white text-[#667085] border-[#E3EAE6] hover:bg-gray-50'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Usthad Guidance Remarks */}
          <div>
            <label className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
              Usthad Guidance & Moral Observations
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Demonstrates exceptional discipline during Salah and respectful attitude towards elders..."
              className="w-full rounded-xl border border-[#E3EAE6] bg-white p-3 text-xs text-[#1F2933] focus:border-[#0F6B50] outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E3EAE6]">
            <div className="flex items-center gap-1.5 text-xs text-[#0F6B50]">
              <Sparkles className="w-4 h-4 text-[#C9A227]" />
              <span>Score syncs immediately to Parent Portal & Dossiers</span>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSaving}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Save Practical Score
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Create Practical Criteria Modal */}
      <CreatePracticalCriteriaModal
        isOpen={isCriteriaManagerOpen}
        onClose={() => setIsCriteriaManagerOpen(false)}
        onUpdated={loadCriteriaAndScores}
      />
    </>
  );
};
