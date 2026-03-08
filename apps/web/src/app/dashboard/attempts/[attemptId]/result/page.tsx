'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { attemptsApi, type AttemptResponse, type AttemptResult } from '@/lib/api';
import { ArrowLeft, Check, X, Award, Loader2 } from 'lucide-react';

export default function AttemptResultPage() {
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const [data, setData] = useState<Awaited<ReturnType<typeof attemptsApi.get>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!attemptId) return;
    attemptsApi
      .get(attemptId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-300">
          {error || 'Result not found'}
        </div>
        <Link href="/dashboard/exams" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to exams
        </Link>
      </div>
    );
  }

  const result = data.result as AttemptResult | null;
  const responses = (data.responses || []) as (AttemptResponse & { questionText?: string; options?: { optionId: string; optionText: string; isCorrect: boolean }[] })[];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        href="/dashboard/exams"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to exams
      </Link>

      <div className="flex flex-col items-center gap-2">
        <h1 className="page-heading">Exam result</h1>
        <p className="text-gray-500 dark:text-gray-400">Attempt submitted</p>
      </div>

      {result && (
        <div className="card p-8 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400">
            <Award className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">Score: {result.totalScore}</p>
            <p className="text-lg text-gray-600 dark:text-gray-400">{result.percentage}%</p>
            {result.grade && (
              <p className="mt-1 text-teal-600 dark:text-teal-400 font-medium">Grade: {result.grade}</p>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Question review</h2>
        <ul className="space-y-4">
          {responses.map((r, i) => (
            <li key={r.responseId} className="card p-4 space-y-2">
              <p className="font-medium text-gray-900 dark:text-white">
                {i + 1}. {r.questionText ?? 'Question'}
              </p>
              {r.options?.length ? (
                <ul className="space-y-1 text-sm">
                  {r.options.map((opt) => (
                    <li
                      key={opt.optionId}
                      className={`flex items-center gap-2 ${
                        r.selectedOptionId === opt.optionId
                          ? opt.isCorrect
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                          : opt.isCorrect
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {r.selectedOptionId === opt.optionId && (opt.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />)}
                      {opt.optionText}
                      {r.selectedOptionId === opt.optionId && <span className="text-xs">(your answer)</span>}
                      {opt.isCorrect && r.selectedOptionId !== opt.optionId && <span className="text-xs">(correct)</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your answer: {r.answerText || '—'}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {r.marksObtained != null ? `${r.marksObtained} / marks` : ''} {r.isCorrect === true && '✓ Correct'}
                {r.isCorrect === false && '✗ Incorrect'}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
