'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/lib/api';
import { BookOpen, LogIn, Eye, EyeOff, Sparkles, ArrowRight, Shield } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      setRegistered(true);
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      setAuth(data.user, data.accessToken);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md animate-slide-in-up">
          {/* Logo */}
          <Link
            href="/"
            className="inline-flex items-center gap-3 mb-8 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-lg font-bold shadow-lg">
                Q
              </div>
            </div>
            <div>
              <span className="font-bold text-xl text-gray-900 dark:text-white">QBMS</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">Question Bank System</p>
            </div>
          </Link>

          {/* Form Card */}
          <div className="card p-8 lg:p-10">
            <div className="mb-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white mb-4 shadow-lg shadow-indigo-500/30">
                <LogIn className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Enter your credentials to access your account
              </p>
            </div>

            {registered && (
              <div className="alert-success mb-6 animate-slide-in-down">
                <Shield className="h-5 w-5 inline mr-2" />
                Account created successfully! Please log in.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="alert-error animate-slide-in-down">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-field pr-12"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
                <Link 
                  href="/forgot-password" 
                  className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="btn-primary w-full py-3.5 text-base group"
              >
                {loading ? (
                  <>
                    <div className="spinner h-5 w-5" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            © 2024 QBMS. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <div className="max-w-lg text-center space-y-8 animate-fade-in">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl" />
                <Sparkles className="relative h-24 w-24" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                Manage Your Question Bank with Ease
              </h2>
              <p className="text-xl text-indigo-100">
                Create, organize, and deploy exams efficiently with our comprehensive question bank management system.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">500+</div>
                <div className="text-sm text-indigo-200">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">50+</div>
                <div className="text-sm text-indigo-200">Exams</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">100+</div>
                <div className="text-sm text-indigo-200">Students</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner h-12 w-12" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
