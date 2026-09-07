import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Logo } from '../../components/common/Logo';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 5) {
      setError('Password must be at least 5 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await authService.resetPasswordWithToken({
        token: token || undefined,
        email: email || undefined,
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The link may have expired.');
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
          Set New Usthad Password
        </h2>
        <p className="text-xs sm:text-sm text-[#667085] mt-1 font-malayalam">
          പുതിയ പാസ്‌വേഡ് നൽകി ലോഗിൻ ചെയ്യുക
        </p>
      </div>

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6 sm:p-8 bg-white shadow-xl border-[#E3EAE6]">
          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#0F6B50] flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-[#1F2933]">
                  Password Reset Complete!
                </h3>
                <p className="text-xs text-[#667085] mt-1 max-w-xs mx-auto">
                  Your Usthad account password has been updated securely. You can now log into your Muallim Workspace.
                </p>
              </div>

              <div className="pt-3">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/login?role=MUALLIM')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Proceed to Muallim Login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Security Shield Banner */}
              <div className="p-3 rounded-xl bg-[#DDEDE5]/50 border border-[#bbdcd0]/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0F6B50] text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#084C3A]">Secure Password Reset</p>
                  <p className="text-[11px] text-[#0F6B50]">
                    Enter your new password below to update your faculty credentials.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {!token && (
                <Input
                  label="Usthad Registered Email"
                  type="email"
                  placeholder="e.g. shibili@yopmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              )}

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-[#1F2933] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="At least 5 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4" />}
                    required
                    autoFocus
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
                    placeholder="Re-enter new password"
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

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                  rightIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Save New Password
                </Button>
              </div>

              <div className="text-center pt-2">
                <Link
                  to="/login?role=MUALLIM"
                  className="text-xs font-bold text-[#0F6B50] hover:text-[#084C3A] hover:underline"
                >
                  Back to Muallim Login
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
