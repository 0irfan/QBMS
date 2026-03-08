'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { subjectsApi, topicsApi, paperApi } from '@/lib/api';
import { FileText, Loader2, Sparkles } from 'lucide-react';

type Subject = { subjectId: string; subjectName: string };
type Topic = { topicId: string; topicName: string; subjectId: string };

export default function PaperPage() {
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'super_admin' || user?.role === 'instructor';
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [totalMarks, setTotalMarks] = useState(20);
  const [questionCount, setQuestionCount] = useState(5);
  const [easy, setEasy] = useState(0.4);
  const [medium, setMedium] = useState(0.4);
  const [hard, setHard] = useState(0.2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ questions: Array<{ questionId: string; questionText: string; type: string; difficulty: string; marks: number }> } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    subjectsApi.list().then(setSubjects).catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      setSelectedTopicIds([]);
      return;
    }
    topicsApi.list(subjectId).then(setTopics).catch(() => setTopics([]));
  }, [subjectId]);

  function toggleTopic(id: string) {
    setSelectedTopicIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId || selectedTopicIds.length === 0) {
      setError('Select a subject and at least one topic.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await paperApi.generate({
        subjectId,
        topicIds: selectedTopicIds,
        totalMarks,
        questionCount,
        difficultyDistribution: { easy, medium, hard },
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  if (!canManage) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Paper generation is available to instructors and admins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-heading flex items-center gap-2">
          <FileText className="w-7 h-7 text-teal-600 dark:text-teal-400" />
          Generate paper
        </h1>
        <p className="page-subheading">Build a question paper from topics with difficulty mix.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={handleGenerate} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="input-field">
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Topics (multi-select)</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              {topics.length === 0 ? (
                <span className="text-sm text-gray-500 dark:text-gray-400">Select a subject first</span>
              ) : (
                topics.map((t) => (
                  <button
                    key={t.topicId}
                    type="button"
                    onClick={() => toggleTopic(t.topicId)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      selectedTopicIds.includes(t.topicId)
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t.topicName}
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Total marks</label>
              <input type="number" min={1} value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Question count</label>
              <input type="number" min={1} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Difficulty (easy / medium / hard)</label>
            <div className="flex gap-4 items-center">
              <input type="number" step="0.1" min={0} max={1} value={easy} onChange={(e) => setEasy(Number(e.target.value))} className="input-field w-20 text-center" />
              <input type="number" step="0.1" min={0} max={1} value={medium} onChange={(e) => setMedium(Number(e.target.value))} className="input-field w-20 text-center" />
              <input type="number" step="0.1" min={0} max={1} value={hard} onChange={(e) => setHard(Number(e.target.value))} className="input-field w-20 text-center" />
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Generate
          </button>
        </form>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Preview</h2>
          {!result ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Generated questions will appear here.</p>
          ) : (
            <ul className="space-y-3 max-h-[480px] overflow-y-auto">
              {result.questions?.map((q, i) => (
                <li key={q.questionId} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm border border-gray-100 dark:border-gray-700">
                  <span className="font-medium text-teal-600 dark:text-teal-400">Q{i + 1}</span> · {q.difficulty} · {q.marks} marks
                  <p className="mt-1 text-gray-800 dark:text-gray-200">{q.questionText}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
