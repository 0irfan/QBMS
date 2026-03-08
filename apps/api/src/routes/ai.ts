import { Router } from 'express';
import { getOpenAIClient, isOpenAIAvailable } from '../lib/openai.js';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';

export const aiRouter = Router();
aiRouter.use(authMiddleware);
aiRouter.use(requireRoles('super_admin', 'instructor'));

/** POST /api/ai/generate-questions - Generate questions via OpenAI (not saved to DB) */
aiRouter.post('/generate-questions', async (req: AuthRequest, res) => {
  if (!isOpenAIAvailable()) {
    return res.status(503).json({
      error: 'AI question generation is not configured. Set OPENAI_API_KEY.',
    });
  }

  const body = req.body as {
    topicId?: string;
    topicName?: string;
    count?: number;
    type?: 'mcq' | 'short' | 'essay';
    difficulty?: 'easy' | 'medium' | 'hard';
  };

  const topicName = typeof body.topicName === 'string' ? body.topicName.trim() : 'General';
  const count = Math.min(10, Math.max(1, Number(body.count) || 3));
  const type = body.type === 'short' || body.type === 'essay' ? body.type : 'mcq';
  const difficulty = body.difficulty === 'easy' || body.difficulty === 'hard' ? body.difficulty : 'medium';

  const openai = getOpenAIClient()!;

  const prompt = `You are a question writer for an educational quiz system. Generate exactly ${count} ${type.toUpperCase()} question(s) for the topic "${topicName}". Difficulty: ${difficulty}.

Rules:
- Each question must be clear and self-contained.
- For MCQ: provide exactly 4 options, exactly one is correct. Use "options" array with objects { "optionText": "...", "isCorrect": true/false }.
- For short/essay: no options. "options" should be [] or omit.
- Assign marks: easy=1-2, medium=2-3, hard=3-5.
- Output valid JSON only, no markdown or explanation.

Respond with a JSON object: { "questions": [ ... ] }. Each element of "questions" must have:
- "questionText": string
- "type": "mcq" | "short" | "essay"
- "difficulty": "easy" | "medium" | "hard"
- "marks": number (integer 1-5)
- "options": array of { "optionText": string, "isCorrect": boolean } (only for mcq, length 4)`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    let parsed: { questions?: Array<{
      questionText?: string;
      type?: string;
      difficulty?: string;
      marks?: number;
      options?: Array<{ optionText?: string; isCorrect?: boolean }>;
    }> };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'Invalid JSON from AI', raw: raw.slice(0, 200) });
    }

    const list = Array.isArray(parsed.questions) ? parsed.questions : Array.isArray(parsed) ? parsed : [];
    const questions = list.slice(0, count).map((q) => {
      const questionText = typeof q.questionText === 'string' ? q.questionText.trim() : '';
      const qType = q.type === 'short' || q.type === 'essay' ? q.type : 'mcq';
      const diff = q.difficulty === 'easy' || q.difficulty === 'hard' ? q.difficulty : 'medium';
      const marks = Math.min(5, Math.max(1, Number(q.marks) || 2));
      let options: { optionText: string; isCorrect: boolean }[] = [];
      if (qType === 'mcq' && Array.isArray(q.options)) {
        options = q.options
          .filter((o: { optionText?: string }) => o && typeof o.optionText === 'string' && o.optionText.trim())
          .slice(0, 4)
          .map((o: { optionText?: string; isCorrect?: boolean }) => ({ optionText: String(o.optionText).trim(), isCorrect: Boolean(o.isCorrect) }));
        if (options.length < 2) options = [];
        if (!options.some((o) => o.isCorrect) && options.length) options[0] = { ...options[0], isCorrect: true };
      }
      return {
        questionText: questionText || 'Generated question',
        type: qType,
        difficulty: diff,
        marks,
        options,
      };
    });

    res.json({
      topicId: body.topicId ?? null,
      topicName,
      generated: questions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OpenAI request failed';
    const code = (err as { status?: number })?.status === 401 ? 502 : 502;
    res.status(code).json({ error: message });
  }
});
