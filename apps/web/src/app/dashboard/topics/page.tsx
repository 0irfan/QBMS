'use client';

import { useEffect, useState } from 'react';
import { subjectsApi, topicsApi } from '@/lib/api';
import { Plus, Layers, Trash2 } from 'lucide-react';

type Subject = { subjectId: string; subjectName: string };
type Topic = { topicId: string; subjectId: string; topicName: string };

export default function TopicsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [topicName, setTopicName] = useState('');

  async function loadSubjects() {
    const data = await subjectsApi.list();
    setSubjects(data);
    if (data.length && !subjectId) setSubjectId(data[0].subjectId);
  }

  async function loadTopics(sid?: string) {
    const id = sid ?? subjectId;
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await topicsApi.list(id);
      setTopics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (subjectId) loadTopics(subjectId);
  }, [subjectId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectId || !topicName.trim()) return;
    try {
      await topicsApi.create({ subjectId, topicName: topicName.trim() });
      setTopicName('');
      setShowAdd(false);
      loadTopics();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this topic?')) return;
    try {
      await topicsApi.delete(id);
      loadTopics();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  return (
    <div>
      <h1 className="page-heading flex items-center gap-2 mb-1">
        <Layers className="h-7 w-7 text-teal-600 dark:text-teal-400" />
        Topics
      </h1>
      <p className="page-subheading mb-6">Topics per subject.</p>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="input-field max-w-xs"
        >
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          disabled={!subjectId}
          className="btn-primary inline-flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add topic
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {showAdd && subjectId && (
        <form onSubmit={handleCreate} className="card mb-6 p-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Topic name</label>
          <input
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            className="input-field max-w-md"
            placeholder="e.g. Algebra"
            required
          />
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn-primary">Create</button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {!subjectId ? (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">Select a subject to view topics.</div>
      ) : loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      ) : topics.length === 0 ? (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">No topics for this subject yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Topic</th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {topics.map((t) => (
                  <tr key={t.topicId} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.topicName}</td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => handleDelete(t.topicId)} className="text-red-600 hover:text-red-700 dark:text-red-400 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
