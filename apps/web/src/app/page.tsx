import Link from 'next/link';
import { BookOpen, LogIn, UserPlus } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/25 mb-6">
          <BookOpen className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight sm:text-5xl">
          QBMS
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-md text-center">
          Question Bank Management System — create, manage, and deliver assessments with ease.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="btn-primary inline-flex items-center gap-2 px-6 py-3"
          >
            <LogIn className="h-5 w-5" />
            Log in
          </Link>
          <Link
            href="/register"
            className="btn-secondary inline-flex items-center gap-2 px-6 py-3"
          >
            <UserPlus className="h-5 w-5" />
            Register
          </Link>
        </div>
      </div>
      <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        QBMS — Question Bank Management System
      </footer>
    </div>
  );
}
