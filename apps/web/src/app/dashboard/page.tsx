'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { analyticsApi } from '@/lib/api';
import { 
  BookOpen, 
  Layers, 
  HelpCircle, 
  Users, 
  FileText, 
  Sparkles, 
  BarChart3,
  TrendingUp,
  Award,
  Clock,
  ArrowRight
} from 'lucide-react';

const cards = [
  { 
    href: '/dashboard/subjects', 
    label: 'Subjects', 
    icon: BookOpen, 
    desc: 'Manage subjects',
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
  },
  { 
    href: '/dashboard/topics', 
    label: 'Topics', 
    icon: Layers, 
    desc: 'Topics per subject',
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20'
  },
  { 
    href: '/dashboard/questions', 
    label: 'Questions', 
    icon: HelpCircle, 
    desc: 'Question bank',
    gradient: 'from-amber-500 to-orange-500',
    bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20'
  },
  { 
    href: '/dashboard/classes', 
    label: 'Classes', 
    icon: Users, 
    desc: 'Classes & enrollments',
    gradient: 'from-cyan-500 to-blue-500',
    bgGradient: 'from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20'
  },
  { 
    href: '/dashboard/exams', 
    label: 'Exams', 
    icon: FileText, 
    desc: 'Create & manage exams',
    gradient: 'from-rose-500 to-pink-500',
    bgGradient: 'from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20'
  },
  { 
    href: '/dashboard/paper', 
    label: 'Paper', 
    icon: Sparkles, 
    desc: 'Generate question papers',
    gradient: 'from-violet-500 to-purple-500',
    bgGradient: 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20'
  },
  { 
    href: '/dashboard/analytics', 
    label: 'Analytics', 
    icon: BarChart3, 
    desc: 'Stats & insights',
    gradient: 'from-indigo-500 to-blue-500',
    bgGradient: 'from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20'
  },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<{ totalSubjects: number; totalQuestions: number; totalExams: number; totalClasses: number } | null>(null);
  
  const isInstructor = user?.role === 'instructor' || user?.role === 'super_admin';

  useEffect(() => {
    if (isInstructor) {
      analyticsApi.dashboardStats()
        .then(setStats)
        .catch(() => setStats({ totalSubjects: 0, totalQuestions: 0, totalExams: 0, totalClasses: 0 }));
    }
  }, [isInstructor]);

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Welcome back, {user.name}!
              </h1>
              <p className="text-indigo-100 mt-1">
                You're logged in as <span className="font-semibold text-white capitalize">{user.role.replace('_', ' ')}</span>
              </p>
            </div>
          </div>
          <p className="text-white/90 text-lg max-w-2xl">
            {isInstructor 
              ? "Manage your question bank, create exams, and track student performance all in one place."
              : "Access your classes, take exams, and view your results."}
          </p>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      {/* Quick Stats (for instructors) */}
      {isInstructor && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="stat-card-icon from-purple-500 to-pink-500">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Subjects</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats ? stats.totalSubjects : '—'}
            </p>
          </div>

          <div className="stat-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="stat-card-icon from-emerald-500 to-teal-500">
                <HelpCircle className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Questions</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats ? stats.totalQuestions : '—'}
            </p>
          </div>

          <div className="stat-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="stat-card-icon from-cyan-500 to-blue-500">
                <Users className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Classes</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats ? stats.totalClasses : '—'}
            </p>
          </div>

          <div className="stat-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="stat-card-icon from-rose-500 to-pink-500">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Exams</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats ? stats.totalExams : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="section-heading flex items-center gap-2 mb-6">
          <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          Quick Actions
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ href, label, icon: Icon, desc, gradient, bgGradient }) => {
            if (!isInstructor && (href === '/dashboard/paper' || href === '/dashboard/analytics')) return null;
            return (
              <Link
                key={href}
                href={href}
                className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-transparent"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {desc}
                  </p>
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity (placeholder) */}
      {isInstructor && (
        <div>
          <h2 className="section-heading flex items-center gap-2 mb-6">
            <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Recent Activity
          </h2>
          <div className="card p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">No recent activity</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Your recent actions will appear here</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
