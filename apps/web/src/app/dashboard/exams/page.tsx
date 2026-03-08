'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { examsApi, classesApi, questionsApi, attemptsApi, type Exam, type ExamAttempt } from '@/lib/api';
import { Plus, Loader2, FileText, Play, Eye, Send, Ban } from 'lucide-react';
import Link from 'next/link';

type ExamRow = Exam;

export default function ExamsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'super_admin' || user?.role === 'instructor';
  const isStudent = user?.role === 'student';
  const [list, setList] = useState<ExamRow[]>([]);
  const [attemptsByExam, setAttemptsByExam] = useState<Record<string, ExamAttempt[]>>({});
  const [classes, setClasses] = useState<{ classId: string; className: string }[]>([]);
  const [questions, setQuestions] = useState<{ questionId: string; questionText: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [classId, setClassId] = useState('');
  const [title, setTitle] = useState('');
  const [totalMarks, setTotalMarks] = useState(10);
  const [timeLimit, setTimeLimit] = useState(30);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [exams, cls, q] = await Promise.all([
        examsApi.list(),
        canEdit ? classesApi.list() : Promise.resolve([]),
        canEdit ? questionsApi.list({ limit: 100 }) : Promise.resolve({ data: [] }),
      ]);
      setList(exams);
      setClasses(cls);
      setQuestions(q.data);
      if (cls.length && !classId) setClassId(cls[0].classId);
      if (isStudent) {
        const allAttempts = await attemptsApi.list();
        const byExam: Record<string, ExamAttempt[]> = {};
        for (const a of allAttempts) {
          if (!byExam[a.examId]) byExam[a.examId] = [];
          byExam[a.examId].push(a);
        }
        setAttemptsByExam(byExam);
      }
    };
    load().catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [canEdit, isStudent]);

  function toggleQuestion(id: string) {
    setSelectedQuestionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!classId || !title.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const created = await examsApi.create({
        classId,
        title: title.trim(),
        totalMarks,
        timeLimit,
        questionIds: selectedQuestionIds.length ? selectedQuestionIds : undefined,
      });
      setList((prev) => [created, ...prev]);
      setTitle('');
      setSelectedQuestionIds([]);
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStartExam(examId: string) {
    setStartingId(examId);
    setError('');
    try {
      const attempt = await attemptsApi.start(examId);
      router.push(`/dashboard/exams/take/${attempt.attemptId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start exam');
    } finally {
      setStartingId(null);
    }
  }

  async function handlePublish(examId: string, status: 'active' | 'draft') {
    setPublishingId(examId);
    setError('');
    try {
      const updated = await examsApi.update(examId, { status });
      setList((prev) => prev.map((e) => (e.examId === examId ? updated : e)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setPublishingId(null);
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
            <FileText className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            Exams
          </h1>
          <p className="page-subheading">Create and manage exams</p>
        </div>
        {canEdit && (
          <button type="button" onClick={() => setShowForm(!showForm)} className="btn-primary inline-flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            New exam
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {showForm && canEdit && (
        <form onSubmit={handleCreate} className="card p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className="input-field" required>
                {classes.map((c) => (
                  <option key={c.classId} value={c.classId}>{c.className}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="Midterm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Total marks</label>
              <input type="number" min={1} value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Time limit (min)</label>
              <input type="number" min={1} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Questions (optional)</label>
            <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 p-2 space-y-1 bg-gray-50 dark:bg-gray-900/50">
              {questions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No questions in bank</p>
              ) : (
                questions.slice(0, 30).map((q) => (
                  <label key={q.questionId} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedQuestionIds.includes(q.questionId)}
                      onChange={() => toggleQuestion(q.questionId)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm truncate text-gray-700 dark:text-gray-300">{q.questionText}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create exam
          </button>
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Title</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Marks</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Time (min)</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                {(isStudent || canEdit) && <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Action</th>}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    {isStudent ? 'No exams available' : 'No exams yet'}
                  </td>
                </tr>
              ) : (
                list
                  .filter((ex) => !isStudent || ex.status === 'active')
                  .map((ex) => {
                    const attempts = attemptsByExam[ex.examId] ?? [];
                    const inProgress = attempts.find((a) => a.status === 'in_progress');
                    const submitted = attempts.find((a) => a.status === 'submitted');
                    return (
                      <tr key={ex.examId} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{ex.title}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ex.totalMarks}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{ex.timeLimit}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                            {ex.status}
                          </span>
                        </td>
                        {isStudent && (
                          <td className="py-3 px-4">
                            {inProgress ? (
                              <Link
                                href={`/dashboard/exams/take/${inProgress.attemptId}`}
                                className="btn-secondary inline-flex items-center gap-1.5 text-sm py-1.5 px-3"
                              >
                                <Play className="w-3.5 h-3.5" />
                                Continue
                              </Link>
                            ) : submitted ? (
                              <Link
                                href={`/dashboard/attempts/${submitted.attemptId}/result`}
                                className="btn-secondary inline-flex items-center gap-1.5 text-sm py-1.5 px-3"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View result
                              </Link>
                            ) : (
                              <button
                                type="button"
                                disabled={startingId === ex.examId}
                                onClick={() => handleStartExam(ex.examId)}
                                className="btn-primary inline-flex items-center gap-1.5 text-sm py-1.5 px-3"
                              >
                                {startingId === ex.examId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                Start
                              </button>
                            )}
                          </td>
                        )}
                        {canEdit && !isStudent && (
                          <td className="py-3 px-4 flex flex-wrap gap-2">
                            {ex.status !== 'active' && (
                              <button
                                type="button"
                                disabled={publishingId === ex.examId}
                                onClick={() => handlePublish(ex.examId, 'active')}
                                className="btn-primary inline-flex items-center gap-1.5 text-sm py-1.5 px-3"
                              >
                                {publishingId === ex.examId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                Publish
                              </button>
                            )}
                            {ex.status === 'active' && (
                              <button
                                type="button"
                                disabled={publishingId === ex.examId}
                                onClick={() => handlePublish(ex.examId, 'draft')}
                                className="btn-secondary inline-flex items-center gap-1.5 text-sm py-1.5 px-3"
                              >
                                {publishingId === ex.examId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                                Unpublish
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
