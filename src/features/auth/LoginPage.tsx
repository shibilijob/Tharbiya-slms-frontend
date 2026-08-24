import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Logo } from '../../components/common/Logo';
import {
  Users,
  GraduationCap,
  Phone,
  Lock,
  Mail,
  ArrowRight
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const roleParam = searchParams.get('role');
  const initialPortal: 'PARENT' | 'MUALLIM' =
    roleParam === 'SADHR_MUALLIM' || roleParam === 'MUALLIM' || roleParam === 'ADMIN' || roleParam === 'TEACHER' ? 'MUALLIM' : 'PARENT';

  const [selectedPortal, setSelectedPortal] = useState<'PARENT' | 'MUALLIM'>(initialPortal);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const param = searchParams.get('role');
    if (param === 'SADHR_MUALLIM' || param === 'MUALLIM' || param === 'ADMIN' || param === 'TEACHER') {
      setSelectedPortal('MUALLIM');
    } else if (param === 'PARENT') {
      setSelectedPortal('PARENT');
    }
  }, [searchParams]);

  // Clear inputs when portal changes
  useEffect(() => {
    setIdentifier('');
    setPassword('');
    setError(null);
  }, [selectedPortal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError('Please enter your phone number or email.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const loggedUser = await login(selectedPortal, identifier, password);
      if (loggedUser.role === 'SADHR_MUALLIM') {
        navigate('/admin/dashboard');
      } else if (loggedUser.role === 'MUALLIM') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/parent/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const loggedUser = await loginWithGoogle(selectedPortal);
      if (loggedUser.role === 'SADHR_MUALLIM') {
        navigate('/admin/dashboard');
      } else if (loggedUser.role === 'MUALLIM') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/parent/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F2] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-islamic-pattern">
      {/* Top Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center group">
          <Logo size="lg" showText title="Tharbiyah" subtitle="Darunnajath Mundambra" />
        </Link>
        <h2 className="mt-4 text-xl sm:text-2xl font-extrabold text-[#1F2933]">
          Portal Login
        </h2>
        <p className="text-xs sm:text-sm text-[#667085] mt-1 font-malayalam">
          കുട്ടിയുടെ പഠനവും വളർച്ചയും നിരീക്ഷിക്കാം
        </p>
      </div>

      {/* Main Login Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6 sm:p-8 bg-white shadow-xl border-[#E3EAE6]">
          {/* 2 Portal Tabs */}
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-[#667085] mb-2 text-center">
              Select Portal
            </p>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#FAF8F2] rounded-2xl border border-[#E3EAE6]">
              <button
                type="button"
                onClick={() => setSelectedPortal('PARENT')}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${selectedPortal === 'PARENT'
                    ? 'bg-[#0F6B50] text-white shadow-sm'
                    : 'text-[#667085] hover:text-[#1F2933]'
                  }`}
              >
                <Users className="w-4 h-4" />
                <span>Parent Portal</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPortal('MUALLIM')}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${selectedPortal === 'MUALLIM'
                    ? 'bg-[#0F6B50] text-white shadow-sm'
                    : 'text-[#667085] hover:text-[#1F2933]'
                  }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Muallim Portal</span>
              </button>
            </div>
          </div>

          {/* Role Header Description */}
          <div className="mb-5 p-3 rounded-xl bg-[#DDEDE5]/40 border border-[#bbdcd0]/50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0F6B50] text-white flex items-center justify-center shrink-0">
              {selectedPortal === 'PARENT' ? (
                <Users className="w-4 h-4" />
              ) : (
                <GraduationCap className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-[#084C3A]">
                {selectedPortal === 'PARENT'
                  ? 'Parent Login (Mobile + Password)'
                  : 'Muallim & Sadhr Muallim Portal'}
              </p>
              <p className="text-[11px] text-[#0F6B50]">
                {selectedPortal === 'PARENT'
                  ? 'Monitor your child’s Quran, attendance & studies'
                  : 'Record daily attendance, Quran progress, practical scores & administrative duties'}
              </p>
            </div>
          </div>

          {/* Google Auth for Muallim Portal */}
          {selectedPortal === 'MUALLIM' && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 sm:py-3 px-4 rounded-xl border border-[#E3EAE6] bg-white hover:bg-[#FAF8F2] hover:border-[#0F6B50] text-[#1F2933] font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all duration-150 group"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google (Muallim Workspace)</span>
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="w-full border-t border-[#E3EAE6]" />
                <span className="absolute bg-white px-3 text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
                  or sign in with password
                </span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                {error}
              </div>
            )}

            <Input
              label={selectedPortal === 'PARENT' ? 'Mobile Number' : 'Email Address or Mobile'}
              type={selectedPortal === 'PARENT' ? 'tel' : 'text'}
              placeholder={selectedPortal === 'PARENT' ? 'e.g. 9847123456' : 'e.g. shibili@yopmail.com'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              leftIcon={selectedPortal === 'PARENT' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password / PIN"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="pt-2 text-center">
              <Button
                type="submit"
                className="w-full"
                size="lg"
                variant="primary"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to {selectedPortal === 'PARENT' ? 'Parent Portal' : 'Muallim Portal'}
              </Button>

              <p className="mt-3 text-xs text-[#667085]">
                {selectedPortal === 'MUALLIM' ? (
                  <>
                    Are you a Parent?{' '}
                    <button
                      type="button"
                      onClick={() => setSelectedPortal('PARENT')}
                      className="font-bold text-[#0F6B50] hover:text-[#084C3A] hover:underline focus:outline-none transition-colors"
                    >
                      Login
                    </button>
                  </>
                ) : (
                  <>
                    Are you a Muallim?{' '}
                    <button
                      type="button"
                      onClick={() => setSelectedPortal('MUALLIM')}
                      className="font-bold text-[#0F6B50] hover:text-[#084C3A] hover:underline focus:outline-none transition-colors"
                    >
                      Login
                    </button>
                  </>
                )}
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
