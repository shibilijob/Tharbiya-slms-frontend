import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  GraduationCap,
  BookOpen,
  HeartHandshake,
  LogOut,
  ChevronRight,
  MoreHorizontal,
  X,
  Sparkles,
  CalendarDays,
  BookOpenCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { Toast } from '../feedback/Toast';
import { Logo } from '../common/Logo';
import { UpdateTimetableModal } from '../../features/teacher/UpdateTimetableModal';
import { UpdateSubjectsModal } from '../../features/teacher/UpdateSubjectsModal';
import { UpdatePracticalScoreModal } from '../../features/teacher/UpdatePracticalScoreModal';

export const TeacherLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
  const [isPracticalScoreModalOpen, setIsPracticalScoreModalOpen] = useState(false);

  // Mobile Bottom Navigation items (Thumb navigation)
  const bottomNavItems = [
    { label: 'Home', path: '/teacher/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Students', path: '/teacher/students', icon: <Users className="w-5 h-5" /> },
    { label: 'Attendance', path: '/teacher/attendance', icon: <CalendarCheck className="w-5 h-5" /> },
    { label: 'Quran', path: '/teacher/quran', icon: <BookOpen className="w-5 h-5" /> },
  ];

  // Desktop & Drawer full navigation items
  const teacherNavItems = [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'My Students', path: '/teacher/students', icon: <Users className="w-4 h-4" /> },
    { label: 'Mark Attendance', path: '/teacher/attendance', icon: <CalendarCheck className="w-4 h-4" /> },
    { label: 'Academic Assessments', path: '/teacher/assessments', icon: <GraduationCap className="w-4 h-4" /> },
    { label: 'Quran & Hifz Tracker', path: '/teacher/quran', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Practical Score & Awards', path: '/teacher/akhlaq-remarks', icon: <HeartHandshake className="w-4 h-4" /> }
  ];

  const moreMenuItems = [
    { label: 'Academic Assessments', path: '/teacher/assessments', icon: <GraduationCap className="w-5 h-5 text-[#0F6B50]" /> },
    { label: 'Practical Score & Awards', path: '/teacher/akhlaq-remarks', icon: <HeartHandshake className="w-5 h-5 text-[#C9A227]" /> }
  ];

  const isMoreActive = moreMenuItems.some(m => location.pathname === m.path);

  return (
    <div className="min-h-screen bg-[#FAF8F2] flex flex-col antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E3EAE6]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Branding & Usthad Greeting */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Link to="/teacher/dashboard" className="flex items-center gap-2.5">
                <Logo size="sm" imageClassName="w-9 h-9 sm:w-10 sm:h-10" />
              </Link>
              <div>
                <span className="text-xs sm:text-sm font-bold text-[#1F2933] block leading-tight">
                  Assalamu Alaikum 👋
                </span>
                <p className="text-[10px] sm:text-xs text-[#0F6B50] font-semibold truncate max-w-[150px] sm:max-w-[200px]">
                  {user?.name || "Usthad Shihabudheen Saadi"}
                </p>
              </div>
            </div>

            {/* Right: Assigned Class & Logout */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="px-2.5 py-1 bg-[#DDEDE5] rounded-xl text-[11px] sm:text-xs font-bold text-[#084C3A]">
                Class 5 & 6
              </div>

              {/* Logout Button */}
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login?role=TEACHER');
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

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Desktop Navigation Sidebar (>= 1024px) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 bg-white rounded-2xl p-3 border border-[#E3EAE6] shadow-sm space-y-1.5">
              <div className="p-3 bg-[#FAF8F2] rounded-xl mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">Faculty Mentorship</p>
                <p className="text-sm font-extrabold text-[#084C3A] mt-0.5">Class 5 Division A</p>
                <p className="text-[11px] text-[#667085] mt-0.5">25 Active Students</p>
              </div>

              {teacherNavItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      "flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all",
                      isActive
                        ? "bg-[#0F6B50] text-white shadow-sm shadow-[#0F6B50]/20"
                        : "text-[#1F2933] hover:bg-[#FAF8F2] hover:text-[#0F6B50]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? "text-white" : "text-[#0F6B50]"}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className={clsx("w-4 h-4", isActive ? "text-white" : "text-[#667085]")} />
                  </Link>
                );
              })}

              {/* Quick Workspace Actions in Sidebar */}
              <div className="pt-3 mt-3 border-t border-[#E3EAE6] space-y-1.5">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                  Class Actions
                </p>

                <button
                  type="button"
                  onClick={() => setIsPracticalScoreModalOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1F2933] hover:bg-[#DDEDE5]/50 hover:text-[#0F6B50] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#0F6B50]"><HeartHandshake className="w-4 h-4" /></span>
                    <span>Update Practical Score</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#667085]" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsTimetableModalOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1F2933] hover:bg-[#DDEDE5]/50 hover:text-[#0F6B50] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#0F6B50]"><CalendarDays className="w-4 h-4" /></span>
                    <span>Update Time Table</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#667085]" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsSubjectsModalOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1F2933] hover:bg-[#DDEDE5]/50 hover:text-[#0F6B50] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#C9A227]"><BookOpenCheck className="w-4 h-4" /></span>
                    <span>Update Subjects</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#667085]" />
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-9 safe-bottom-padding lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Teacher PWA Mobile Bottom Navigation (< 1024px) */}
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
                <div>{item.icon}</div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#0F6B50] mt-0.5" />
                )}
              </Link>
            );
          })}

          {/* More Action Button */}
          <button
            onClick={() => setIsMoreSheetOpen(true)}
            className={clsx(
              "flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative",
              isMoreActive ? "text-[#0F6B50] font-bold" : "text-[#667085] hover:text-[#1F2933]"
            )}
          >
            <div><MoreHorizontal className="w-5 h-5" /></div>
            <span className="text-[10px] tracking-tight mt-0.5">More</span>
            {isMoreActive && (
              <span className="w-1 h-1 rounded-full bg-[#0F6B50] mt-0.5" />
            )}
          </button>
        </div>
      </nav>

      {/* More Options Mobile Bottom Sheet */}
      {isMoreSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsMoreSheetOpen(false)}
          />
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl p-5 z-10 animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAE6]">
              <h3 className="text-sm font-bold text-[#1F2933]">Additional Teacher Tools</h3>
              <button onClick={() => setIsMoreSheetOpen(false)} className="p-1 text-[#667085]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 space-y-2">
              {/* Quick Update Practical Score */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  setIsPracticalScoreModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#FAF8F2] hover:bg-[#DDEDE5]/50 border border-[#E3EAE6] text-xs font-bold text-[#1F2933] transition-colors text-left"
              >
                <div className="p-2 rounded-xl bg-white border border-[#E3EAE6] text-[#0F6B50]">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#1F2933]">Update Practical Score</p>
                  <p className="text-[10px] text-[#667085] font-normal">Adab, Salah & Akhlaq scores</p>
                </div>
              </button>

              {/* Quick Update Time Table */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  setIsTimetableModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#FAF8F2] hover:bg-[#DDEDE5]/50 border border-[#E3EAE6] text-xs font-bold text-[#1F2933] transition-colors text-left"
              >
                <div className="p-2 rounded-xl bg-white border border-[#E3EAE6] text-[#0F6B50]">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#1F2933]">Update Time Table</p>
                  <p className="text-[10px] text-[#667085] font-normal">Class Dars periods & timings</p>
                </div>
              </button>

              {/* Quick Update Subjects */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  setIsSubjectsModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-[#FAF8F2] hover:bg-[#DDEDE5]/50 border border-[#E3EAE6] text-xs font-bold text-[#1F2933] transition-colors text-left"
              >
                <div className="p-2 rounded-xl bg-white border border-[#E3EAE6] text-[#C9A227]">
                  <BookOpenCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#1F2933]">Update Subjects</p>
                  <p className="text-[10px] text-[#667085] font-normal">Madrasa curriculum & Malayalam titles</p>
                </div>
              </button>

              {moreMenuItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMoreSheetOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF8F2] hover:bg-[#DDEDE5]/50 border border-[#E3EAE6] text-xs font-bold text-[#1F2933] transition-colors"
                >
                  <div className="p-2 rounded-xl bg-white border border-[#E3EAE6]">
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E3EAE6]">
              <button
                onClick={() => {
                  logout();
                  setIsMoreSheetOpen(false);
                  navigate('/login');
                }}
                className="w-full py-2.5 text-center text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                Logout from Teacher Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals for Teacher Portal */}
      <UpdateTimetableModal
        isOpen={isTimetableModalOpen}
        onClose={() => setIsTimetableModalOpen(false)}
      />

      <UpdateSubjectsModal
        isOpen={isSubjectsModalOpen}
        onClose={() => setIsSubjectsModalOpen(false)}
      />

      <UpdatePracticalScoreModal
        isOpen={isPracticalScoreModalOpen}
        onClose={() => setIsPracticalScoreModalOpen(false)}
      />

      <Toast />
    </div>
  );
};


