'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { questionsApi, topicsApi, aiApi, questionExtractApi, type GeneratedQuestion, type ExtractedQuestion } from '@/lib/api';
import { Plus, Loader2, ChevronDown, ChevronUp, HelpCircle, Sparkles, Upload, FileText, Check, X, Edit2 } from 'lucide-react';

type Question = {
  questionId: string;
  topicId: string;
  questionText: string;
  type: string;
  difficulty: string;
  marks: number;
  createdAt?: string;
};

export default function QuestionsPage() {
  const user = useAuthStore((s) => s.user);
  const canEdit = user?.role === 'super_admin' || user?.role === 'instructor';
  const [list, setList] = useState<Question[]>([]);
  const [topics, setTopics] = useState<{ topicId: string; topicName: string; subjectId: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [topicId, setTopicId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [type, setType] = useState<'mcq' | 'short' | 'essay'>('mcq');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [marks, setMarks] = useState(2);
  const [options, setOptions] = useState<{ optionText: string; isCorrect: boolean }[]>([
    { optionText: '', isCorrect: false },
    { optionText: '', isCorrect: true },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [aiTopicId, setAiTopicId] = useState('');
  const [aiTopicName, setAiTopicName] = useState('');
  const [aiType, setAiType] = useState<'mcq' | 'short' | 'essay'>('mcq');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiCount, setAiCount] = useState(3);
  const [aiLoading, setAiLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSubjectId, setUploadSubjectId] = useState('');
  const [uploadTopicId, setUploadTopicId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedQuestion[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState<ExtractedQuestion | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    Promise.all([questionsApi.list({ limit: 50 }), topicsApi.list()])
      .then(([q, t]) => {
        setList(q.data);
        setTopics(t);
        if (t.length && !topicId) setTopicId(t[0].topicId);
        if (t.length && !aiTopicId) {
          setAiTopicId(t[0].topicId);
          setAiTopicName(t[0].topicName);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerateAi() {
    const name = aiTopicName.trim() || topics.find((t) => t.topicId === aiTopicId)?.topicName || 'General';
    setAiLoading(true);
    setError('');
    setGenerated([]);
    try {
      const res = await aiApi.generateQuestions({
        topicId: aiTopicId || undefined,
        topicName: name,
        count: aiCount,
        type: aiType,
        difficulty: aiDifficulty,
      });
      setGenerated(res.generated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAddGenerated(idx: number) {
    const q = generated[idx];
    const topic = aiTopicId || topicId;
    if (!topic || !q.questionText.trim()) return;
    setAddingId(idx);
    setError('');
    try {
      await questionsApi.create({
        topicId: topic,
        questionText: q.questionText.trim(),
        type: q.type,
        difficulty: q.difficulty,
        marks: q.marks,
        options: q.options?.length ? q.options : undefined,
      });
      const listRes = await questionsApi.list({ limit: 50 });
      setList(listRes.data);
      setGenerated((prev) => prev.filter((_, i) => i !== idx));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add question');
    } finally {
      setAddingId(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!topicId || !questionText.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const opts =
        type === 'mcq'
          ? options.filter((o) => o.optionText.trim()).map((o) => ({ ...o, optionText: o.optionText.trim() }))
          : undefined;
      if (type === 'mcq' && (!opts || opts.length < 2 || !opts.some((o) => o.isCorrect))) {
        setError('MCQ needs at least 2 options and one correct');
        setSubmitting(false);
        return;
      }
      await questionsApi.create({
        topicId,
        questionText: questionText.trim(),
        type,
        difficulty,
        marks,
        options: opts,
      });
      const q = await questionsApi.list({ limit: 50 });
      setList(q.data);
      setQuestionText('');
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  function addOption() {
    setOptions([...options, { optionText: '', isCorrect: false }]);
  }

  async function handleUpload() {
    if (!uploadFile || !uploadTopicId) {
      setError('Please select a file and topic');
      return;
    }
    setUploading(true);
    setError('');
    setExtracted([]);
    try {
      const res = await questionExtractApi.upload(uploadFile, uploadSubjectId, uploadTopicId);
      setExtracted(res.questions);
      setUploadFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleEditExtracted(idx: number) {
    setEditingIdx(idx);
    setEditQuestion({ ...extracted[idx] });
  }

  function handleSaveEdit() {
    if (editingIdx !== null && editQuestion) {
      setExtracted(extracted.map((q, i) => (i === editingIdx ? editQuestion : q)));
      setEditingIdx(null);
      setEditQuestion(null);
    }
  }

  function handleCancelEdit() {
    setEditingIdx(null);
    setEditQuestion(null);
  }

  function handleRemoveExtracted(idx: number) {
    setExtracted(extracted.filter((_, i) => i !== idx));
  }

  async function handleBulkImport() {
    if (extracted.length === 0 || !uploadTopicId) return;
    setImporting(true);
    setError('');
    try {
      const res = await questionExtractApi.bulkImport(extracted, uploadTopicId);
      const successCount = res.results.filter(r => r.success).length;
      setExtracted([]);
      setShowUpload(false);
      const listRes = await questionsApi.list({ limit: 50 });
      setList(listRes.data);
      alert(`Successfully imported ${successCount} of ${res.results.length} questions`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
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
            <HelpCircle className="h-7 w-7 text-teal-600 dark:text-teal-400" />
            Questions
          </h1>
          <p className="page-subheading">Bank of questions by topic</p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="btn-primary inline-flex items-center gap-2"
            >
              {showForm ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Cancel' : 'Add question'}
            </button>
            <button
              type="button"
              onClick={() => setShowAi(!showAi)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {showAi ? 'Hide AI' : 'Create with AI'}
            </button>
            <button
              type="button"
              onClick={() => setShowUpload(!showUpload)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {showUpload ? 'Hide Upload' : 'Upload Paper'}
            </button>
          </div>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Topic</label>
              <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="input-field" required>
                {topics.map((t) => (
                  <option key={t.topicId} value={t.topicId}>{t.topicName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as 'mcq' | 'short' | 'essay')} className="input-field">
                <option value="mcq">MCQ</option>
                <option value="short">Short</option>
                <option value="essay">Essay</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')} className="input-field">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Marks</label>
              <input type="number" min={1} value={marks} onChange={(e) => setMarks(Number(e.target.value))} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Question text</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="input-field min-h-[80px]"
              placeholder="Enter the question..."
              required
            />
          </div>
          {type === 'mcq' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Options (mark one correct)</label>
              {options.map((o, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="radio"
                    name="correct"
                    checked={o.isCorrect}
                    onChange={() => setOptions(options.map((opt, j) => ({ ...opt, isCorrect: j === i })))}
                    className="rounded-full border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <input
                    type="text"
                    value={o.optionText}
                    onChange={(e) => setOptions(options.map((opt, j) => (j === i ? { ...opt, optionText: e.target.value } : opt)))}
                    placeholder={`Option ${i + 1}`}
                    className="input-field flex-1"
                  />
                </div>
              ))}
              <button type="button" onClick={addOption} className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline">
                + Add option
              </button>
            </div>
          )}
          <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center gap-2">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create question
          </button>
        </form>
      )}

      {canEdit && showUpload && (
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Upload Question Paper (AI Extraction)
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Topic</label>
              <select
                value={uploadTopicId}
                onChange={(e) => {
                  const t = topics.find((x) => x.topicId === e.target.value);
                  setUploadTopicId(e.target.value);
                  if (t) setUploadSubjectId(t.subjectId);
                }}
                className="input-field"
              >
                <option value="">Select topic</option>
                {topics.map((t) => (
                  <option key={t.topicId} value={t.topicId}>{t.topicName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">File (PDF/Image)</label>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="input-field"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading || !uploadFile || !uploadTopicId}
                className="btn-primary inline-flex items-center gap-2 w-full sm:w-auto"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Extract Questions
              </button>
            </div>
          </div>
          
          {extracted.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Extracted {extracted.length} question{extracted.length !== 1 ? 's' : ''} — review and approve:
                </p>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={importing}
                  className="btn-primary text-sm inline-flex items-center gap-2"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Import All ({extracted.length})
                </button>
              </div>
              <ul className="space-y-3">
                {extracted.map((q, idx) => (
                  <li key={idx} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    {editingIdx === idx && editQuestion ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Question Text</label>
                          <textarea
                            value={editQuestion.questionText}
                            onChange={(e) => setEditQuestion({ ...editQuestion, questionText: e.target.value })}
                            className="input-field text-sm min-h-[60px]"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
                            <select
                              value={editQuestion.type}
                              onChange={(e) => setEditQuestion({ ...editQuestion, type: e.target.value as 'mcq' | 'short' | 'essay' })}
                              className="input-field text-sm"
                            >
                              <option value="mcq">MCQ</option>
                              <option value="short">Short</option>
                              <option value="essay">Essay</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Difficulty</label>
                            <select
                              value={editQuestion.difficulty}
                              onChange={(e) => setEditQuestion({ ...editQuestion, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                              className="input-field text-sm"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Marks</label>
                            <input
                              type="number"
                              min={1}
                              value={editQuestion.marks}
                              onChange={(e) => setEditQuestion({ ...editQuestion, marks: Number(e.target.value) })}
                              className="input-field text-sm"
                            />
                          </div>
                        </div>
                        {editQuestion.type === 'mcq' && editQuestion.options && (
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Options</label>
                            {editQuestion.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex gap-2 items-center">
                                <input
                                  type="radio"
                                  checked={opt.isCorrect}
                                  onChange={() => setEditQuestion({
                                    ...editQuestion,
                                    options: editQuestion.options?.map((o, i) => ({ ...o, isCorrect: i === optIdx }))
                                  })}
                                  className="rounded-full border-gray-300 text-teal-600 focus:ring-teal-500"
                                />
                                <input
                                  type="text"
                                  value={opt.optionText}
                                  onChange={(e) => setEditQuestion({
                                    ...editQuestion,
                                    options: editQuestion.options?.map((o, i) => i === optIdx ? { ...o, optionText: e.target.value } : o)
                                  })}
                                  className="input-field text-sm flex-1"
                                />
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setEditQuestion({
                                ...editQuestion,
                                options: [...(editQuestion.options || []), { optionText: '', isCorrect: false }]
                              })}
                              className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
                            >
                              + Add option
                            </button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="btn-primary text-sm py-1.5 px-3"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="btn-secondary text-sm py-1.5 px-3"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white flex-1">{q.questionText}</p>
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditExtracted(idx)}
                              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveExtracted(idx)}
                              className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700">{q.type}</span>
                          <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700">{q.difficulty}</span>
                          <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                          {q.options?.length && <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">{q.options.length} options</span>}
                        </div>
                        {q.type === 'mcq' && q.options && q.options.length > 0 && (
                          <div className="mt-3 space-y-1.5 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2 text-sm">
                                {opt.isCorrect ? (
                                  <Check className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                                ) : (
                                  <span className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 shrink-0" />
                                )}
                                <span className={opt.isCorrect ? 'text-green-700 dark:text-green-300 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                                  {opt.optionText}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {canEdit && showAi && (
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                Generate questions with OpenAI
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Topic</label>
                  <select
                    value={aiTopicId}
                    onChange={(e) => {
                      const t = topics.find((x) => x.topicId === e.target.value);
                      setAiTopicId(e.target.value);
                      if (t) setAiTopicName(t.topicName);
                    }}
                    className="input-field"
                  >
                    {topics.map((t) => (
                      <option key={t.topicId} value={t.topicId}>{t.topicName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                  <select value={aiType} onChange={(e) => setAiType(e.target.value as 'mcq' | 'short' | 'essay')} className="input-field">
                    <option value="mcq">MCQ</option>
                    <option value="short">Short</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Difficulty</label>
                  <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value as 'easy' | 'medium' | 'hard')} className="input-field">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Count</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleGenerateAi}
                    disabled={aiLoading}
                    className="btn-primary inline-flex items-center gap-2 w-full sm:w-auto"
                  >
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Generate
                  </button>
                </div>
              </div>
              {generated.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Generated — add to bank:</p>
                  <ul className="space-y-2">
                    {generated.map((q, idx) => (
                      <li key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{q.questionText}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {q.type} · {q.difficulty} · {q.marks} mark{q.marks !== 1 ? 's' : ''}
                            {q.options?.length ? ` · ${q.options.length} options` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddGenerated(idx)}
                          disabled={addingId === idx}
                          className="btn-primary text-sm py-1.5 px-3 shrink-0"
                        >
                          {addingId === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to bank'}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Question</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Difficulty</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Marks</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No questions yet
                  </td>
                </tr>
              ) : (
                list.map((q) => (
                  <tr key={q.questionId} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-4 text-gray-900 dark:text-white max-w-md truncate">{q.questionText}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{q.type}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{q.difficulty}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{q.marks}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
