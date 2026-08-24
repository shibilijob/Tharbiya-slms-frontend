import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../common/Button';
import { Menu, X, Shield, ChevronRight, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PWAInstallModal } from '../common/PWAInstallModal';

import { Logo } from '../common/Logo';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, role, logout } = useAuth();
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isInstructionModalOpen,
    promptInstall,
    closeInstructionModal
  } = usePWAInstall();

  const navLinks = [
    { label: 'Home', href: '/#home' },
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'About', href: '/#about' },
    { label: 'Contact', href: '/#contact' }
  ];

  const getDashboardLink = () => {
    if (role === 'PARENT') return '/parent/dashboard';
    if (role === 'TEACHER') return '/teacher/dashboard';
    if (role === 'ADMIN') return '/admin/dashboard';
    return '/login';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E3EAE6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Identity */}
          <Link to="/" className="group">
            <Logo size="md" showText title="Tharbiyah" subtitle="Darunnajath Mundambra" greenCircle />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-[#1F2933] hover:text-[#0F6B50] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Auth CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link to={getDashboardLink()}>
                  <Button size="sm" variant="primary" rightIcon={<ChevronRight className="w-4 h-4" />}>
                    {role === 'PARENT' ? 'Parent Portal' : (role === 'TEACHER' ? 'Muallim Portal' : 'Sadhr Muallim Portal')}
                  </Button>
                </Link>
                <button
                  onClick={logout}
                  className="text-xs font-semibold text-[#667085] hover:text-rose-600 px-2 py-1 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login?role=PARENT">
                  <Button size="sm" variant="secondary">
                    Parent Login
                  </Button>
                </Link>
                <Link to="/login?role=TEACHER">
                  <Button size="sm" variant="primary">
                    Muallim Portal
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <Link to={getDashboardLink()}>
                <Button size="sm" variant="primary" className="py-1 px-3 text-xs">
                  Dashboard
                </Button>
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-[#1F2933] hover:bg-[#DDEDE5]/50 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E3EAE6] px-4 pt-2 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2 pt-2">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-[#1F2933] hover:bg-[#FAF8F2] hover:text-[#0F6B50]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-4 border-t border-[#E3EAE6] flex flex-col gap-2">
            {user ? (
              <Link to={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full" variant="primary">
                  Go to {role === 'TEACHER' ? 'Muallim' : (role === 'ADMIN' ? 'Sadhr Muallim' : 'Parent')} Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login?role=PARENT" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full" variant="primary">
                    Parent Login
                  </Button>
                </Link>
                <Link to="/login?role=TEACHER" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full" variant="secondary">
                    Muallim Portal (Usthad / Sadhr)
                  </Button>
                </Link>
              </>
            )}

            {!isInstalled && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full mt-1 font-bold text-[#0F6B50]"
                leftIcon={<Download className="w-4 h-4 text-[#0F6B50]" />}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  promptInstall();
                }}
              >
                Add Tharbiya to Home Screen
              </Button>
            )}
          </div>
        </div>
      )}

      {/* PWA Cross-Platform Install Instruction Modal */}
      <PWAInstallModal
        isOpen={isInstructionModalOpen}
        onClose={closeInstructionModal}
        isIOS={isIOS}
        isInstalled={isInstalled}
        isInstallable={isInstallable}
        onNativeInstallPrompt={() => promptInstall()}
      />
    </header>
  );
};
