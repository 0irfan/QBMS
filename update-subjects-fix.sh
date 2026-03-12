#!/bin/bash

# Quick fix script for subjects page
echo "Updating subjects page to include class selector..."

# Update the subjects page
cat > apps/web/src/app/dashboard/subjects/page.tsx << 'EOF'
'use client';

import { useEffect, useState } from 'react';
import { subjectsApi, classesApi, type ClassItem } from '@/lib/api';
import { Plus, BookOpen, Trash2 } from 'lucide-react';

type Subject = { subjectId: string; subjectName: string; description: string | null; classId: string };

export default function SubjectsPage() {
  const [list, setList] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  async function loadClasses() {
    try {
      const data = await classesApi.list();
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].classId);
      }
    } catch (e) {
      console.error('Failed to load classes:', e);
    }
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await subjectsApi.list();
      setList(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses();
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !selectedClassId) return;
    try {
      await subjectsApi.create({ 
        classId: selectedClassId,
        subjectName: name.trim(), 
        description: description.trim() || undefined 
      });
      setName('');
      setDescription('');
      setShowAdd(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this subject? Topics and questions may be affected.')) return;
    try {
      await subjectsApi.delete(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  // Get class name by ID
  const getClassName = (classId: string) => {
    const cls = classes.find(c => c.classId === classId);
    return cls?.className || 'Unknown Class';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="page-heading flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-teal-600 dark:text-teal-400" />
          Subjects
        </h1>
        <button type="button" onClick={() => setShowAdd(true)} className="btn-primary inline-flex items-center gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add subject
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {showAdd && (
        <form onSubmit={handleCreate} className="card mb-6 p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.classId} value={cls.classId}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="e.g. Mathematics"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="btn-primary">Create</button>
            <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      ) : list.length === 0 ? (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
          No subjects yet. Add one above.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Class</th>
                  <th className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Description</th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.subjectId} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.subjectName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{getClassName(s.classId)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.description || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(s.subjectId)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete"
                      >
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
EOF

# Update the API file - find and replace the subjects section
sed -i '/\/\/ --- Subjects ---/,/\/\/ --- Topics ---/{
  s/export type Subject = { subjectId: string; subjectName: string; description: string | null };/export type Subject = { subjectId: string; subjectName: string; description: string | null; classId: string };/
  s/create: (data: { subjectName: string; description\?: string })/create: (data: { classId: string; subjectName: string; description?: string })/
}' apps/web/src/lib/api.ts

echo "Files updated successfully!"
echo "Now run: git add . && git commit -m 'Fix subjects page' && git push origin main"
EOF

chmod +x update-subjects-fix.sh
echo "Created update script. Run this on the server in the ~/QBMS directory."