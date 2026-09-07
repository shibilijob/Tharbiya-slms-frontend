import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import type { UserRole } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Logo } from '../../components/common/Logo';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  GraduationCap,
  Phone,
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  AlertCircle
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Modal State (Muallim Portal Only)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'IDENTIFY' | 'RESET' | 'SUCCESS'>('IDENTIFY');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [verifiedMuallim, setVerifiedMuallim] = useState<{
    name: string;
    email: string;
    phone: string;
    designation?: string;
    role: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

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
    setSuccessMsg(null);
  }, [selectedPortal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError('Please enter your phone number or email.');
      return;
    }
    setError(null);
    setSuccessMsg(null);
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
      await loginWithGoogle(selectedPortal);
      // OAuth redirect will take over the browser window
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
      setIsLoading(false);
    }
  };

  // Muallim Forgot Password Handlers (Email Only & Brevo)
  const handleOpenForgotPassword = () => {
    // If current identifier is a valid email, prepopulate; otherwise start blank
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setResetIdentifier(emailRegex.test(identifier.trim()) ? identifier.trim() : '');
    setForgotStep('IDENTIFY');
    setForgotError(null);
    setVerifiedMuallim(null);
    setNewPassword('');
    setConfirmPassword('');
    setIsForgotModalOpen(true);
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resetIdentifier.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      setForgotError('Please enter your registered Usthad email address.');
      return;
    }

    if (!emailRegex.test(cleanEmail)) {
      setForgotError('Please enter a valid email address (e.g. usthad@darunnajath.edu). Phone numbers cannot be used for password recovery.');
      return;
    }

    setForgotError(null);
    setForgotLoading(true);

    try {
      await authService.sendMuallimResetEmail(cleanEmail);
      setForgotStep('SUCCESS');
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to send password reset email. Please verify your email address.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyMuallim = async () => {
    const cleanEmail = resetIdentifier.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cleanEmail) {
      setForgotError('Please enter your registered Usthad email address.');
      return;
    }

    if (!emailRegex.test(cleanEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotError(null);
    setForgotLoading(true);

    try {
      const facultyData = await authService.verifyMuallim(cleanEmail);
      setVerifiedMuallim(facultyData);
      setForgotStep('RESET');
    } catch (err: any) {
      setForgotError(err?.message || 'No active Muallim account found for this email address.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resetIdentifier.trim().toLowerCase();

    if (!newPassword || newPassword.length < 5) {
      setForgotError('New password must be at least 5 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please ensure both fields match.');
      return;
    }
    setForgotError(null);
    setForgotLoading(true);

    try {
      await authService.resetMuallimPassword(cleanEmail, newPassword.trim(), confirmPassword.trim());
      setForgotStep('SUCCESS');
    } catch (err: any) {
      setForgotError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleFinishReset = () => {
    setIsForgotModalOpen(false);
    setIdentifier(resetIdentifier);
    setPassword(newPassword);
    setSuccessMsg('Password updated successfully! You can now sign in with your new password.');
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
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedPortal === 'PARENT'
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
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedPortal === 'MUALLIM'
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
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{successMsg}</span>
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs sm:text-sm font-semibold text-[#1F2933]">
                  Password / PIN
                </label>
                {/* FORGOT PASSWORD: ONLY VISIBLE IN MUALLIM PORTAL */}
                {selectedPortal === 'MUALLIM' && (
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="text-xs font-bold text-[#0F6B50] hover:text-[#084C3A] hover:underline focus:outline-none transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

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

      {/* ========================================================================= */}
      {/* MUALLIM FORGOT PASSWORD MODAL (MUALLIM PORTAL ONLY)                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title={
          forgotStep === 'SUCCESS'
            ? 'Password Reset Complete'
            : forgotStep === 'RESET'
            ? 'Set New Password'
            : 'Muallim Password Recovery'
        }
        subtitle={
          forgotStep === 'SUCCESS'
            ? 'Your faculty credentials have been updated.'
            : forgotStep === 'RESET'
            ? 'Enter and confirm your new secure password.'
            : 'Verify your Usthad account to recover your access.'
        }
        maxWidth="md"
      >
        <div className="space-y-4">
          {forgotError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{forgotError}</span>
            </div>
          )}

          {/* STEP 1: IDENTIFY MUALLIM & EMAIL DISPATCH */}
          {forgotStep === 'IDENTIFY' && (
            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#DDEDE5]/50 border border-[#bbdcd0]/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0F6B50] text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#084C3A]">Faculty Email Verification</p>
                  <p className="text-[11px] text-[#0F6B50]">
                    A secure password reset link will be sent to your registered Usthad email.
                  </p>
                </div>
              </div>

              <Input
                label="Registered Usthad Email Address"
                type="email"
                placeholder="e.g. shibili@yopmail.com"
                value={resetIdentifier}
                onChange={(e) => setResetIdentifier(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
                autoFocus
              />

              <div className="p-2.5 rounded-xl bg-[#FAF8F2] border border-[#E3EAE6] text-[11px] text-[#667085]">
                <p>
                  <strong className="text-[#1F2933]">Parent Notice:</strong> Parents log in using their mobile number. For password assistance, parents should directly contact <span className="font-semibold text-[#0F6B50]">Sadhr Muallim</span>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={forgotLoading}
                  className="w-full sm:w-auto"
                  rightIcon={<Mail className="w-4 h-4" />}
                >
                  Send Reset Link
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: SET NEW PASSWORD */}
          {forgotStep === 'RESET' && verifiedMuallim && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Verified Identity Card */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#E3EAE6] shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0F6B50] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {verifiedMuallim.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-[#1F2933] truncate">
                      {verifiedMuallim.name}
                    </p>
                    <span className="text-[10px] font-bold text-[#0F6B50] bg-[#DDEDE5] px-2 py-0.5 rounded-md shrink-0">
                      {verifiedMuallim.role === 'SADHR_MUALLIM' ? 'Sadhr Muallim' : 'Muallim'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#667085] truncate">
                    {verifiedMuallim.designation || 'Usthad & Class Mentor'}
                  </p>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2933] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter at least 5 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#1F2933]"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2933] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    leftIcon={<KeyRound className="w-4 h-4" />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#1F2933]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {newPassword && confirmPassword && (
                <div className="text-[11px] flex items-center gap-1.5">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setForgotStep('IDENTIFY')}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={forgotLoading}
                  rightIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Update Password
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS */}
          {forgotStep === 'SUCCESS' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#0F6B50] flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-base font-extrabold text-[#1F2933]">
                  {newPassword ? 'Password Updated Successfully!' : 'Password Reset Link Sent!'}
                </h4>
                <p className="text-xs text-[#667085] mt-1.5 max-w-sm mx-auto">
                  {newPassword
                    ? 'Your credentials have been securely updated. You can now sign in immediately.'
                    : `We have sent an email containing a secure password reset link to ${resetIdentifier}. Please check your inbox (or spam folder) and click the link to set your new password.`}
                </p>
              </div>

              <div className="pt-2">
                {newPassword ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleFinishReset}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Proceed to Login
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => setIsForgotModalOpen(false)}
                    rightIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Done
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;
