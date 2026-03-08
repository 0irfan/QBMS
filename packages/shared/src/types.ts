export type UserRole = 'super_admin' | 'instructor' | 'student';
export type UserStatus = 'active' | 'inactive';
export type QuestionType = 'mcq' | 'short' | 'essay';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ExamStatus = 'draft' | 'scheduled' | 'active' | 'completed';
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface Paginated<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface PaperGenerationParams {
  subjectId: string;
  topicIds: string[];
  totalMarks: number;
  questionCount: number;
  difficultyDistribution: DifficultyDistribution;
  excludeRecentlyUsed?: boolean;
}

export interface QuestionWithOptions {
  questionId: string;
  questionText: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  options?: { optionId: string; optionText: string; isCorrect: boolean }[];
}
