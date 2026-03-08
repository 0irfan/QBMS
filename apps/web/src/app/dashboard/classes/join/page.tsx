'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { classesApi } from '@/lib/api';
import { Users, LogIn } from 'lucide-react';

function JoinClassForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';
  const user = useAuthStore((s) => s.user);
  const [code, setCode] = useState(codeFromUrl);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (codeFromUrl) setCode(codeFromUrl);
  }, [codeFromUrl]);

  if (!user) return null;
  if (user.role !== 'student' && user.role !== 'super_admin') {
    router.replace('/dashboard/classes');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    setError('');
    setLoading(true);
    setSuccess(false);
    try {
      await classesApi.enroll(trimmed);
      setSuccess(true);
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or already used code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Link href="/dashboard/classes" className="text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400">
          ← Classes
        </Link>
      </div>
      <h1 className="page-heading flex items-center gap-2 mt-2">
        <LogIn className="h-7 w-7 text-teal-600 dark:text-teal-400" />
        Join a class
      </h1>
      <p className="page-subheading mb-6">
        Enter the enrollment code your instructor gave you.
      </p>

      <div className="card p-6 max-w-md">
        {success && (
          <div className="mb-4 rounded-xl bg-teal-50 dark:bg-teal-900/20 px-4 py-3 text-sm text-teal-700 dark:text-teal-300">
            You joined the class successfully. <Link href="/dashboard/classes" className="font-medium underline">View your classes</Link>.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Enrollment code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="input-field mb-4 font-mono"
            placeholder="e.g. MATH101-2024"
          />
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
            <Users className="h-4 w-4" />
            {loading ? 'Joining…' : 'Join class'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function JoinClassPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <JoinClassForm />
    </Suspense>
  );
}
