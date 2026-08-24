import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { ClassInfo } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { useData } from '../../context/DataContext';
import { Layers, Plus, Edit2, Trash2 } from 'lucide-react';

const DEFAULT_INITIAL_CLASSES: ClassInfo[] = [
  { id: 'c1', name: 'Class 1', classTeacherId: 'teacher-1', classTeacherName: 'Usthad Shihabudheen Saadi', studentCount: 0, averageAttendance: 95, averageProgress: 88 },
  { id: 'c2', name: 'Class 2', classTeacherId: 'teacher-1', classTeacherName: 'Usthad Shihabudheen Saadi', studentCount: 0, averageAttendance: 94, averageProgress: 85 },
  { id: 'c3', name: 'Class 3', classTeacherId: 'teacher-1', classTeacherName: 'Usthad Shihabudheen Saadi', studentCount: 0, averageAttendance: 92, averageProgress: 86 },
  { id: 'c4', name: 'Class 4', classTeacherId: 'teacher-1', classTeacherName: 'Usthad Shihabudheen Saadi', studentCount: 0, averageAttendance: 96, averageProgress: 90 },
  { id: 'c5', name: 'Class 5', classTeacherId: 'teacher-1', classTeacherName: 'Usthad Shihabudheen Saadi', studentCount: 0, averageAttendance: 93, averageProgress: 87 },
  { id: 'c6', name: 'Class 6', classTeacherId: 'teacher-1', classTeacherName: 'Usthad Shihabudheen Saadi', studentCount: 0, averageAttendance: 95, averageProgress: 89 },
  { id: 'c7', name: 'Class 7', classTeacherId: 'teacher-1', classTeacherName: 'Usthad Shihabudheen Saadi', studentCount: 0, averageAttendance: 91, averageProgress: 84 }
];

export const ClassManagerView: React.FC = () => {
  const { students } = useData();
  const [classesList, setClassesList] = useState<ClassInfo[]>(DEFAULT_INITIAL_CLASSES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  const existingTeachers = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    students.forEach(s => {
      if (s.assignedTeacherId && s.teacherName && !map.has(s.assignedTeacherId)) {
        map.set(s.assignedTeacherId, { id: s.assignedTeacherId, name: s.teacherName });
      }
    });
    return Array.from(map.values());
  }, [students]);

  const [className, setClassName] = useState('Class 8');
  const [teacherId, setTeacherId] = useState('teacher-1');

  const { showToast } = useNotifications();

  const handleOpenAdd = () => {
    setEditingClass(null);
    setClassName('Class 8');
    setTeacherId(existingTeachers[0]?.id || 'teacher-1');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassInfo) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setTeacherId(cls.classTeacherId);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingClassId) return;
    const targetClass = classesList.find(c => c.id === deletingClassId);
    setClassesList(prev => prev.filter(c => c.id !== deletingClassId));
    showToast(`✓ ${targetClass?.name || 'Class'} deleted successfully.`);
    setDeletingClassId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const teacherObj = existingTeachers.find(t => t.id === teacherId);
    const teacherName = teacherObj?.name || 'Usthad Shihabudheen Saadi';

    if (editingClass) {
      setClassesList(prev => prev.map(c => c.id === editingClass.id ? {
        ...c,
        name: className,
        classTeacherId: teacherId,
        classTeacherName: teacherName
      } : c));
      showToast(`✓ ${className} updated successfully.`);
    } else {
      const newC: ClassInfo = {
        id: `class-${Date.now()}`,
        name: className,
        classTeacherId: teacherId,
        classTeacherName: teacherName,
        studentCount: 0,
        averageAttendance: 95,
        averageProgress: 85
      };
      setClassesList(prev => [...prev, newC]);
      showToast(`✓ ${className} created successfully.`);
    }
    setIsModalOpen(false);
  };

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
            Configure Madrasa classes, assign class usthads, and manage classes
          </p>
        </div>

        <Button size="md" variant="primary" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Create New Class
        </Button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classesList.map(cls => (
          <Card key={cls.id} className="p-5 sm:p-6 hover:border-[#0F6B50] transition-all flex flex-col justify-between">
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
                <Badge variant="green" size="sm">{cls.studentCount} Students</Badge>
              </div>

              <p className="text-xs text-[#667085] mt-3">
                Class Usthad: <strong className="text-[#1F2933]">{cls.classTeacherName}</strong>
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E3EAE6] flex items-center justify-between gap-2">
              <div className="bg-[#FAF8F2] px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <span className="text-[10px] text-[#667085] uppercase font-bold">Attendance:</span>
                <span className="font-extrabold text-emerald-700 text-xs">{cls.averageAttendance}%</span>
              </div>

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

      {/* Create / Edit Class Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? `Edit ${editingClass.name}` : "Create New Class"}
        subtitle="Darunnajath Mundambra Class Allocation"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Class Name"
            placeholder="e.g. Class 5"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
          />

          <Select
            label="Assign Class Teacher"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
          >
            {existingTeachers.length === 0 ? (
              <option value="teacher-1">Usthad Shihabudheen Saadi</option>
            ) : (
              existingTeachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))
            )}
          </Select>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingClass ? "Save Changes" : "Create Class"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingClassId}
        onClose={() => setDeletingClassId(null)}
        title="Confirm Delete Class"
        subtitle="Darunnajath Mundambra Class Records"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#1F2933]">
            Are you sure you want to remove this class from the system? This action will remove the class record.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button variant="outline" size="sm" onClick={() => setDeletingClassId(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
              Delete Class
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
