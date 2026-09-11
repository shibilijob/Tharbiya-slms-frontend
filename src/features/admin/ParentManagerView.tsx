import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { ConfirmationDialog } from '../../components/feedback/ConfirmationDialog';
import { parentService } from '../../services/parentService';
import { useNotifications } from '../../context/NotificationContext';
import { UserSquare2, Plus, Edit2, Trash2, Phone, Mail, Users, UserCheck, Search, RefreshCw, Lock, Eye, EyeOff, Copy, Check, KeyRound, Download } from 'lucide-react';

export interface ParentItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  role: 'PARENT';
  studentIds: string[];
  children?: {
    id: string;
    name: string;
    admissionNumber: string;
    className: string;
  }[];
  madrasaName?: string;
}

export const ParentManagerView: React.FC = () => {
  const { showToast } = useNotifications();

  const [parentsList, setParentsList] = useState<ParentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Password Visibility States
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalPasswordVisible, setIsModalPasswordVisible] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<ParentItem | null>(null);
  const [deletingParentId, setDeletingParentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const toggleRevealPassword = (id: string) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCredentials = (parent: ParentItem) => {
    if (!parent.password) {
      showToast(`No stored password is available for ${parent.name}.`);
      return;
    }

    const text = `Parent Portal Login:\nMobile: ${parent.phone}\nPassword: ${parent.password}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(parent.id);
      showToast(`📋 Copied login credentials for ${parent.name}`);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const loadParents = async () => {
    setIsLoading(true);
    try {
      const data = await parentService.getAllParents();
      if (Array.isArray(data)) {
        setParentsList(
          data.map((p: any) => ({
            id: p.id || p._id,
            name: p.name,
            phone: p.phone,
            email: p.email || '',
            password: p.password || '',
            role: 'PARENT',
            studentIds: p.studentIds || [],
            children: p.children || [],
            madrasaName: 'Darunnajath Mundambra',
          }))
        );
      }
    } catch (err: any) {
      console.error('Failed to load parents:', err);
      setParentsList([]);
      showToast(err?.message || 'Failed to load parent accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadParents();
  }, []);

  const handleOpenAdd = () => {
    setEditingParent(null);
    setName('');
    setPhone('9847');
    setEmail('');
    setPassword('');
    setIsModalPasswordVisible(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ParentItem) => {
    setEditingParent(p);
    setName(p.name);
    setPhone(p.phone);
    setEmail(p.email || '');
    setPassword(p.password || '');
    setIsModalPasswordVisible(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Guardian name is required.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 5) {
      setFormError('A valid mobile phone number is required.');
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      if (editingParent) {
        const updatePayload: any = {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() ? email.trim() : undefined,
        };
        if (password.trim()) {
          updatePayload.password = password.trim();
        }

        const res = await parentService.updateParent(editingParent.id, updatePayload);
        showToast(`✓ Parent ${name} updated successfully.`);
      } else {
        const createPayload = {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() ? email.trim() : undefined,
        };

        const res = await parentService.createParent(createPayload);
        showToast(`✓ Parent ${name} registered successfully.`);
      }

      setIsModalOpen(false);
      await loadParents();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save parent details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadAllParentDetails = async () => {
    setIsDownloading(true);
    try {
      await parentService.downloadAllParentDetails();
      showToast('Parent details PDF downloaded successfully.');
    } catch (err: any) {
      showToast(err?.message || 'Failed to download parent details PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingParentId) return;

    try {
      await parentService.deleteParent(deletingParentId);
      showToast('✓ Parent account removed successfully.');
      setParentsList((prev) => prev.filter((p) => p.id !== deletingParentId));
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete parent account.');
    } finally {
      setDeletingParentId(null);
    }
  };

  const filteredParents = parentsList.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesName = p.name.toLowerCase().includes(query);
    const matchesPhone = p.phone.toLowerCase().includes(query);
    const matchesEmail = p.email?.toLowerCase().includes(query);
    const matchesChild = p.children?.some((c) => c.name.toLowerCase().includes(query) || c.admissionNumber.toLowerCase().includes(query));
    return matchesName || matchesPhone || matchesEmail || matchesChild;
  });

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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            size="md"
            variant="outline"
            onClick={handleDownloadAllParentDetails}
            isLoading={isDownloading}
            disabled={isDownloading}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Download All Parent Details
          </Button>
          <Button size="md" variant="outline" onClick={loadParents} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
          <Button size="md" variant="primary" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
            Register Parent
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E3EAE6] shadow-xs flex items-center gap-3">
        <Search className="w-5 h-5 text-[#667085]" />
        <input
          type="text"
          placeholder="Search by parent name, mobile number, or child name..."
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

      {/* Parents Grid */}
      {isLoading && parentsList.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-3 border-[#DDEDE5] border-t-[#0F6B50] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#667085] font-semibold">Loading registered parents...</p>
        </div>
      ) : filteredParents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E3EAE6]">
          <UserSquare2 className="w-12 h-12 text-[#667085] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-[#1F2933]">No Parents Found</h3>
          <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
            {searchQuery ? 'No parents match your search query.' : 'No parent accounts have been registered yet.'}
          </p>
          {!searchQuery && (
            <Button size="sm" variant="primary" className="mt-4" onClick={handleOpenAdd}>
              Register First Parent
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredParents.map((parent) => {
            const childrenToShow = parent.children || [];

            return (
              <Card key={parent.id} className="p-5 sm:p-6 hover:border-[#0F6B50] transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#DDEDE5] text-[#0F6B50] flex items-center justify-center shrink-0 border-2 border-[#0F6B50]/30 shadow-xs">
                      <UserCheck className="w-6 h-6 text-[#0F6B50]" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-[#1F2933]">{parent.name}</h3>
                      <p className="text-xs text-[#0F6B50] font-semibold flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {parent.phone}
                      </p>
                      {parent.email ? (
                        <p className="text-[11px] text-[#667085] flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {parent.email}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => handleOpenEdit(parent)}>
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <button
                      onClick={() => setDeletingParentId(parent.id)}
                      className="p-2 text-[#667085] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete Parent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Password / Credentials Box */}
                <div className="mt-3.5 p-3 rounded-2xl bg-[#FAF8F2] border border-[#E3EAE6] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-100/70 text-amber-800 shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Portal Password / PIN</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-black font-mono tracking-wider text-[#1F2933]">
                          {revealedPasswords[parent.id] ? (parent.password || 'Not available') : '••••••••'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleRevealPassword(parent.id)}
                      className="p-2 rounded-xl text-[#667085] hover:text-[#0F6B50] hover:bg-[#DDEDE5] transition-all"
                      title={revealedPasswords[parent.id] ? "Hide Password" : "Show Password"}
                    >
                      {revealedPasswords[parent.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyCredentials(parent)}
                      className="p-2 rounded-xl text-[#667085] hover:text-[#0F6B50] hover:bg-[#DDEDE5] transition-all flex items-center gap-1 text-xs font-bold"
                      title="Copy Login Details"
                    >
                      {copiedId === parent.id ? (
                        <>
                          <Check className="w-4 h-4 text-[#0F6B50]" />
                          <span className="text-[11px] text-[#0F6B50]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="text-[11px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-3.5 pt-3.5 border-t border-[#E3EAE6]">
                  <p className="text-xs font-bold text-[#667085] mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0F6B50]" />
                    Linked Children ({childrenToShow.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {childrenToShow.length > 0 ? (
                      childrenToShow.map((child: any) => (
                        <span
                          key={child.id}
                          className="px-2.5 py-1 rounded-xl bg-[#FAF8F2] border border-[#E3EAE6] text-xs font-semibold text-[#1F2933]"
                        >
                          {child.name} ({child.className || 'Class'})
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
      )}

      {/* Add / Edit Parent Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingParent ? `Edit Parent: ${editingParent.name}` : 'Register New Parent'}
        subtitle="Guardian details for SMS and portal login access"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {formError}
            </div>
          )}

          <Input
            label="Guardian Full Name"
            placeholder="e.g. Ali Mundambra"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Mobile Number (Primary Login Identifier)"
            placeholder="e.g. 9847123456"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
            required
          />

          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="e.g. parent@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          {editingParent ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1F2933]">
                Password / PIN (Leave unchanged or enter new)
              </label>
              <div className="relative">
                <input
                  type={isModalPasswordVisible ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FAF8F2] border border-[#E3EAE6] rounded-xl px-3.5 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-[#1F2933] font-mono placeholder-[#667085] focus:border-[#0F6B50] focus:ring-1 focus:ring-[#0F6B50] outline-none"
                />
                <Lock className="w-4 h-4 text-[#667085] absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setIsModalPasswordVisible(!isModalPasswordVisible)}
                  className="p-1 text-[#667085] hover:text-[#1F2933] absolute right-3 top-2.5"
                  title={isModalPasswordVisible ? "Hide password" : "Show password"}
                >
                  {isModalPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-[#667085]">
                Parents will use their Mobile Number ({phone || 'Phone'}) and this Password to sign into the Parent Portal.
              </p>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              {editingParent ? 'Save Changes' : 'Register Parent'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingParentId}
        onClose={() => setDeletingParentId(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Parent Account"
        message="Are you sure you want to remove this parent account? The record will be archived safely."
        confirmText="Remove Parent"
        variant="danger"
      />
    </div>
  );
};
