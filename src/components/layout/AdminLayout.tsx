import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserSquare2,
  Layers,
  FileSpreadsheet,
  LogOut,
  ShieldCheck,
  ChevronRight,
  MoreHorizontal,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { Toast } from '../feedback/Toast';
import { Logo } from '../common/Logo';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  // Mobile Bottom Navigation items (Thumb navigation)
  const bottomNavItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Students', path: '/admin/students', icon: <GraduationCap className="w-5 h-5" /> },
    { label: 'Muallims', path: '/admin/teachers', icon: <Users className="w-5 h-5" /> },
    { label: 'Reports', path: '/admin/reports', icon: <FileSpreadsheet className="w-5 h-5" /> },
  ];

  // Full Navigation list
  const adminNavItems = [
    { label: 'Overview Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Student Management', path: '/admin/students', icon: <GraduationCap className="w-4 h-4" /> },
    { label: 'Muallim Management', path: '/admin/teachers', icon: <Users className="w-4 h-4" /> },
    { label: 'Parent Management', path: '/admin/parents', icon: <UserSquare2 className="w-4 h-4" /> },
    { label: 'Class Management', path: '/admin/classes', icon: <Layers className="w-4 h-4" /> },
    { label: 'Reports Center', path: '/admin/reports', icon: <FileSpreadsheet className="w-4 h-4" /> }
  ];

  const moreMenuItems = [
    { label: 'My Muallim Dashboard', path: '/teacher/dashboard', icon: <GraduationCap className="w-5 h-5 text-[#0F6B50]" /> },
    { label: 'Parent Management', path: '/admin/parents', icon: <UserSquare2 className="w-5 h-5 text-[#0F6B50]" /> },
    { label: 'Class Management', path: '/admin/classes', icon: <Layers className="w-5 h-5 text-[#C9A227]" /> }
  ];

  const isMoreActive = moreMenuItems.some(m => location.pathname === m.path);

  return (
    <div className="min-h-screen bg-[#FAF8F2] flex flex-col antialiased">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-[#084C3A] text-white border-b border-[#0F6B50]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Link to="/admin/dashboard" className="flex items-center gap-2.5">
                <Logo size="sm" imageClassName="w-9 h-9 sm:w-10 sm:h-10" />
              </Link>
              <div>
                <span className="text-xs sm:text-sm font-bold text-white block leading-tight">
                  Darunnajath Mundambra
                </span>
                <span className="text-[10px] sm:text-xs font-semibold text-[#C9A227] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#C9A227]" />
                  Sadhr Muallim Office
                </span>
              </div>
            </div>

            {/* Right: Admin User & Role Switcher */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Switch to Muallim View */}
              <Link
                to="/teacher/dashboard"
                className="px-3 py-1.5 rounded-xl bg-[#C9A227] hover:bg-[#b59120] text-[#084C3A] font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                title="Switch to My Muallim Dashboard"
              >
                <GraduationCap className="w-4 h-4 text-[#084C3A]" />
                <span className="hidden sm:inline">My Muallim Dashboard</span>
                <span className="sm:hidden">Muallim View</span>
              </Link>

              <div className="hidden sm:flex items-center gap-2 pl-2">
                <Avatar name={user?.name || "Sadhr Muallim"} size="sm" ring />
                <div className="text-left">
                  <p className="text-xs font-bold text-white leading-tight">{user?.name || "Usthad Shihabudheen Saadi"}</p>
                  <p className="text-[10px] text-[#C9A227] font-semibold">Sadhr Mudarris</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login?role=SADHR_MUALLIM');
                }}
                className="p-2 rounded-xl text-white/80 hover:text-white bg-white/10 hover:bg-rose-600/80 border border-white/10 transition-colors flex items-center gap-1.5"
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

      {/* Main Admin Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Desktop Navigation Sidebar (>= 1024px) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 bg-white rounded-2xl p-3 border border-[#E3EAE6] shadow-sm space-y-1.5">
              <div className="p-3 bg-[#FAF8F2] rounded-xl mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">Madrasa Administration</p>
                <p className="text-sm font-extrabold text-[#084C3A] mt-0.5">Darunnajath Mundambra</p>
              </div>

              {adminNavItems.map(item => {
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

              {/* Dedicated Switcher to My Muallim View */}
              <div className="pt-3 mt-3 border-t border-[#E3EAE6]">
                <Link
                  to="/teacher/dashboard"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F2] hover:bg-[#DDEDE5] text-[#084C3A] font-bold text-xs border border-[#0F6B50]/20 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-[#0F6B50] text-white">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="leading-tight">My Muallim View</p>
                      <p className="text-[10px] text-[#667085] font-normal">Classroom Workspace</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#0F6B50] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Admin Content Area */}
          <main className="lg:col-span-9 safe-bottom-padding lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Admin PWA Mobile Bottom Navigation (< 1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#084C3A] text-white border-t border-[#0F6B50] px-2 py-1 safe-bottom-margin shadow-lg shadow-black/10">
        <div className="flex items-center justify-around">
          {bottomNavItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  "flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative",
                  isActive ? "text-[#C9A227] font-bold" : "text-[#DDEDE5]/70 hover:text-white"
                )}
              >
                <div>{item.icon}</div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#C9A227] mt-0.5" />
                )}
              </Link>
            );
          })}

          {/* More Action Button */}
          <button
            onClick={() => setIsMoreSheetOpen(true)}
            className={clsx(
              "flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative",
              isMoreActive ? "text-[#C9A227] font-bold" : "text-[#DDEDE5]/70 hover:text-white"
            )}
          >
            <div><MoreHorizontal className="w-5 h-5" /></div>
            <span className="text-[10px] tracking-tight mt-0.5">More</span>
            {isMoreActive && (
              <span className="w-1 h-1 rounded-full bg-[#C9A227] mt-0.5" />
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
          <div className="relative w-full bg-white rounded-t-3xl shadow-2xl p-5 z-10 animate-in slide-in-from-bottom duration-200 text-[#1F2933]">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-[#E3EAE6]">
              <h3 className="text-sm font-bold text-[#1F2933]">Administration Controls</h3>
              <button onClick={() => setIsMoreSheetOpen(false)} className="p-1 text-[#667085]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 space-y-2">
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
                Logout from Sadhr Muallim Portal
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast />
    </div>
  );
};
