import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { TeacherUser } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../lib/axios';
import { Users, Plus, Edit2, Trash2, Phone, Mail, GraduationCap } from 'lucide-react';

const ALL_CLASSES = ['1', '2', '3', '4', '5', '6', '7'];

export const TeacherManagerView: React.FC = () => {
  const [teachersList, setTeachersList] = useState<TeacherUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherUser | null>(null);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);

  React.useEffect(() => {
    api.get<any[]>('/sadhr/muallims').then((res) => {
      if (res.data && Array.isArray(res.data)) {
        setTeachersList(res.data.map((t: any) => ({
          id: t.id || t._id,
          name: t.name,
          phone: t.phone,
          email: t.email,
          role: 'TEACHER',
          designation: t.designation || 'Usthad',
          assignedClasses: t.assignedClasses || [],
          assignedSubjects: t.assignedSubjects || [],
          madrasaName: 'Darunnajath Mundambra'
        })));
      }
    }).catch(() => {});
  }, []);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('Muallim');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['5']);

  const { showToast } = useNotifications();

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setName('');
    setPhone('+91 9847');
    setEmail('');
    setDesignation('Muallim');
    setSelectedClasses(['5']);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TeacherUser) => {
    setEditingTeacher(t);
    setName(t.name);
    setPhone(t.phone);
    setEmail(t.email || '');
    setDesignation(t.designation.toLowerCase().includes('sadhr') ? 'Sadhr Muallim' : 'Muallim');
    setSelectedClasses(t.assignedClasses.length > 0 ? t.assignedClasses : ['5']);
    setIsModalOpen(true);
  };

  const toggleClass = (clsNum: string) => {
    if (selectedClasses.includes(clsNum)) {
      if (selectedClasses.length === 1) {
        showToast('Usthad must be assigned to at least one class.');
        return;
      }
      setSelectedClasses(selectedClasses.filter(c => c !== clsNum));
    } else {
      setSelectedClasses([...selectedClasses, clsNum].sort((a, b) => Number(a) - Number(b)));
    }
  };

  const handleSelectAllToggle = () => {
    if (selectedClasses.length === ALL_CLASSES.length) {
      setSelectedClasses(['5']);
    } else {
      setSelectedClasses([...ALL_CLASSES]);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingTeacherId) return;
    const targetTeacher = teachersList.find(t => t.id === deletingTeacherId);
    setTeachersList(prev => prev.filter(t => t.id !== deletingTeacherId));
    showToast(`✓ Usthad ${targetTeacher?.name || ''} removed successfully.`);
    setDeletingTeacherId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const classArray = selectedClasses.length > 0 ? selectedClasses : ['5'];

    if (editingTeacher) {
      setTeachersList(prev => prev.map(t => t.id === editingTeacher.id ? {
        ...t,
        name,
        phone,
        email,
        designation,
        assignedClasses: classArray
      } : t));
      showToast(`✓ Usthad ${name} updated successfully.`);
    } else {
      const newT: TeacherUser = {
        id: `teacher-${Date.now()}`,
        name,
        role: 'TEACHER',
        phone,
        email,
        designation,
        assignedClasses: classArray,
        assignedSubjects: [],
        madrasaName: 'Darunnajath Mundambra'
      };
      setTeachersList(prev => [newT, ...prev]);
      showToast(`✓ New teacher ${name} added successfully.`);
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
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Muallim / Usthad Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Manage Madrasa Muallims, designations, assigned classes and contacts
          </p>
        </div>

        <Button size="md" variant="primary" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Add New Muallim
        </Button>
      </div>

      {/* Teachers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {teachersList.map(teacher => (
          <Card key={teacher.id} className="p-5 sm:p-6 hover:border-[#0F6B50] transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-[#1F2933]">{teacher.name}</h3>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                  teacher.designation.toLowerCase().includes('sadhr')
                    ? 'bg-[#C9A227]/15 text-[#916b0a] border border-[#C9A227]/30'
                    : 'bg-[#DDEDE5] text-[#084C3A]'
                }`}>
                  {teacher.designation}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(teacher)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeletingTeacherId(teacher.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#E3EAE6] space-y-2 text-xs text-[#667085]">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#0F6B50]" />
                <span className="font-bold text-[#1F2933]">{teacher.phone}</span>
                {teacher.email && <span>• {teacher.email}</span>}
              </div>

              <div className="flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-[#0F6B50]" />
                <span>Assigned Classes:</span>
                <div className="flex flex-wrap gap-1">
                  {teacher.assignedClasses.map(c => (
                    <Badge key={c} variant="green" size="sm">Class {c}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? `Edit Usthad: ${editingTeacher.name}` : "Add New Muallim"}
        subtitle="Darunnajath Mundambra Faculty"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Usthad Full Name"
            placeholder="e.g. Usthad Shibili Ahsani"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              label="Email Address (Optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Select
            label="Designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          >
            <option value="Muallim">Muallim</option>
            <option value="Sadhr Muallim">Sadhr Muallim</option>
          </Select>

          {/* Multi-Select Assigned Classes Toggle Chips */}
          <div className="bg-[#FAF8F2] p-4 rounded-2xl border border-[#E3EAE6]">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-[#1F2933] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#0F6B50]" />
                Assigned Classes ({selectedClasses.length} Selected)
              </label>
              <button
                type="button"
                onClick={handleSelectAllToggle}
                className="text-[11px] font-bold text-[#0F6B50] hover:underline"
              >
                {selectedClasses.length === ALL_CLASSES.length ? 'Reset Selection' : 'Select All Classes (1-7)'}
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {ALL_CLASSES.map(clsNum => {
                const isSelected = selectedClasses.includes(clsNum);
                return (
                  <button
                    key={clsNum}
                    type="button"
                    onClick={() => toggleClass(clsNum)}
                    className={`py-2 px-2 rounded-xl text-xs font-extrabold border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F6B50] text-white border-[#0F6B50] shadow-xs'
                        : 'bg-white text-[#667085] border-[#E3EAE6] hover:border-[#0F6B50] hover:text-[#1F2933]'
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider opacity-80">Class</span>
                    <span className="text-sm font-black">{clsNum}</span>
                    {isSelected ? (
                      <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded-full font-bold">✓</span>
                    ) : (
                      <span className="text-[9px] opacity-0">+</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#667085] mt-2">
              Tap each class to select or deselect. You can assign any combination of classes (e.g. Class 1, 3, 5).
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingTeacher ? "Save Changes" : "Create Teacher"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingTeacherId}
        onClose={() => setDeletingTeacherId(null)}
        title="Confirm Delete Usthad"
        subtitle="Darunnajath Mundambra Faculty Records"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#1F2933]">
            Are you sure you want to remove this Usthad from the faculty list? This action will delete the teacher record.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button variant="outline" size="sm" onClick={() => setDeletingTeacherId(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteConfirm}>
              Delete Usthad
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
