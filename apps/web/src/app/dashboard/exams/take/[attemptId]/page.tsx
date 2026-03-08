'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { examsApi, attemptsApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import TakeExamContent from '../TakeExamContent';

type Answers = Record<string, { answerText?: string; selectedOptionId?: string }>;

export default function TakeExamPage() {
  const router = useRouter();
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const [exam, setExam] = useState<Awaited<ReturnType<typeof examsApi.getWithQuestions>> | null>(null);
  const [attempt, setAttempt] = useState<Awaited<ReturnType<typeof attemptsApi.get>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState<Answers>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    (async () => {
      try {
        const attemptData = await attemptsApi.get(attemptId);
        const examData = await examsApi.getWithQuestions(attemptData.examId);
        setAttempt(attemptData);
        setExam(examData);
        if (attemptData.status !== 'in_progress') {
          router.replace(`/dashboard/attempts/${attemptId}/result`);
          return;
        }
        const initial: Answers = {};
        for (const r of attemptData.responses) {
          initial[r.questionId] = {
            answerText: r.answerText ?? undefined,
            selectedOptionId: r.selectedOptionId ?? undefined,
          };
        }
        setAnswers(initial);
        const endMs = new Date(attemptData.startedAt).getTime() + examData.timeLimit * 60 * 1000;
        const tick = () => setTimeLeft(Math.max(0, Math.floor((endMs - Date.now()) / 1000)));
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId, router]);

  const saveResponse = useCallback(
    (questionId: string, data: { answerText?: string; selectedOptionId?: string }) => {
      attemptsApi.submitResponse(attemptId, { questionId, ...data }).catch(() => {});
    },
    [attemptId]
  );

  const handleAnswerChange = (questionId: string, value: { answerText?: string; selectedOptionId?: string }) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...value } }));
    saveResponse(questionId, value);
  };

  const handleSubmitExam = async () => {
    if (!confirm('Submit exam? You cannot change answers after submitting.')) return;
    setSubmitting(true);
    setError('');
    try {
      await attemptsApi.submit(attemptId);
      router.push(`/dashboard/attempts/${attemptId}/result`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !exam || !attempt) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const endMs = new Date(attempt.startedAt).getTime() + exam.timeLimit * 60 * 1000;
  const expired = Date.now() >= endMs;

  return (
    <TakeExamContent
      exam={exam}
      attempt={attempt}
      answers={answers}
      currentIndex={currentIndex}
      setCurrentIndex={setCurrentIndex}
      timeLeft={timeLeft}
      expired={expired}
      error={error}
      submitting={submitting}
      onAnswerChange={handleAnswerChange}
      onSubmitExam={handleSubmitExam}
    />
  );
}
