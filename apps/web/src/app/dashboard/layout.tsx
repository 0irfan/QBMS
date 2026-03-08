'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  HelpCircle,
  Users,
  FileText,
  FileStack,
  BarChart3,
  LogOut,
  Menu,
  X,
  Mail,
  Sparkles,
  User,
  Bell,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/lib/api';

const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, gradient: 'from-blue-500 to-indigo-500' },
  { href: '/dashboard/subjects', label: 'Subjects', icon: BookOpen, gradient: 'from-purple-500 to-pink-500' },
  { href: '/dashboard/topics', label: 'Topics', icon: FolderTree, gradient: 'from-emerald-500 to-teal-500' },
  { href: '/dashboard/questions', label: 'Questions', icon: HelpCircle, gradient: 'from-amber-500 to-orange-500' },
  { href: '/dashboard/classes', label: 'Classes', icon: Users, gradient: 'from-cyan-500 to-blue-500' },
  { href: '/dashboard/exams', label: 'Exams', icon: FileText, gradient: 'from-rose-500 to-pink-500' },
  { href: '/dashboard/paper', label: 'Paper', icon: FileStack, gradient: 'from-violet-500 to-purple-500' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, gradient: 'from-indigo-500 to-blue-500' },
  { href: '/dashboard/invite-instructor', label: 'Invite Instructor', icon: Mail, gradient: 'from-pink-500 to-rose-500', superAdminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, accessToken, setAuth, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token && !user) {
      router.push('/login');
      return;
    }
    if (!user && token) {
      authApi
        .me()
        .then((me) => setAuth(me, token))
        .catch(() => router.push('/login'));
    }
  }, [accessToken, user, router, setAuth]);

  async function handleLogout() {
    try {
      await authApi.logout();
    } finally {
      logout();
      router.push('/login');
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const isInstructor = user.role === 'instructor' || user.role === 'super_admin';

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:shrink-0 border-r border-gray-200/50 dark:border-gray-700/50 glass-strong">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-lg font-bold shadow-lg">
                Q
              </div>
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-900 dark:text-white">QBMS</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Question Bank System</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            if (item.href === '/dashboard/paper' && !isInstructor) return null;
            if ('superAdminOnly' in item && item.superAdminOnly && user.role !== 'super_admin') return null;
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg shadow-indigo-500/30'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/50'
                }`}
              >
                <div className={`${active ? '' : 'group-hover:scale-110 transition-transform'}`}>
                  <Icon className="h-5 w-5 shrink-0" />
                </div>
                <span className="flex-1">{item.label}</span>
                {active && (
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-rose-50 hover:text-rose-600 dark:text-gray-400 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 transition-all duration-200 group"
          >
            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile header + overlay sidebar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-gray-200/50 dark:border-gray-700/50 glass-strong backdrop-blur-xl sticky top-0 z-40">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-lg">
              Q
            </div>
            <span className="font-bold text-gray-900 dark:text-white">QBMS</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 transition-colors"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} aria-hidden />
            <aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] glass-strong border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col shadow-2xl animate-slide-in-down">
              <div className="p-6 flex items-center justify-between border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-lg">
                    Q
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">QBMS</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Question Bank</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSidebarOpen(false)} 
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {nav.map((item) => {
                  if (item.href === '/dashboard/paper' && !isInstructor) return null;
                  if ('superAdminOnly' in item && item.superAdminOnly && user.role !== 'super_admin') return null;
                  const Icon = item.icon;
                  const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-semibold shadow-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto animate-slide-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
