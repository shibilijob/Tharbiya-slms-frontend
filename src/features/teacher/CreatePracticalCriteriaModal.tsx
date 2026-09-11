import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { usePracticalStore } from '../../stores';
import { AkhlaqCategoryMeta } from '../../data/madrasaCurriculum';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Layers,
  Edit2,
  GraduationCap,
  Loader2,
  BookOpen
} from 'lucide-react';

interface CreatePracticalCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClass?: string;
  assignedClasses?: string[];
  onUpdated?: () => void;
}

export const CreatePracticalCriteriaModal: React.FC<CreatePracticalCriteriaModalProps> = ({
  isOpen,
  onClose,
  initialClass,
  assignedClasses,
  onUpdated
}) => {
  const { user } = useAuth();
  const { students } = useData();
  const { showToast } = useNotifications();

  // Resolve assigned classes for this Muallim
  const availableClasses = useMemo(() => {
    if (assignedClasses && assignedClasses.length > 0) {
      return Array.from(new Set(assignedClasses.map(c => String(c).replace(/^Class\s*/i, '').trim())))
        .filter(Boolean)
        .sort((a, b) => Number(a) - Number(b));
    }

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

    const cleaned = rawList
      .map((c: any) => String(c).replace(/^Class\s*/i, '').trim())
      .filter(Boolean);

    if (cleaned.length > 0) {
      return Array.from(new Set(cleaned)).sort((a, b) => Number(a) - Number(b));
    }

    const fromStudents = students
      .filter(s => s.assignedTeacherId === user?.id || (user?.name && s.teacherName === user.name))
      .map(s => String(s.class).replace(/^Class\s*/i, '').trim());
    const uniqueFromStudents = Array.from(new Set(fromStudents)).filter(Boolean).sort((a, b) => Number(a) - Number(b));

    if (uniqueFromStudents.length > 0) {
      return uniqueFromStudents;
    }

    return [initialClass ? initialClass.replace(/^Class\s*/i, '').trim() : '4'];
  }, [assignedClasses, user, students, initialClass]);

  const [selectedClass, setSelectedClass] = useState<string>(
    initialClass ? initialClass.replace(/^Class\s*/i, '').trim() : (availableClasses[0] || '4')
  );
  const criteriaList = usePracticalStore((s) => s.criteriaList);
  const isLoading = usePracticalStore((s) => s.isLoading);
  const fetchCriteria = usePracticalStore((s) => s.fetchCriteria);
  const addCriterionStore = usePracticalStore((s) => s.addCriterion);
  const updateCriterionStore = usePracticalStore((s) => s.updateCriterion);
  const deleteCriterionStore = usePracticalStore((s) => s.deleteCriterion);

  const [isSaving, setIsSaving] = useState(false);
  const [isEditingOrCreating, setIsEditingOrCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form inputs
  const [title, setTitle] = useState('');
  const [titleMalayalam, setTitleMalayalam] = useState('');
  const [maxScore, setMaxScore] = useState<number>(5);
  const [description, setDescription] = useState('');

  const cleanClass = selectedClass.replace(/^Class\s*/i, '').trim() || availableClasses[0] || '4';

  const loadCriteria = async (cls: string = cleanClass) => {
    try {
      await fetchCriteria(cls);
    } catch (e) {
      console.error("Failed to load practical subjects from API", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const target = (initialClass && availableClasses.includes(initialClass.replace(/^Class\s*/i, '').trim()))
        ? initialClass.replace(/^Class\s*/i, '').trim()
        : (availableClasses[0] || '4');

      setSelectedClass(target);
      loadCriteria(target);
      setIsEditingOrCreating(false);
      setEditingId(null);
    }
  }, [isOpen, initialClass, availableClasses]);

  const handleClassChange = (newCls: string) => {
    setSelectedClass(newCls);
    setIsEditingOrCreating(false);
    setEditingId(null);
    loadCriteria(newCls);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setTitleMalayalam('');
    setMaxScore(5);
    setDescription('');
    setIsEditingOrCreating(true);
  };

  const handleOpenEdit = (criterion: AkhlaqCategoryMeta) => {
    setEditingId(criterion.id);
    setTitle(criterion.title);
    setTitleMalayalam(criterion.titleMalayalam);
    setMaxScore(criterion.maxScore ?? 5);
    setDescription(criterion.description);
    setIsEditingOrCreating(true);
  };

  const handleSaveCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validatedMaxScore = Math.max(1, Math.min(100, Number(maxScore) || 5));
    setIsSaving(true);

    try {
      if (editingId) {
        // Edit existing criterion
        const updatedObj: AkhlaqCategoryMeta = {
          id: editingId,
          title: title.trim(),
          titleMalayalam: titleMalayalam.trim() || title.trim(),
          description: description.trim() || `Class ${cleanClass} practical observation`,
          maxScore: validatedMaxScore,
          icon: 'Sparkles',
        };

        await updateCriterionStore(editingId, updatedObj, cleanClass);
        setIsEditingOrCreating(false);
        setEditingId(null);
        showToast(`✓ Practical Subject "${title}" updated for Class ${cleanClass}!`);
      } else {
        // Create new criterion
        const newCriterion: AkhlaqCategoryMeta = {
          id: `temp-${Date.now()}`,
          title: title.trim(),
          titleMalayalam: titleMalayalam.trim() || title.trim(),
          description: description.trim() || `Class ${cleanClass} practical observation`,
          maxScore: validatedMaxScore,
          icon: 'Sparkles',
        };

        await addCriterionStore(newCriterion, cleanClass);
        setIsEditingOrCreating(false);
        showToast(`✓ Practical Subject "${title}" created for Class ${cleanClass}!`);
      }

      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(`❌ Failed to save practical subject: ${err?.response?.data?.message || err.message || 'Error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCriterion = async (id: string) => {
    try {
      await deleteCriterionStore(id, cleanClass);
      if (editingId === id) {
        setIsEditingOrCreating(false);
        setEditingId(null);
      }
      showToast(`✓ Practical subject removed from Class ${cleanClass}.`);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(`❌ Failed to delete practical subject: ${err?.response?.data?.message || err.message || 'Error'}`);
    }
  };

  const totalMaxMarks = criteriaList.reduce((acc, c) => acc + (c.maxScore ?? 5), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Practical Score Criteria Management"
      subtitle="Configure Practical Subjects & Evaluation Criteria for Assigned Classes"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Assigned Class Selection Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-[#E3EAE6] shadow-xs">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <GraduationCap className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#1F2933]">
                Your Assigned {availableClasses.length === 1 ? 'Class' : 'Classes'}:
              </span>
              <p className="text-[11px] text-[#667085]">Only classes assigned to your Muallim profile</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {availableClasses.map((cls) => {
              const isActive = cleanClass === cls;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => handleClassChange(cls)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    isActive
                      ? 'bg-[#0F6B50] text-white shadow-xs'
                      : 'bg-[#FAF8F2] text-[#1F2933] hover:bg-[#DDEDE5] border border-[#E3EAE6]'
                  }`}
                >
                  Class {cls}
                </button>
              );
            })}
          </div>
        </div>

        {/* Top Info Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FAF8F2] rounded-2xl border border-[#E3EAE6]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-[#1F2933]">
                  {criteriaList.length} Practical Subjects for Class {cleanClass}
                </h4>
                {criteriaList.length > 0 && (
                  <span className="text-[11px] font-black text-[#084C3A] bg-[#DDEDE5] px-2 py-0.5 rounded-lg">
                    Total {totalMaxMarks} Marks
                  </span>
                )}
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                Each assigned class manages its own isolated practical subjects in MongoDB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4" />}
              className="text-xs"
            >
              Add Practical Subject
            </Button>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#667085]">
            <Loader2 className="w-8 h-8 animate-spin text-[#0F6B50] mb-2" />
            <p className="text-sm font-medium">Loading practical subjects for Class {cleanClass}...</p>
          </div>
        ) : isEditingOrCreating ? (
          /* Create / Edit Criterion Form */
          <form
            onSubmit={handleSaveCriterion}
            className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#0F6B50]/30 shadow-xs space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAE6]">
              <div className="flex items-center gap-2">
                {editingId ? (
                  <Edit2 className="w-4 h-4 text-[#0F6B50]" />
                ) : (
                  <Plus className="w-4 h-4 text-[#0F6B50]" />
                )}
                <h4 className="text-sm font-extrabold text-[#1F2933]">
                  {editingId ? `Edit Practical Subject: ${title}` : `Add Practical Subject to Class ${cleanClass}`}
                </h4>
              </div>
              <Badge variant="green" size="sm">
                Class {cleanClass} Evaluation
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Input
                  label="Subject Title (English)"
                  placeholder="e.g. Salah Punctuality"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <Input
                  label="Subject Title (Malayalam)"
                  placeholder="e.g. നിസ്കാര കൃത്യത"
                  value={titleMalayalam}
                  onChange={(e) => setTitleMalayalam(e.target.value)}
                />
              </div>
              <div className="sm:col-span-1">
                <Input
                  label="Maximum Mark"
                  type="number"
                  min={1}
                  max={100}
                  placeholder="5"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
                Evaluation Focus Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Punctuality in 5 daily prayers with Jama'ath and memorization of daily Azkar..."
                className="w-full rounded-xl border border-[#E3EAE6] bg-white p-3 text-xs text-[#1F2933] focus:border-[#0F6B50] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E3EAE6]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditingOrCreating(false);
                  setEditingId(null);
                }}
                disabled={isSaving}
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
                {editingId ? 'Save Changes' : 'Create Practical Subject'}
              </Button>
            </div>
          </form>
        ) : criteriaList.length === 0 ? (
          <div className="text-center py-10 bg-[#FAF8F2] rounded-2xl border border-dashed border-[#E3EAE6]">
            <BookOpen className="w-10 h-10 mx-auto text-[#667085] mb-2 opacity-50" />
            <p className="text-sm font-bold text-[#1F2933]">No practical subjects in Class {cleanClass}</p>
            <p className="text-xs text-[#667085] mt-1">Click "Add Practical Subject" above to add subjects specifically for Class {cleanClass}.</p>
          </div>
        ) : (
          /* Existing Criteria List with Edit and Delete Options */
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {criteriaList.map((criterion) => {
              const criterionMax = criterion.maxScore || 5;

              return (
                <div
                  key={criterion.id}
                  className="p-3.5 rounded-2xl bg-white border border-[#E3EAE6] hover:border-[#0F6B50] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#1F2933] truncate">{criterion.title}</p>
                        <span className="text-[10px] bg-[#DDEDE5] text-[#084C3A] font-bold px-2 py-0.5 rounded-full border border-[#bbdcd0]">
                          Max {criterionMax} Marks
                        </span>
                      </div>
                      {criterion.titleMalayalam && (
                        <p className="font-malayalam text-[11px] text-[#0F6B50] font-semibold">{criterion.titleMalayalam}</p>
                      )}
                      <p className="text-[10px] text-[#667085] truncate">{criterion.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Edit Criterion Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(criterion)}
                      className="p-1.5 rounded-lg text-[#0F6B50] hover:bg-[#DDEDE5] transition-colors"
                      title={`Edit ${criterion.title}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Criterion Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteCriterion(criterion.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Practical Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E3EAE6]">
          <div className="flex items-center gap-1.5 text-xs text-[#667085]">
            <Sparkles className="w-4 h-4 text-[#C9A227]" />
            <span>Class {cleanClass} practical subjects are persisted in MongoDB</span>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};


