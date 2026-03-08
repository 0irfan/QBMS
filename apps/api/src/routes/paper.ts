import { Router } from 'express';
import { db } from '../lib/db.js';
import { questions, questionOptions, topics } from '@qbms/database';
import { eq, inArray } from 'drizzle-orm';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';

export const paperRouter = Router();
paperRouter.use(authMiddleware);
paperRouter.use(requireRoles('super_admin', 'instructor'));

interface DifficultyDist {
  easy: number;
  medium: number;
  hard: number;
}

interface QuestionRow {
  questionId: string;
  topicId: string;
  questionText: string;
  type: string;
  difficulty: string;
  marks: number;
  createdBy: string | null;
  version: number;
  createdAt: Date;
}

paperRouter.post('/generate', async (req: AuthRequest, res) => {
  const body = req.body as {
    subjectId: string;
    topicIds: string[];
    totalMarks: number;
    questionCount: number;
    difficultyDistribution: DifficultyDist;
    excludeRecentlyUsed?: boolean;
  };
  const { subjectId, topicIds, totalMarks, questionCount, difficultyDistribution } = body;
  if (!subjectId || !topicIds?.length || totalMarks == null || questionCount == null) {
    return res.status(400).json({ error: 'subjectId, topicIds, totalMarks, questionCount required' });
  }
  const dist = difficultyDistribution || { easy: 0.33, medium: 0.34, hard: 0.33 };
  const total = dist.easy + dist.medium + dist.hard;
  const easyCount = Math.round((dist.easy / total) * questionCount);
  const mediumCount = Math.round((dist.medium / total) * questionCount);
  const hardCount = questionCount - easyCount - mediumCount;

  const pool = await db
    .select()
    .from(questions)
    .where(inArray(questions.topicId, topicIds)) as QuestionRow[];
  const easy = pool.filter((q: QuestionRow) => q.difficulty === 'easy');
  const medium = pool.filter((q: QuestionRow) => q.difficulty === 'medium');
  const hard = pool.filter((q: QuestionRow) => q.difficulty === 'hard');

  function pickRandom<T>(arr: T[], n: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, shuffled.length));
  }
  const selected = [
    ...pickRandom(easy, easyCount),
    ...pickRandom(medium, mediumCount),
    ...pickRandom(hard, hardCount),
  ].sort(() => Math.random() - 0.5);

  const withOptions = await Promise.all(
    selected.map(async (q: QuestionRow) => {
      const opts = await db
        .select({ optionId: questionOptions.optionId, optionText: questionOptions.optionText })
        .from(questionOptions)
        .where(eq(questionOptions.questionId, q.questionId));
      return { ...q, options: opts };
    })
  );
  res.json({
    questions: withOptions,
    totalMarks: withOptions.reduce((s: number, q: { marks: number }) => s + q.marks, 0),
    totalCount: withOptions.length,
  });
});
