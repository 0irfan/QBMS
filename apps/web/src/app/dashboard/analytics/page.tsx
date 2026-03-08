'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { analyticsApi } from '@/lib/api';
import { BarChart3, Loader2, FileText, Target } from 'lucide-react';

export default function AnalyticsPage() {
  const user = useAuthStore((s) => s.user);
  const [instructorData, setInstructorData] = useState<{ totalExams?: number; totalAttempts?: number; results?: unknown[] } | null>(null);
  const [studentData, setStudentData] = useState<{ attempts?: number; results?: unknown[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const promises: Promise<void>[] = [];
    if (user?.role === 'super_admin' || user?.role === 'instructor') {
      promises.push(analyticsApi.instructor().then(setInstructorData).catch(() => setInstructorData(null)));
    }
    if (user?.role === 'student' || user?.role === 'super_admin' || user?.role === 'instructor') {
      promises.push(analyticsApi.student().then(setStudentData).catch(() => setStudentData(null)));
    }
    Promise.all(promises).finally(() => setLoading(false));
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-heading flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-teal-600 dark:text-teal-400" />
          Analytics
        </h1>
        <p className="page-subheading">Overview of exams and attempts.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {(user?.role === 'super_admin' || user?.role === 'instructor') && instructorData && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Instructor / Admin</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">Total exams</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">{instructorData.totalExams ?? 0}</dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">Total attempts</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">{instructorData.totalAttempts ?? 0}</dd>
              </div>
              <div className="flex justify-between items-center py-2">
                <dt className="text-gray-500 dark:text-gray-400">Results (sample)</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">{instructorData.results?.length ?? 0}</dd>
              </div>
            </dl>
          </div>
        )}

        {studentData && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Your activity</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">Your attempts</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">{studentData.attempts ?? 0}</dd>
              </div>
              <div className="flex justify-between items-center py-2">
                <dt className="text-gray-500 dark:text-gray-400">Your results</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">{studentData.results?.length ?? 0}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
