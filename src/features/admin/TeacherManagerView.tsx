import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { ConfirmationDialog } from '../../components/feedback/ConfirmationDialog';
import { TeacherUser } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../lib/axios';
import { Users, Plus, Edit2, Trash2, Phone, Mail, GraduationCap, Search, RefreshCw, Lock } from 'lucide-react';

const ALL_CLASSES = ['1', '2', '3', '4', '5', '6', '7'];

export const TeacherManagerView: React.FC = () => {
  const [teachersList, setTeachersList] = useState<TeacherUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherUser | null>(null);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [designation, setDesignation] = useState('Muallim');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['5']);

  const { showToast } = useNotifications();

  const loadTeachers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>('/sadhr/muallims');
      const rawData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      if (Array.isArray(rawData)) {
        setTeachersList(
          rawData.map((t: any) => ({
            id: t.id || t._id,
            name: t.name,
            phone: t.phone,
            email: t.email,
            role: t.role || 'MUALLIM',
            designation: t.designation || (t.role === 'SADHR_MUALLIM' ? 'Sadhr Muallim' : 'Muallim'),
            assignedClasses: t.assignedClasses || [],
            assignedSubjects: t.assignedSubjects || [],
            madrasaName: 'Darunnajath Mundambra',
          }))
        );
      }
    } catch (err: any) {
      console.error('Failed to fetch muallims:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setName('');
    setPhone('9847');
    setEmail('');
    setPassword('muallim123');
    setDesignation('Muallim');
    setSelectedClasses(['5']);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TeacherUser) => {
    setEditingTeacher(t);
    setName(t.name);
    setPhone(t.phone);
    setEmail(t.email || '');
    setPassword('');
    setDesignation(t.designation.toLowerCase().includes('sadhr') ? 'Sadhr Muallim' : 'Muallim');
    setSelectedClasses(t.assignedClasses.length > 0 ? t.assignedClasses : ['5']);
    setFormError(null);
    setIsModalOpen(true);
  };

  const toggleClass = (clsNum: string) => {
    if (selectedClasses.includes(clsNum)) {
      if (selectedClasses.length === 1) {
        showToast('Usthad must be assigned to at least one class.');
        return;
      }
      setSelectedClasses(selectedClasses.filter((c) => c !== clsNum));
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

  const handleDeleteConfirm = async () => {
    if (!deletingTeacherId) return;

    try {
      await api.delete(`/sadhr/muallims/${deletingTeacherId}`);
      showToast('✓ Usthad removed and archived successfully.');
      setTeachersList((prev) => prev.filter((t) => t.id !== deletingTeacherId));
    } catch (err: any) {
      showToast(err?.message || 'Failed to remove Usthad record.');
    } finally {
      setDeletingTeacherId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Usthad name is required.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 5) {
      setFormError('A valid mobile phone number is required.');
      return;
    }

    const classArray = selectedClasses.length > 0 ? selectedClasses : ['5'];
    const isSadhr = designation.toLowerCase().includes('sadhr');
    const role = isSadhr ? 'SADHR_MUALLIM' : 'MUALLIM';

    setFormError(null);
    setIsSaving(true);

    try {
      if (editingTeacher) {
        const payload: any = {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() ? email.trim() : undefined,
          designation: designation.trim(),
          role,
          assignedClasses: classArray,
        };
        if (password.trim()) {
          payload.password = password.trim();
        }

        await api.patch(`/sadhr/muallims/${editingTeacher.id}`, payload);
        showToast(`✓ Usthad ${name} updated successfully.`);
      } else {
        const payload = {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() ? email.trim() : undefined,
          password: password.trim() ? password.trim() : 'muallim123',
          designation: designation.trim(),
          role,
          assignedClasses: classArray,
          assignedSubjects: [],
        };

        await api.post('/sadhr/muallims', payload);
        showToast(`✓ Usthad ${name} added successfully.`);
      }

      setIsModalOpen(false);
      await loadTeachers();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to save Usthad record.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTeachers = teachersList.filter((t) => {
    const query = searchQuery.toLowerCase();
    const matchesName = t.name.toLowerCase().includes(query);
    const matchesPhone = t.phone.toLowerCase().includes(query);
    const matchesEmail = t.email?.toLowerCase().includes(query);
    const matchesDesignation = t.designation.toLowerCase().includes(query);
    const matchesClasses = t.assignedClasses.some((c) => c.includes(query));
    return matchesName || matchesPhone || matchesEmail || matchesDesignation || matchesClasses;
  });

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
            Manage Madrasa Muallims, designations, assigned classes, and portal logins
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="md" variant="outline" onClick={loadTeachers} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          <Button size="md" variant="primary" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
            Add New Muallim
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E3EAE6] shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-[#667085]" />
        <input
          type="text"
          placeholder="Search by Usthad name, mobile number, designation, or class..."
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

      {/* Teachers Cards Grid */}
      {isLoading && teachersList.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-3 border-[#DDEDE5] border-t-[#0F6B50] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#667085] font-semibold">Loading Muallims list...</p>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E3EAE6]">
          <Users className="w-12 h-12 text-[#667085] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-[#1F2933]">No Muallims Found</h3>
          <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
            {searchQuery ? 'No Usthad records match your search criteria.' : 'No Muallims have been added yet.'}
          </p>
          {!searchQuery && (
            <Button size="sm" variant="primary" className="mt-4" onClick={handleOpenAdd}>
              Add First Muallim
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="p-5 sm:p-6 hover:border-[#0F6B50] transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-[#1F2933]">{teacher.name}</h3>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                      teacher.designation.toLowerCase().includes('sadhr')
                        ? 'bg-[#C9A227]/15 text-[#916b0a] border border-[#C9A227]/30'
                        : 'bg-[#DDEDE5] text-[#084C3A]'
                    }`}
                  >
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
                    {teacher.assignedClasses.map((c) => (
                      <Badge key={c} variant="green" size="sm">
                        Class {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? `Edit Usthad: ${editingTeacher.name}` : 'Add New Muallim'}
        subtitle="Darunnajath Mundambra Faculty Roster"
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {formError}
            </div>
          )}

          <Input
            label="Usthad Full Name"
            placeholder="e.g. Usthad Shibili Ahsani"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone Number (Login Identifier)"
              placeholder="e.g. 9847654321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
              required
            />
            <Input
              label="Email Address (Optional)"
              type="email"
              placeholder="e.g. shibili@darunnajath.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            >
              <option value="Muallim">Muallim</option>
              <option value="Sadhr Muallim">Sadhr Muallim</option>
            </Select>

            <Input
              label={editingTeacher ? 'Change Password (Optional)' : 'Password for Login'}
              type="password"
              placeholder={editingTeacher ? '••••••••' : 'e.g. muallim123'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              helperText="Muallims can log in using this password."
            />
          </div>

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
                {selectedClasses.length === ALL_CLASSES.length
                  ? 'Reset Selection'
                  : 'Select All Classes (1-7)'}
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {ALL_CLASSES.map((clsNum) => {
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
                      <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded-full font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="text-[9px] opacity-0">+</span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#667085] mt-2">
              Tap each class to select or deselect. You can assign any combination of classes (e.g.
              Class 1, 3, 5).
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              {editingTeacher ? 'Save Changes' : 'Create Muallim'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingTeacherId}
        onClose={() => setDeletingTeacherId(null)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Remove Usthad"
        message="Are you sure you want to remove this Usthad from the active faculty roster? The record will be archived safely."
        confirmText="Remove Usthad"
        variant="danger"
      />
    </div>
  );
};
