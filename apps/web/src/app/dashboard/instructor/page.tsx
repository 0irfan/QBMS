'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { BookOpen, Users, FileText, TrendingUp, Plus, HelpCircle } from 'lucide-react';

interface Class {
  classId: string;
  className: string;
  subjectId: string;
  enrollmentCode: string;
}

interface ClassWithStats extends Class {
  enrollmentCount: number;
}

export default function InstructorDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalExams: 0,
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'instructor' && user.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }

    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      const classesRes = await api.get('/classes');
      const classesData = classesRes.data || [];

      // Fetch enrollment counts for each class
      const classesWithCounts = await Promise.all(
        classesData.map(async (cls: Class) => {
          try {
            const studentsRes = await api.get(`/classes/${cls.classId}/students`);
            return {
              ...cls,
              enrollmentCount: studentsRes.data?.length || 0,
            };
          } catch {
            return { ...cls, enrollmentCount: 0 };
          }
        })
      );

      setClasses(classesWithCounts);

      // Calculate stats
      const totalStudents = classesWithCounts.reduce(
        (sum, cls) => sum + cls.enrollmentCount,
        0
      );

      // Fetch exams count
      const examsRes = await api.get('/exams').catch(() => ({ data: [] }));
      const totalExams = examsRes.data?.length || 0;

      setStats({
        totalClasses: classesWithCounts.length,
        totalStudents,
        totalExams,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'instructor' && user.role !== 'super_admin')) {
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
        <p className="text-indigo-100">Manage your classes and track student progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalClasses}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Exams</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalExams}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Managed Classes */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            My Classes
          </h2>
          <button
            onClick={() => router.push('/dashboard/classes')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Class
          </button>
        </div>

        {classes.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">You haven't created any classes yet.</p>
            <button
              onClick={() => router.push('/dashboard/classes')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              Create Your First Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls.classId}
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-indigo-500 hover:shadow-lg cursor-pointer transition"
                onClick={() => router.push(`/dashboard/classes/${cls.classId}`)}
              >
                <h3 className="font-semibold text-lg mb-3 text-gray-900">{cls.className}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{cls.enrollmentCount} students</span>
                  </div>
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                    Code: {cls.enrollmentCode}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/classes/${cls.classId}/students`);
                    }}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition"
                  >
                    Students
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/subjects`);
                    }}
                    className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 transition"
                  >
                    Subjects
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/dashboard/questions')}
            className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition text-center"
          >
            <HelpCircle className="h-6 w-6 mx-auto mb-2" />
            Manage Questions
          </button>
          <button
            onClick={() => router.push('/dashboard/exams')}
            className="bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition text-center"
          >
            <FileText className="h-6 w-6 mx-auto mb-2" />
            Create Exam
          </button>
          <button
            onClick={() => router.push('/dashboard/analytics')}
            className="bg-orange-600 text-white px-6 py-4 rounded-lg hover:bg-orange-700 transition text-center"
          >
            <TrendingUp className="h-6 w-6 mx-auto mb-2" />
            View Analytics
          </button>
          <button
            onClick={() => router.push('/dashboard/paper')}
            className="bg-pink-600 text-white px-6 py-4 rounded-lg hover:bg-pink-700 transition text-center"
          >
            <FileText className="h-6 w-6 mx-auto mb-2" />
            Generate Paper
          </button>
        </div>
      </div>
    </div>
  );
}
