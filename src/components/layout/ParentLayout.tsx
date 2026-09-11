import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNotifications } from '../../context/NotificationContext';
import { Avatar } from '../common/Avatar';
import {
  Home,
  TrendingUp,
  CalendarCheck2,
  Bell,
  UserCheck,
  ChevronDown,
  BookOpen,
  Sparkles,
  HeartHandshake,
  LogOut,
  Award
} from 'lucide-react';
import { clsx } from 'clsx';
import { Toast } from '../feedback/Toast';
import { Logo } from '../common/Logo';

export const ParentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { students, selectedChildId, setSelectedChildId } = useData();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const [isChildDropdownOpen, setIsChildDropdownOpen] = useState(false);

  const userStudentIds = (user as any)?.studentIds || [];
  const parentChildren = userStudentIds.length > 0
    ? students.filter(s => userStudentIds.includes(s.id))
    : students;
  const currentChild = parentChildren.find(s => s.id === selectedChildId) || parentChildren[0];

  useEffect(() => {
    if (parentChildren.length > 0 && !parentChildren.some(child => child.id === selectedChildId)) {
      setSelectedChildId(parentChildren[0].id);
    }
    if (parentChildren.length === 0 && selectedChildId) {
      setSelectedChildId('');
    }
  }, [parentChildren, selectedChildId, setSelectedChildId]);

  const bottomNavItems = [
    { label: 'Home', path: '/parent/dashboard', icon: <Home className="w-5 h-5" /> },
    { label: 'Progress', path: '/parent/progress', icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Attendance', path: '/parent/attendance', icon: <CalendarCheck2 className="w-5 h-5" /> },
    {
      label: 'Alerts',
      path: '/parent/notifications',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { label: 'Profile', path: '/parent/profile', icon: <UserCheck className="w-5 h-5" /> }
  ];

  const desktopNavItems = [
    { label: 'Dashboard', path: '/parent/dashboard', icon: <Home className="w-4 h-4" /> },
    { label: 'Child Profile', path: '/parent/child-profile', icon: <UserCheck className="w-4 h-4" /> },
    { label: 'Academic Progress', path: '/parent/progress', icon: <TrendingUp className="w-4 h-4" /> },
    { label: 'Hifz', path: '/parent/quran', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Attendance', path: '/parent/attendance', icon: <CalendarCheck2 className="w-4 h-4" /> },
    { label: 'Practical Score', path: '/parent/akhlaq', icon: <HeartHandshake className="w-4 h-4" /> },
    { label: 'Achievements', path: '/parent/achievements', icon: <Award className="w-4 h-4" /> },
    {
      label: 'Notifications',
      path: '/parent/notifications',
      icon: <Bell className="w-4 h-4" />,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { label: 'My Account', path: '/parent/profile', icon: <Sparkles className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F2] flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E3EAE6]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Left: Branding & Greeting */}
            <div className="flex items-center gap-3">
              <Link to="/parent/dashboard" className="flex items-center gap-2.5">
                <Logo size="sm" imageClassName="w-9 h-9 sm:w-10 sm:h-10" />
              </Link>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-[#1F2933]">
                    Assalamu Alaikum 👋
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#667085] truncate max-w-[140px] sm:max-w-[200px]">
                  {user?.name || 'Parent'}
                </p>
              </div>
            </div>

            {/* Right: Child Selector & Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Active Child Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsChildDropdownOpen(!isChildDropdownOpen)}
                  disabled={parentChildren.length === 0}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-[#FAF8F2] hover:bg-[#DDEDE5]/50 border border-[#E3EAE6] rounded-xl transition-colors text-left"
                >
                  <Avatar name={currentChild?.name || 'Student'} src={currentChild?.avatar} size="sm" />
                  <div className="hidden xs:block">
                    <p className="text-xs font-bold text-[#084C3A] leading-tight flex items-center gap-1">
                      {currentChild?.name || 'No children'}
                      {currentChild?.class && (
                        <span className="text-[10px] font-semibold text-[#0F6B50] bg-[#DDEDE5] px-1.5 py-0.2 rounded-md">
                          Class {currentChild.class}
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#667085]" />
                </button>

                {isChildDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E3EAE6] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                      Select Child
                    </p>
                    {parentChildren.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-[#667085]">No enrolled children found.</p>
                    ) : parentChildren.map(child => (
                      <button
                        key={child.id}
                        onClick={() => {
                          setSelectedChildId(child.id);
                          setIsChildDropdownOpen(false);
                        }}
                        className={clsx(
                          "w-full px-3 py-2.5 text-left flex items-center gap-2.5 hover:bg-[#FAF8F2] transition-colors",
                          child.id === currentChild?.id && "bg-[#DDEDE5]/40 text-[#084C3A] font-bold"
                        )}
                      >
                        <Avatar name={child.name} src={child.avatar} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#1F2933] truncate">{child.name}</p>
                          <p className="text-[10px] text-[#667085]">Class {child.class}</p>
                        </div>
                        {child.id === currentChild?.id && (
                          <span className="w-2 h-2 rounded-full bg-[#0F6B50]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <Link
                to="/parent/notifications"
                className="relative p-2 rounded-xl text-[#1F2933] hover:bg-[#FAF8F2] border border-[#E3EAE6] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#0F6B50]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>

              {/* Logout Button */}
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login?role=PARENT');
                }}
                className="p-2 rounded-xl text-[#667085] hover:text-rose-600 hover:bg-rose-50 border border-[#E3EAE6] hover:border-rose-200 transition-colors flex items-center gap-1.5"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                <span className="hidden sm:inline text-xs font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Desktop Sidebar (visible on lg screens) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              {/* Active Child Dossier Mini-card */}
              {currentChild ? (
              <div className="bg-white rounded-2xl p-4 border border-[#E3EAE6] shadow-sm flex items-center gap-3">
                <Avatar name={currentChild?.name || 'Student'} src={currentChild?.avatar} size="lg" ring />
                <div>
                  <h4 className="font-bold text-[#1F2933] text-sm leading-tight">{currentChild?.name || 'No children linked'}</h4>
                  {currentChild?.malayalamName && (
                    <p className="font-malayalam text-xs text-[#0F6B50] font-semibold">{currentChild.malayalamName}</p>
                  )}
                  <p className="text-xs text-[#667085] mt-0.5">Class {currentChild.class} • Adm: {currentChild.admissionNo}</p>
                </div>
              </div>
              ) : (
                <div className="bg-white rounded-2xl p-4 border border-[#E3EAE6] shadow-sm">
                  <h4 className="font-bold text-[#1F2933] text-sm leading-tight">No children linked</h4>
                  <p className="text-xs text-[#667085] mt-0.5">No enrolled children found.</p>
                </div>
              )}

              {/* Navigation Links */}
              <div className="bg-white rounded-2xl p-3 border border-[#E3EAE6] shadow-sm space-y-1">
                {desktopNavItems.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={clsx(
                        "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                        isActive
                          ? "bg-[#0F6B50] text-white shadow-sm shadow-[#0F6B50]/20"
                          : "text-[#1F2933] hover:bg-[#FAF8F2] hover:text-[#0F6B50]"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? "text-white" : "text-[#0F6B50]"}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={clsx("px-1.5 py-0.2 rounded-full text-[10px] font-bold", isActive ? "bg-white text-[#0F6B50]" : "bg-rose-500 text-white")}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-9 safe-bottom-padding lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation (Visible on mobile/tablet screens < 1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#E3EAE6] px-2 py-1 safe-bottom-margin shadow-lg shadow-black/5">
        <div className="flex items-center justify-around">
          {bottomNavItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative",
                  isActive ? "text-[#0F6B50] font-bold" : "text-[#667085] hover:text-[#1F2933]"
                )}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#0F6B50] mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <Toast />
    </div>
  );
};
