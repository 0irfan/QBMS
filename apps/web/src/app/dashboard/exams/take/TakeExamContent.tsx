'use client';

import Link from 'next/link';
import { ArrowLeft, Loader2, Clock, Send } from 'lucide-react';
import type { ExamQuestionWithDetails } from '@/lib/api';

type Answers = Record<string, { answerText?: string; selectedOptionId?: string }>;

type Props = {
  exam: { title: string; timeLimit: number; questions: ExamQuestionWithDetails[] };
  attempt: { startedAt: string };
  answers: Answers;
  currentIndex: number;
  setCurrentIndex: (i: number | ((prev: number) => number)) => void;
  timeLeft: number | null;
  expired: boolean;
  error: string;
  submitting: boolean;
  onAnswerChange: (questionId: string, value: { answerText?: string; selectedOptionId?: string }) => void;
  onSubmitExam: () => void;
};

export default function TakeExamContent({
  exam,
  attempt,
  answers,
  currentIndex,
  setCurrentIndex,
  timeLeft,
  expired,
  error,
  submitting,
  onAnswerChange,
  onSubmitExam,
}: Props) {
  const questions = Array.isArray(exam.questions) ? exam.questions : [];
  const current = questions[currentIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/exams"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to exams
        </Link>
        <div className="flex items-center gap-4">
          {timeLeft !== null && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                timeLeft <= 300 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
              }`}
            >
              <Clock className="h-4 w-4" />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </span>
          )}
          <button
            type="button"
            onClick={onSubmitExam}
            disabled={submitting || expired}
            className="btn-primary inline-flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit exam
          </button>
        </div>
      </div>

      <h1 className="page-heading">{exam.title}</h1>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {expired && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          Time is up. Please submit your exam.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={q.questionId}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
              i === currentIndex
                ? 'bg-teal-600 text-white'
                : answers[q.questionId]?.answerText || answers[q.questionId]?.selectedOptionId
                  ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {current && (
        <div className="card p-6 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Question {currentIndex + 1} of {questions.length} · {current.marks} mark{current.marks !== 1 ? 's' : ''}
          </p>
          <p className="text-gray-900 dark:text-white font-medium">{current.questionText}</p>

          {current.type === 'mcq' && current.options?.length ? (
            <ul className="space-y-2">
              {current.options.map((opt) => (
                <li key={opt.optionId}>
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                    <input
                      type="radio"
                      name={`q-${current.questionId}`}
                      checked={answers[current.questionId]?.selectedOptionId === opt.optionId}
                      onChange={() => onAnswerChange(current.questionId, { selectedOptionId: opt.optionId })}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-gray-800 dark:text-gray-200">{opt.optionText}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : null}

          {(current.type === 'short' || current.type === 'essay') && (
            <textarea
              value={answers[current.questionId]?.answerText ?? ''}
              onChange={(e) => onAnswerChange(current.questionId, { answerText: e.target.value })}
              placeholder="Your answer..."
              rows={current.type === 'essay' ? 6 : 3}
              className="input-field w-full"
            />
          )}
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="btn-secondary"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
          disabled={currentIndex === questions.length - 1}
          className="btn-primary"
        >
          Next
        </button>
      </div>
    </div>
  );
}
