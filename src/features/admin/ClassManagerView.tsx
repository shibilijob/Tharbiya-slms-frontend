import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { ConfirmationDialog } from '../../components/feedback/ConfirmationDialog';
import { useNotifications } from '../../context/NotificationContext';
import { useClassStore } from '../../stores';
import { ClassItem, TeacherOption } from '../../services/classService';
import { Layers, Plus, Edit2, Trash2, Search, RefreshCw, UserCheck } from 'lucide-react';

export type { ClassItem, TeacherOption };

// Natural sort helper: "Class 1", "Class 2" ... "Class 10"
const sortClassesInOrder = (list: ClassItem[]): ClassItem[] => {
  return [...list].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
};

export const ClassManagerView: React.FC = () => {
  const classesList = useClassStore((s) => s.classes);
  const teachersList = useClassStore((s) => s.teachersList);
  const isLoading = useClassStore((s) => s.isLoading);
  const fetchClasses = useClassStore((s) => s.fetchClasses);
  const fetchTeachersList = useClassStore((s) => s.fetchTeachersList);
  const createClass = useClassStore((s) => s.createClass);
  const updateClass = useClassStore((s) => s.updateClass);
  const deleteClass = useClassStore((s) => s.deleteClass);

  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [className, setClassName] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const { showToast } = useNotifications();

  useEffect(() => {
    fetchClasses();
    fetchTeachersList();
  }, [fetchClasses, fetchTeachersList]);

  const handleOpenAdd = () => {
    setEditingClass(null);
    // Suggest next class number in sequence
    setClassName(`Class ${classesList.length + 1}`);
    setTeacherId(teachersList[0]?.id || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassItem) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setTeacherId(cls.classTeacherId || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingClassId) return;

    try {
      await deleteClass(deletingClassId);
      showToast('✓ Class removed successfully.');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Failed to delete class.');
    } finally {
      setDeletingClassId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      setFormError('Class name is required.');
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      const payload = {
        name: className.trim(),
        classTeacherId: teacherId || undefined,
      };

      if (editingClass) {
        await updateClass(editingClass.id, payload);
        showToast(`✓ ${className} updated successfully.`);
      } else {
        await createClass(payload);
        showToast(`✓ ${className} created successfully.`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save class details.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredClasses = sortClassesInOrder(
    classesList.filter((c) => {
      const query = searchQuery.toLowerCase();
      const matchesName = c.name.toLowerCase().includes(query);
      const matchesTeacher = c.classTeacherName?.toLowerCase().includes(query);
      return matchesName || matchesTeacher;
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Class Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Configure Madrasa classes in sequential order and assign class usthads
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="md" variant="outline" onClick={() => fetchClasses()} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          <Button size="md" variant="primary" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
            Create New Class
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E3EAE6] shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-[#667085]" />
        <input
          type="text"
          placeholder="Search by class name or assigned Usthad..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs sm:text-sm text-[#1F2933] placeholder-[#667085] outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-bold text-[#667085] hover:text-[#1F2933] px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Classes Grid */}
      {isLoading && classesList.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-3 border-[#DDEDE5] border-t-[#0F6B50] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#667085] font-semibold">Loading Madrasa classes...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E3EAE6]">
          <Layers className="w-12 h-12 text-[#667085] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-[#1F2933]">No Classes Found</h3>
          <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
            {searchQuery ? 'No classes match your search query.' : 'No classes have been added yet.'}
          </p>
          {!searchQuery && (
            <Button size="sm" variant="primary" className="mt-4" onClick={handleOpenAdd}>
              Create First Class
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => (
            <Card
              key={cls.id}
              className="p-5 sm:p-6 hover:border-[#0F6B50] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0F6B50]">
                      Madrasa Dars
                    </span>
                    <h3 className="text-xl font-extrabold text-[#1F2933] mt-0.5">
                      {cls.name}
                    </h3>
                  </div>
                  <Badge variant="green" size="sm">
                    {cls.studentCount} Students
                  </Badge>
                </div>

                <div className="mt-3.5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="text-[#667085]">Class Usthad:</p>
                    <p className="font-extrabold text-[#1F2933]">{cls.classTeacherName}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E3EAE6] flex items-center justify-end gap-2">
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEdit(cls)}
                    className="text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1 text-[#0F6B50]" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeletingClassId(cls.id)}
                    className="text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Class Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? `Edit ${editingClass.name}` : 'Create New Class'}
        subtitle="Darunnajath Mundambra Class Allocation"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {formError}
            </div>
          )}

          <Input
            label="Class Name"
            placeholder="e.g. Class 1, Class 2, Class 8"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
          />

          <Select
            label="Assign Class Usthad"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
          >
            <option value="">-- No Usthad Assigned --</option>
            {teachersList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.designation || 'Usthad'})
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              {editingClass ? 'Save Changes' : 'Create Class'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingClassId}
        onClose={() => setDeletingClassId(null)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Remove Class"
        message="Are you sure you want to remove this class from the system? The record will be deleted."
        confirmText="Remove Class"
        variant="danger"
      />
    </div>
  );
};
