import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { ParentUser } from '../../types';
import { useData } from '../../context/DataContext';
import { useNotifications } from '../../context/NotificationContext';
import { UserSquare2, Plus, Edit2, Phone, Mail, Users, UserCheck } from 'lucide-react';

export const ParentManagerView: React.FC = () => {
  const { students } = useData();

  const dynamicParents = React.useMemo(() => {
    const map = new Map<string, ParentUser>();
    students.forEach(s => {
      if (s.parentId && s.parentName && !map.has(s.parentId)) {
        map.set(s.parentId, {
          id: s.parentId,
          name: s.parentName,
          role: 'PARENT',
          phone: s.parentPhone || '',
          email: '',
          studentIds: [s.id],
          madrasaName: 'Darunnajath Mundambra'
        });
      } else if (s.parentId && map.has(s.parentId)) {
        const existing = map.get(s.parentId)!;
        if (!existing.studentIds.includes(s.id)) {
          existing.studentIds.push(s.id);
        }
      }
    });
    return Array.from(map.values());
  }, [students]);

  const [parentsList, setParentsList] = useState<ParentUser[]>([]);

  React.useEffect(() => {
    setParentsList(dynamicParents);
  }, [dynamicParents]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<ParentUser | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const { showToast } = useNotifications();

  const handleOpenAdd = () => {
    setEditingParent(null);
    setName('');
    setPhone('9847');
    setEmail('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ParentUser) => {
    setEditingParent(p);
    setName(p.name);
    setPhone(p.phone);
    setEmail(p.email || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingParent) {
      setParentsList(prev => prev.map(p => p.id === editingParent.id ? {
        ...p,
        name,
        phone,
        email
      } : p));
      showToast(`✓ Parent ${name} updated.`);
    } else {
      const newP: ParentUser = {
        id: `parent-${Date.now()}`,
        name,
        role: 'PARENT',
        phone,
        email,
        studentIds: [],
        madrasaName: 'Darunnajath Mundambra'
      };
      setParentsList(prev => [newP, ...prev]);
      showToast(`✓ Parent ${name} registered.`);
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
              <UserSquare2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Parent & Guardian Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Registered guardian accounts, phone numbers, and linked students
          </p>
        </div>

        <Button size="md" variant="primary" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
          Register Parent
        </Button>
      </div>

      {/* Parents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {parentsList.map(parent => {
          const linkedStudents = students.filter(s => s.parentId === parent.id || parent.studentIds.includes(s.id));

          return (
            <Card key={parent.id} className="p-5 sm:p-6 hover:border-[#0F6B50] transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center shrink-0 border-2 border-[#0F6B50]/30 shadow-xs">
                    <UserCheck className="w-6 h-6 text-[#0F6B50]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#1F2933]">{parent.name}</h3>
                    <p className="text-xs text-[#0F6B50] font-semibold">{parent.phone}</p>
                    {parent.email && <p className="text-[10px] text-[#667085]">{parent.email}</p>}
                  </div>
                </div>

                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(parent)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E3EAE6]">
                <p className="text-xs font-bold text-[#667085] mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#0F6B50]" />
                  Linked Children ({linkedStudents.length}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {linkedStudents.length > 0 ? (
                    linkedStudents.map(child => (
                      <span key={child.id} className="px-2.5 py-1 rounded-xl bg-[#FAF8F2] border border-[#E3EAE6] text-xs font-semibold text-[#1F2933]">
                        {child.name} (Class {child.class})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#667085] italic">No active children linked yet</span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Parent Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingParent ? `Edit Parent: ${editingParent.name}` : "Register Parent"}
        subtitle="Guardian details for SMS and portal login"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Guardian Full Name"
            placeholder="e.g. Ali Mundambra"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Mobile Number (Primary for Login)"
            placeholder="e.g. 9847123456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            placeholder="e.g. parent@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingParent ? "Save Changes" : "Register Parent"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
