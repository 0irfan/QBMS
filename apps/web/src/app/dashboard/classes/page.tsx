'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { classesApi, subjectsApi, invitesApi } from '@/lib/api';
import { Plus, Loader2, Copy, Check, Users, Mail, LogIn } from 'lucide-react';

type ClassRow = {
  classId: string;
  className: string;
  subjectId: string;
  instructorId: string;
  enrollmentCode: string;
};

export default function ClassesPage() {
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'super_admin' || user?.role === 'instructor';
  const isStudent = user?.role === 'student';
  const [list, setList] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<{ subjectId: string; subjectName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [className, setClassName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inviteClassId, setInviteClassId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteDone, setInviteDone] = useState(false);

  useEffect(() => {
    Promise.all([classesApi.list(), subjectsApi.list()])
      .then(([c, s]) => {
        setList(c);
        setSubjects(s);
        if (s.length && !subjectId) setSubjectId(s[0].subjectId);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId || !className.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const created = await classesApi.create({ subjectId, className: className.trim() });
      setList((prev) => [created, ...prev]);
      setClassName('');
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  function copyCode(code: string, classId: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(classId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleInviteStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteClassId || !inviteEmail.trim()) return;
    setInviteSending(true);
    setError('');
    try {
      await invitesApi.inviteStudent(inviteEmail.trim(), inviteClassId);
      setInviteDone(true);
      setInviteEmail('');
      setTimeout(() => { setInviteClassId(null); setInviteDone(false); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setInviteSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-heading flex items-center gap-2">
            <Users className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            Classes
          </h1>
          <p className="page-subheading">Manage classes and enrollment codes</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {isStudent && (
            <Link href="/dashboard/classes/join" className="btn-primary inline-flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Join class
            </Link>
          )}
          {canEdit && (
            <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New class
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {showForm && canEdit && (
        <form onSubmit={handleCreate} className="card p-6 space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input-field" required>
              {subjects.map((s) => (
                <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class name</label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="input-field"
              placeholder="e.g. Math 101"
              required
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create class
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Class</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Enrollment code</th>
                {canEdit && <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 w-24">Invite</th>}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 3 : 2} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No classes yet
                  </td>
                </tr>
              ) : (
                list.map((c) => (
                  <tr key={c.classId} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{c.className}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => copyCode(c.enrollmentCode, c.classId)}
                        className="inline-flex items-center gap-2 font-mono text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                      >
                        {c.enrollmentCode}
                        {copiedId === c.classId ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setInviteClassId(c.classId)}
                          className="inline-flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 hover:underline"
                        >
                          <Mail className="w-4 h-4" />
                          Invite
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {inviteClassId && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setInviteClassId(null)}>
          <div className="card p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Invite student by email</h3>
            {inviteDone && (
              <p className="mb-3 text-sm text-teal-600 dark:text-teal-400">Invitation sent.</p>
            )}
            <form onSubmit={handleInviteStudent}>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="input-field mb-3"
                placeholder="student@example.com"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={inviteSending} className="btn-primary">
                  {inviteSending ? 'Sending…' : 'Send invite'}
                </button>
                <button type="button" onClick={() => setInviteClassId(null)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
