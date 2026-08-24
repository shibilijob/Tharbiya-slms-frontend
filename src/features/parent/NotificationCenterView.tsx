import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  Bell,
  CheckCircle2,
  CalendarCheck2,
  BookOpen,
  Award,
  MessageSquareQuote,
  Megaphone,
  GraduationCap
} from 'lucide-react';
import { formatTimeAgo } from '../../utils/formatters';

export const NotificationCenterView: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ATTENDANCE': return <CalendarCheck2 className="w-5 h-5 text-emerald-600" />;
      case 'QURAN': return <BookOpen className="w-5 h-5 text-[#0F6B50]" />;
      case 'REMARK': return <MessageSquareQuote className="w-5 h-5 text-[#084C3A]" />;
      case 'ACHIEVEMENT': return <Award className="w-5 h-5 text-[#C9A227]" />;
      case 'ASSESSMENT': return <GraduationCap className="w-5 h-5 text-blue-600" />;
      default: return <Megaphone className="w-5 h-5 text-[#0F6B50]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E3EAE6] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#DDEDE5] text-[#0F6B50]">
              <Bell className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1F2933]">
              Notifications & Alerts
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Real-time updates regarding student attendance, Quran milestones, and remarks
          </p>
        </div>

        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={markAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map(n => (
          <Card
            key={n.id}
            onClick={() => !n.read && markAsRead(n.id)}
            className={`p-4 sm:p-5 transition-all cursor-pointer ${
              !n.read
                ? 'bg-white border-[#0F6B50] shadow-sm ring-1 ring-[#0F6B50]/20'
                : 'bg-[#FAF8F2] opacity-85 hover:opacity-100'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E3EAE6] flex items-center justify-center shrink-0">
                {getCategoryIcon(n.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm font-bold truncate ${!n.read ? 'text-[#084C3A]' : 'text-[#1F2933]'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-[#667085] shrink-0 font-medium">
                    {formatTimeAgo(n.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-[#667085] mt-1 leading-relaxed">
                  {n.message}
                </p>
              </div>

              {!n.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F6B50] shrink-0 mt-1.5" />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
