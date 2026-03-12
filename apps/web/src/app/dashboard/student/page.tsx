'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { BookOpen, FileText, TrendingUp, Users } from 'lucide-react';

interface Class {
  classId: string;
  className: string;
  instructorId: string;
  subjectId: string;
  enrollmentCode: string;
}

interface ExamAttempt {
  attemptId: string;
  examId: string;
  startedAt: string;
  submittedAt: string | null;
  status: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'student') {
      router.push('/dashboard');
      return;
    }

    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      const [classesRes, attemptsRes] = await Promise.all([
        api<Class[]>('/api/classes'),
        api<ExamAttempt[]>('/api/attempts/my').catch(() => []),
      ]);

      setClasses(classesRes || []);
      setRecentAttempts((attemptsRes || []).slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'student') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
        <p className="text-blue-100">Here's your learning dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enrolled Classes</p>
              <p className="text-3xl font-bold text-gray-900">{classes.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Exam Attempts</p>
              <p className="text-3xl font-bold text-gray-900">{recentAttempts.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-3xl font-bold text-gray-900">—</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrolled Classes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              My Classes
            </h2>
          </div>
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You are not enrolled in any classes yet.</p>
              <button
                onClick={() => router.push('/dashboard/classes/join')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Join a Class
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {classes.map((cls) => (
                <li
                  key={cls.classId}
                  className="p-4 border rounded hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => router.push(`/dashboard/classes/${cls.classId}`)}
                >
                  <div className="font-medium text-gray-900">{cls.className}</div>
                  <div className="text-sm text-gray-600">
                    Code: {cls.enrollmentCode}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Exam Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Recent Exams
            </h2>
          </div>
          {recentAttempts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No exam attempts yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentAttempts.map((attempt) => (
                <li key={attempt.attemptId} className="p-4 border rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Exam Attempt</div>
                      <div className="text-sm text-gray-600">
                        {new Date(attempt.startedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      attempt.status === 'submitted' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {attempt.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => router.push('/dashboard/classes/join')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Join a Class
          </button>
          <button
            onClick={() => router.push('/dashboard/exams')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            View Available Exams
          </button>
          <button
            onClick={() => router.push('/dashboard/attempts')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            My Results
          </button>
        </div>
      </div>
    </div>
  );
}
