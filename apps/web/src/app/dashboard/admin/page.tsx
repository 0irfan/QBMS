'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Users, BookOpen, FileText, Activity, Shield, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalExams: 0,
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!['super_admin', 'admin'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, classesRes, subjectsRes, examsRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/classes').catch(() => ({ data: [] })),
        api.get('/subjects').catch(() => ({ data: [] })),
        api.get('/exams').catch(() => ({ data: [] })),
      ]);

      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalClasses: classesRes.data?.length || 0,
        totalSubjects: subjectsRes.data?.length || 0,
        totalExams: examsRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !['super_admin', 'admin'].includes(user.role)) {
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
      <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-lg p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-10 w-10" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-red-100">System-wide overview and management</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalClasses}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Subjects</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSubjects}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Exams</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalExams}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity Logs */}
        <div
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg cursor-pointer transition"
          onClick={() => router.push('/dashboard/admin/activity-logs')}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-100 p-3 rounded-full">
              <Activity className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold">Activity Logs</h2>
          </div>
          <p className="text-gray-600 mb-4">
            View and monitor all system activities, user actions, and security events.
          </p>
          <button className="text-indigo-600 hover:text-indigo-700 font-medium">
            View Logs →
          </button>
        </div>

        {/* User Management */}
        <div
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg cursor-pointer transition"
          onClick={() => router.push('/dashboard/users')}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold">User Management</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Manage users, roles, permissions, and account settings.
          </p>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Manage Users →
          </button>
        </div>

        {/* System Settings */}
        <div
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg cursor-pointer transition"
          onClick={() => router.push('/dashboard/classes')}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">Classes & Subjects</h2>
          </div>
          <p className="text-gray-600 mb-4">
            View and manage all classes, subjects, and enrollments.
          </p>
          <button className="text-green-600 hover:text-green-700 font-medium">
            View All →
          </button>
        </div>

        {/* Exams & Questions */}
        <div
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg cursor-pointer transition"
          onClick={() => router.push('/dashboard/exams')}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold">Exams & Questions</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Manage exams, question banks, and assessment settings.
          </p>
          <button className="text-purple-600 hover:text-purple-700 font-medium">
            Manage Exams →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-6 w-6 text-gray-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/dashboard/invite-instructor')}
            className="bg-indigo-600 text-white px-6 py-4 rounded-lg hover:bg-indigo-700 transition"
          >
            Invite Instructor
          </button>
          <button
            onClick={() => router.push('/dashboard/analytics')}
            className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition"
          >
            View Analytics
          </button>
          <button
            onClick={() => router.push('/dashboard/admin/activity-logs')}
            className="bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition"
          >
            Activity Logs
          </button>
        </div>
      </div>
    </div>
  );
}
