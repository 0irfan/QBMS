'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { BookOpen, UserPlus, Eye, EyeOff } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite') || undefined;
  const enrollmentCode = searchParams.get('code') || undefined;
  const prefilledEmail = searchParams.get('email') || '';
  const [name, setName] = useState('');
  const [email, setEmail] = useState(prefilledEmail);
  const [enrollmentNumber, setEnrollmentNumber] = useState(enrollmentCode || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteValidating, setInviteValidating] = useState(!!inviteToken);
  const [inviteValid, setInviteValid] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    if (!inviteToken) return;
    authApi
      .validateInvite(inviteToken)
      .then((data) => {
        setEmail(data.email);
        setRole(data.role as 'instructor');
        setInviteValid(true);
      })
      .catch(() => setError('Invalid or expired invite link.'))
      .finally(() => setInviteValidating(false));
  }, [inviteToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: { name: string; email: string; password: string; role: string; inviteToken?: string; enrollmentNumber?: string } = {
        name,
        email,
        password,
        role,
      };
      if (inviteToken) payload.inviteToken = inviteToken;
      if (enrollmentNumber) payload.enrollmentNumber = enrollmentNumber;
      await authApi.register(payload);
      setStep('otp');
      setOtp('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) return;
    setError('');
    setVerifyLoading(true);
    try {
      const payload = {
        email: email.trim(),
        otp: otp.trim(),
        name,
        password,
        role,
        ...(inviteToken && { inviteToken }),
        ...(enrollmentNumber && { enrollmentNumber }),
      };
      await authApi.registerVerifyOtp(payload);
      
      // If there's an enrollment number, redirect to join class page
      if (enrollmentNumber) {
        router.push(`/login?registered=1&redirect=/dashboard/classes/join?code=${encodeURIComponent(enrollmentNumber)}`);
      } else {
        router.push('/login?registered=1');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired OTP');
    } finally {
      setVerifyLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 mb-8"
          >
            <BookOpen className="h-5 w-5" />
            <span className="font-semibold">QBMS</span>
          </Link>
          <div className="card p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 mb-6">
              <UserPlus className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {step === 'otp' ? 'Verify your email' : 'Create account'}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {step === 'otp'
                ? `We sent a 6-digit code to ${email}. Enter it below to complete registration.`
                : inviteValid
                  ? 'You were invited as an instructor. Complete your registration below.'
                  : enrollmentCode
                    ? 'Create your account to join the class. Enter your enrollment number.'
                    : 'Create your account to get started with QBMS.'}
            </p>
            {inviteValidating && (
              <p className="mt-2 text-sm text-teal-600 dark:text-teal-400">Validating invite…</p>
            )}

            {step === 'otp' ? (
              <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
                {error && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="input-field text-center text-lg tracking-[0.5em]"
                    maxLength={6}
                    required
                  />
                </div>
                <button type="submit" disabled={verifyLoading} className="btn-primary w-full py-3">
                  {verifyLoading ? 'Verifying…' : 'Verify and create account'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('form'); setError(''); setOtp(''); }}
                  className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
                >
                  ← Use a different email
                </button>
              </form>
            ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input-field"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
              {role === 'student' && !inviteToken && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Enrollment Number
                  </label>
                  <input
                    type="text"
                    value={enrollmentNumber}
                    onChange={(e) => setEnrollmentNumber(e.target.value)}
                    className="input-field"
                    placeholder="Enter your enrollment number"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter your enrollment number to join a class after registration.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="input-field pr-10"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {!inviteToken && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'student' | 'instructor')}
                    className="input-field"
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </div>
              )}
              {inviteToken && inviteValid && (
                <p className="text-sm text-teal-600 dark:text-teal-400">Registering as instructor (from invite).</p>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>
            )}
            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-teal-600 dark:text-teal-400 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
