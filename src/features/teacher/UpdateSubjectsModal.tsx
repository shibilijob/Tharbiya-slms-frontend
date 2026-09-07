import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { useNotifications } from '../../context/NotificationContext';
import { subjectService } from '../../services/subjectService';
import { SubjectMeta } from '../../data/madrasaCurriculum';
import { SubjectName } from '../../types';
import {
  BookOpenCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Layers,
  Loader2
} from 'lucide-react';

interface UpdateSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const UpdateSubjectsModal: React.FC<UpdateSubjectsModalProps> = ({
  isOpen,
  onClose,
  onUpdated
}) => {
  const { showToast } = useNotifications();
  const [subjects, setSubjects] = useState<SubjectMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [id, setId] = useState<string>('');
  const [name, setName] = useState('');
  const [malayalamName, setMalayalamName] = useState('');
  const [arabicName, setArabicName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0F6B50');
  const [isSaving, setIsSaving] = useState(false);

  const loadSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await subjectService.fetchFromApi();
      setSubjects(data);
    } catch (e) {
      console.error("Failed to load subjects", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSubjects();
    }
  }, [isOpen]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setId(`Subject-${Date.now()}`);
    setName('');
    setMalayalamName('');
    setArabicName('');
    setDescription('');
    setColor('#0F6B50');
    setIsEditingSubject(true);
  };

  const handleOpenEdit = (subject: SubjectMeta) => {
    setEditingId(subject.id);
    setId(subject.id);
    setName(subject.name);
    setMalayalamName(subject.malayalamName);
    setArabicName(subject.arabicName);
    setDescription(subject.description);
    setColor(subject.color || '#0F6B50');
    setIsEditingSubject(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    const subjectObj: SubjectMeta = {
      id: (editingId || id || name) as SubjectName,
      name: name.trim(),
      malayalamName: malayalamName.trim() || name.trim(),
      arabicName: arabicName.trim() || name.trim(),
      icon: 'BookOpen',
      color,
      description: description.trim() || 'Curriculum subject for Darunnajath Mundambra'
    };

    try {
      let updated: SubjectMeta[];
      if (editingId) {
        updated = await subjectService.updateSubject(editingId, subjectObj);
        showToast(`✓ Subject "${name}" updated in database!`);
      } else {
        updated = await subjectService.addSubject(subjectObj);
        showToast(`✓ New subject "${name}" added to database!`);
      }

      setSubjects(updated);
      setIsEditingSubject(false);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(`❌ Failed to save subject: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubject = async (subId: string) => {
    try {
      const updated = await subjectService.deleteSubject(subId);
      setSubjects(updated);
      showToast(`✓ Subject removed from database.`);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      showToast(`❌ Failed to delete subject: ${err.message || 'Error'}`, 'error');
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await loadSubjects();
      showToast(`✓ All subject configurations updated in database!`);
      if (onUpdated) onUpdated();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Madrasa Subjects & Curriculum"
      subtitle="Configure Core Subjects, Malayalam Titles & Syllabus Targets in Database"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Top Info Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FAF8F2] rounded-2xl border border-[#E3EAE6]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <BookOpenCheck className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-sm font-extrabold text-[#1F2933]">
                {subjects.length} Database Curriculum Subjects
              </h4>
              <p className="text-xs text-[#667085] mt-0.5">
                Darunnajath Mundambra Islamic Education Board (Stored in MongoDB)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              leftIcon={<Plus className="w-4 h-4" />}
              className="text-xs"
            >
              Add Subject
            </Button>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#667085]">
            <Loader2 className="w-8 h-8 animate-spin text-[#0F6B50] mb-2" />
            <p className="text-sm font-medium">Loading subjects from database...</p>
          </div>
        ) : isEditingSubject ? (
          /* Subject Editor Form */
          <form onSubmit={handleSaveSubject} className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#0F6B50]/30 shadow-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAE6]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0F6B50]" />
                <h4 className="text-sm font-extrabold text-[#1F2933]">
                  {editingId ? `Edit Subject: ${name}` : 'Add New Subject'}
                </h4>
              </div>
              <Badge variant="green" size="sm">
                Curriculum Editor
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Subject Name (English)"
                placeholder="e.g. Sirah & Islamic History"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Subject Name (Malayalam)"
                placeholder="e.g. സീറത്തുന്നബവി"
                value={malayalamName}
                onChange={(e) => setMalayalamName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Arabic Title"
                placeholder="e.g. السيرة النبوية"
                value={arabicName}
                onChange={(e) => setArabicName(e.target.value)}
              />
              <div>
                <label className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
                  Theme Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-[#E3EAE6] cursor-pointer p-1"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#0F6B50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
                Curriculum Scope & Learning Target Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Life of Prophet Muhammad (PBUH), companions, and moral teachings..."
                className="w-full rounded-xl border border-[#E3EAE6] bg-white p-3 text-xs text-[#1F2933] focus:border-[#0F6B50] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E3EAE6]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditingSubject(false)}
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
                {editingId ? 'Save Subject' : 'Create Subject'}
              </Button>
            </div>
          </form>
        ) : subjects.length === 0 ? (
          <div className="text-center py-10 bg-[#FAF8F2] rounded-2xl border border-dashed border-[#E3EAE6]">
            <BookOpen className="w-10 h-10 mx-auto text-[#667085] mb-2 opacity-50" />
            <p className="text-sm font-bold text-[#1F2933]">No subjects in database</p>
            <p className="text-xs text-[#667085] mt-1">Click "Add Subject" above to add your first subject.</p>
          </div>
        ) : (
          /* List of Subjects */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjects.map(subject => (
              <div
                key={subject.id}
                className="p-4 rounded-2xl bg-white border-2 border-[#0F6B50]/30 hover:border-[#0F6B50] shadow-xs transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: subject.color || '#0F6B50' }}
                    >
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#1F2933]">{subject.name}</h4>
                      <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">{subject.malayalamName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(subject)}
                      className="p-1.5 rounded-lg text-[#0F6B50] hover:bg-[#DDEDE5] transition-colors"
                      title="Edit Subject"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#FAF8F2] flex items-center justify-between text-[11px] text-[#667085]">
                  <span className="font-arabic font-bold text-[#1F2933] text-xs">{subject.arabicName}</span>
                  <span className="truncate max-w-[180px]" title={subject.description}>
                    {subject.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E3EAE6]">
          <div className="flex items-center gap-1.5 text-xs text-[#667085]">
            <Sparkles className="w-4 h-4 text-[#C9A227]" />
            <span>Changes are persisted in MongoDB database</span>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveAll}
              isLoading={isSaving}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
