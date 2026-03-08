'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { invitesApi } from '@/lib/api';
import { Mail, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InviteInstructorPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user) return null;
  if (user.role !== 'super_admin') {
    router.replace('/dashboard');
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSent(false);
    try {
      await invitesApi.inviteInstructor(email.trim());
      setSent(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-heading flex items-center gap-2">
        <Mail className="h-7 w-7 text-teal-600 dark:text-teal-400" />
        Invite instructor
      </h1>
      <p className="page-subheading mb-6">
        Send an invitation email. The recipient will get a link to register as an instructor.
      </p>

      <div className="card p-6 max-w-md">
        {sent && (
          <div className="mb-4 rounded-xl bg-teal-50 dark:bg-teal-900/20 px-4 py-3 text-sm text-teal-700 dark:text-teal-300">
            Invitation sent. They will receive an email with a registration link.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Instructor email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field mb-4"
            placeholder="instructor@example.com"
          />
          <button type="submit" disabled={loading} className="btn-primary inline-flex items-center gap-2">
            <Send className="h-4 w-4" />
            {loading ? 'Sending…' : 'Send invite'}
          </button>
        </form>
      </div>
    </div>
  );
}
