import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Megaphone, Plus, Trash2, Calendar, User, Send } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const AnnouncementsManagerView: React.FC = () => {
  const { user } = useAuth();
  const { announcements, addAnnouncement, deleteAnnouncement } = useData();
  const { showToast, pushNotification } = useNotifications();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'PARENTS' | 'TEACHERS'>('ALL');
  const [important, setImportant] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSaving(true);
    try {
      await addAnnouncement({
        title,
        content,
        targetAudience,
        authorName: user?.name || "Usthad Shihabudheen Saadi (Sadhr Muallim)",
        important
      });

      showToast(`✓ Announcement published to ${targetAudience}.`);

      // Push notification broadcast
      await pushNotification({
        userId: "parent-1",
        title: `Notice: ${title}`,
        message: content.slice(0, 80) + '...',
        category: "ANNOUNCEMENT"
      });

      setTitle('');
      setContent('');
      setIsModalOpen(false);
    } catch (e) {
      console.error("Failed to post announcement", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAnnouncement(id);
    showToast(`Notice deleted.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <Megaphone className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Notice Board & Announcements Manager
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Broadcast official circulars to parents and teachers of Darunnajath Mundambra
          </p>
        </div>

        <Button
          size="md"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Notice
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map(ann => (
          <Card
            key={ann.id}
            className={`p-6 ${ann.important ? 'border-l-4 border-l-[#0F6B50] bg-white' : 'bg-[#FAF8F2]'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#1F2933]">{ann.title}</h3>
                  {ann.important && <Badge variant="gold" size="sm">Urgent</Badge>}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#667085] mt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#0F6B50]" />
                    {ann.authorName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#0F6B50]" />
                    {formatDate(ann.date)}
                  </span>
                  <span>•</span>
                  <Badge variant="gray" size="sm">Audience: {ann.targetAudience}</Badge>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                className="text-rose-600 hover:bg-rose-50 border-rose-200"
                onClick={() => handleDelete(ann.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            <p className="font-malayalam text-xs sm:text-sm text-[#1F2933] leading-relaxed mt-3 pt-3 border-t border-[#E3EAE6]">
              {ann.content}
            </p>
          </Card>
        ))}
      </div>

      {/* Post Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Publish Official Announcement"
        subtitle="Notice will be delivered to parents and teachers"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <Input
            label="Notice Title"
            placeholder="e.g. വാർഷിക ഖുർആൻ പാരായണ മത്സരം (Annual Quran Competition)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Select
            label="Target Audience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value as any)}
          >
            <option value="ALL">All (Parents & Teachers)</option>
            <option value="PARENTS">Parents Only</option>
            <option value="TEACHERS">Teachers Only</option>
          </Select>

          <div>
            <label className="block text-xs font-bold text-[#1F2933] uppercase tracking-wider mb-1.5">
              Notice Content
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter official circular details..."
              className="w-full rounded-xl border border-[#E3EAE6] bg-white p-3 text-xs sm:text-sm text-[#1F2933] focus:border-[#0F6B50] outline-none"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isImpAnn"
              checked={important}
              onChange={(e) => setImportant(e.target.checked)}
              className="w-4 h-4 rounded text-[#0F6B50] focus:ring-[#0F6B50]"
            />
            <label htmlFor="isImpAnn" className="text-xs font-semibold text-[#1F2933] cursor-pointer">
              Mark as High Priority / Urgent Notice
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E3EAE6]">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving} rightIcon={<Send className="w-3.5 h-3.5" />}>
              Publish Notice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
