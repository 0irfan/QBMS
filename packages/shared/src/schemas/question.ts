import { z } from 'zod';

export const questionTypeEnum = z.enum(['mcq', 'short', 'essay']);
export const difficultyEnum = z.enum(['easy', 'medium', 'hard']);

export const createQuestionSchema = z.object({
  topicId: z.string().uuid(),
  questionText: z.string().min(1),
  type: questionTypeEnum,
  difficulty: difficultyEnum,
  marks: z.number().int().min(1),
  options: z
    .array(
      z.object({
        optionText: z.string().min(1),
        isCorrect: z.boolean(),
      })
    )
    .optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial().extend({
  questionId: z.string().uuid(),
});

export const questionSearchSchema = z.object({
  subjectId: z.string().uuid().optional(),
  topicId: z.string().uuid().optional(),
  type: questionTypeEnum.optional(),
  difficulty: difficultyEnum.optional(),
  createdBy: z.string().uuid().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  minMarks: z.coerce.number().int().optional(),
  maxMarks: z.coerce.number().int().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type QuestionSearchInput = z.infer<typeof questionSearchSchema>;
