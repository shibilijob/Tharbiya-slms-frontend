import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { useNotifications } from '../../context/NotificationContext';
import { practicalCriteriaService } from '../../services/practicalCriteriaService';
import { AkhlaqCategoryMeta } from '../../data/madrasaCurriculum';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Layers,
  Edit2,
  Award
} from 'lucide-react';

interface CreatePracticalCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const CreatePracticalCriteriaModal: React.FC<CreatePracticalCriteriaModalProps> = ({
  isOpen,
  onClose,
  onUpdated
}) => {
  const { showToast } = useNotifications();
  const [criteriaList, setCriteriaList] = useState<AkhlaqCategoryMeta[]>([]);
  const [isEditingOrCreating, setIsEditingOrCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form inputs
  const [title, setTitle] = useState('');
  const [titleMalayalam, setTitleMalayalam] = useState('');
  const [maxScore, setMaxScore] = useState<number>(5);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCriteriaList(practicalCriteriaService.getAll());
      setIsEditingOrCreating(false);
      setEditingId(null);
    }
  }, [isOpen]);

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
    setMaxScore(criterion.maxScore || 5);
    setDescription(criterion.description);
    setIsEditingOrCreating(true);
  };

  const handleSaveCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validatedMaxScore = Math.max(1, Number(maxScore) || 5);

    if (editingId) {
      // Edit existing criterion
      const updatedObj: AkhlaqCategoryMeta = {
        id: editingId,
        title: title.trim(),
        titleMalayalam: titleMalayalam.trim() || title.trim(),
        description: description.trim() || 'Daily practical and moral character observation',
        maxScore: validatedMaxScore,
        icon: 'Sparkles'
      };

      const updated = practicalCriteriaService.updateCriteria(editingId, updatedObj);
      setCriteriaList(updated);
      setIsEditingOrCreating(false);
      setEditingId(null);
      showToast(`✓ Practical Criterion "${title}" updated successfully!`);
    } else {
      // Create new criterion
      const idKey = title.trim().replace(/\s+/g, '-');
      const newCriterion: AkhlaqCategoryMeta = {
        id: idKey,
        title: title.trim(),
        titleMalayalam: titleMalayalam.trim() || title.trim(),
        description: description.trim() || 'Daily practical and moral character observation',
        maxScore: validatedMaxScore,
        icon: 'Sparkles'
      };

      const updated = practicalCriteriaService.addCriteria(newCriterion);
      setCriteriaList(updated);
      setIsEditingOrCreating(false);
      showToast(`✓ New Practical Criterion "${title}" (Max ${validatedMaxScore} Marks) created successfully!`);
    }

    if (onUpdated) onUpdated();
  };

  const handleDeleteCriterion = (id: string) => {
    const updated = practicalCriteriaService.deleteCriteria(id);
    setCriteriaList(updated);
    if (editingId === id) {
      setIsEditingOrCreating(false);
      setEditingId(null);
    }
    showToast(`Practical criterion removed.`);
    if (onUpdated) onUpdated();
  };

  const handleResetDefault = () => {
    const defaults = practicalCriteriaService.resetToDefault();
    setCriteriaList(defaults);
    setIsEditingOrCreating(false);
    setEditingId(null);
    showToast(`✓ Reset to 6 standard Madrasa criteria.`);
    if (onUpdated) onUpdated();
  };

  const totalMaxMarks = criteriaList.reduce((acc, c) => acc + (c.maxScore || 5), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Practical Score Criteria Management"
      subtitle="Create, edit, and configure individual character & Adab evaluation criteria"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Top Info Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FAF8F2] rounded-2xl border border-[#E3EAE6]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-[#1F2933]">
                  {criteriaList.length} Active Practical Criteria
                </h4>
                <span className="text-[11px] font-black text-[#084C3A] bg-[#DDEDE5] px-2 py-0.5 rounded-lg">
                  Total {totalMaxMarks} Marks
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                Evaluated across all student daily practical scorecards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefault}
              className="text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Default
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4" />}
              className="text-xs"
            >
              Create Criterion
            </Button>
          </div>
        </div>

        {/* Create / Edit Criterion Form */}
        {isEditingOrCreating && (
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
                  {editingId ? `Edit Criterion: ${title || editingId}` : 'Create Individual Practical Criterion'}
                </h4>
              </div>
              <Badge variant="green" size="sm">
                {editingId ? 'Edit Mode' : 'New Criterion'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Input
                  label="Criterion Title (English)"
                  placeholder="e.g. Salah Punctuality"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <Input
                  label="Criterion Title (Malayalam)"
                  placeholder="e.g. നിസ്കാര കൃത്യത"
                  value={titleMalayalam}
                  onChange={(e) => setTitleMalayalam(e.target.value)}
                  required
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
                required
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                {editingId ? 'Save Changes' : 'Create Criterion'}
              </Button>
            </div>
          </form>
        )}

        {/* Existing Criteria List with Edit and Delete Options */}
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {criteriaList.map((criterion) => {
            const isStandard = ['Discipline', 'Respect', 'Cleanliness', 'Cooperation', 'Responsibility', 'Participation'].includes(criterion.id);
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
                      {isStandard ? (
                        <span className="text-[10px] bg-[#FAF8F2] text-[#667085] px-1.5 py-0.5 rounded border border-[#E3EAE6]">
                          Standard
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-50 text-[#0F6B50] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="font-malayalam text-[11px] text-[#0F6B50] font-semibold">{criterion.titleMalayalam}</p>
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
                  {!isStandard && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCriterion(criterion.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Criterion"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
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


