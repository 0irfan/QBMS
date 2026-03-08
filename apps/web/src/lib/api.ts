const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const authApi = {
  login: (email: string, password: string) =>
    api<{ accessToken: string; user: { userId: string; name: string; email: string; role: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { name: string; email: string; password: string; role?: string; inviteToken?: string }) =>
    api<{ message: string; email: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  registerVerifyOtp: (data: {
    email: string;
    otp: string;
    name: string;
    password: string;
    role: string;
    inviteToken?: string;
  }) =>
    api<{ message: string }>('/api/auth/register/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  validateInvite: (token: string) =>
    api<{ email: string; role: string }>(`/api/invites/validate/${encodeURIComponent(token)}`),
  me: () => api<{ userId: string; name: string; email: string; role: string }>('/api/auth/me'),
  refresh: () => api<{ accessToken: string }>('/api/auth/refresh', { method: 'POST' }),
  logout: () => api<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  forgotPassword: (email: string) =>
    api<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) =>
    api<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};

// --- Invites ---
export const invitesApi = {
  inviteInstructor: (email: string) =>
    api<{ message: string }>('/api/invites/instructor', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  inviteStudent: (email: string, classId: string) =>
    api<{ message: string }>('/api/invites/student', {
      method: 'POST',
      body: JSON.stringify({ email, classId }),
    }),
};

// --- Subjects ---
export type Subject = { subjectId: string; subjectName: string; description: string | null };
export const subjectsApi = {
  list: () => api<Subject[]>('/api/subjects'),
  get: (id: string) => api<Subject>(`/api/subjects/${id}`),
  create: (data: { subjectName: string; description?: string }) =>
    api<Subject>('/api/subjects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { subjectName?: string; description?: string }) =>
    api<Subject>(`/api/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api<void>(`/api/subjects/${id}`, { method: 'DELETE' }),
};

// --- Topics ---
export type Topic = { topicId: string; subjectId: string; topicName: string };
export const topicsApi = {
  list: (subjectId?: string) =>
    api<Topic[]>(subjectId ? `/api/topics?subjectId=${subjectId}` : '/api/topics'),
  get: (id: string) => api<Topic>(`/api/topics/${id}`),
  create: (data: { subjectId: string; topicName: string }) =>
    api<Topic>('/api/topics', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { topicName?: string }) =>
    api<Topic>(`/api/topics/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api<void>(`/api/topics/${id}`, { method: 'DELETE' }),
};

// --- Questions ---
export type QuestionOption = { optionId?: string; optionText: string; isCorrect: boolean };
export type Question = {
  questionId: string;
  topicId: string;
  questionText: string;
  type: 'mcq' | 'short' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  createdBy: string | null;
  version: number;
  createdAt: string;
  options?: QuestionOption[];
};
export const questionsApi = {
  list: (params?: { topicId?: string; limit?: number; cursor?: string }) => {
    const q = new URLSearchParams();
    if (params?.topicId) q.set('topicId', params.topicId);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.cursor) q.set('cursor', params.cursor);
    const s = q.toString();
    return api<{ data: Question[]; nextCursor: string | null; hasMore: boolean }>(
      `/api/questions${s ? `?${s}` : ''}`
    );
  },
  get: (id: string) => api<Question & { options: QuestionOption[] }>(`/api/questions/${id}`),
  create: (data: {
    topicId: string;
    questionText: string;
    type: 'mcq' | 'short' | 'essay';
    difficulty: 'easy' | 'medium' | 'hard';
    marks: number;
    options?: { optionText: string; isCorrect: boolean }[];
  }) => api<Question>('/api/questions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: {
    questionText?: string;
    type?: 'mcq' | 'short' | 'essay';
    difficulty?: 'easy' | 'medium' | 'hard';
    marks?: number;
    options?: { optionText: string; isCorrect: boolean }[];
  }) => api<Question>(`/api/questions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api<void>(`/api/questions/${id}`, { method: 'DELETE' }),
};

// --- Classes ---
export type ClassItem = {
  classId: string;
  instructorId: string;
  subjectId: string;
  className: string;
  enrollmentCode: string;
  createdAt: string;
};
export type EnrolledStudent = {
  enrollmentId: string;
  studentId: string;
  enrolledAt: string;
  name: string;
  email: string;
};
export const classesApi = {
  list: () => api<ClassItem[]>('/api/classes'),
  get: (id: string) => api<ClassItem>(`/api/classes/${id}`),
  getStudents: (id: string) => api<EnrolledStudent[]>(`/api/classes/${id}/students`),
  create: (data: { subjectId: string; className: string; enrollmentCode?: string }) =>
    api<ClassItem>('/api/classes', { method: 'POST', body: JSON.stringify(data) }),
  enroll: (enrollmentCode: string) =>
    api<{ classId: string; className: string }>('/api/classes/enroll', {
      method: 'POST',
      body: JSON.stringify({ enrollmentCode }),
    }),
};

// --- Exams ---
export type Exam = {
  examId: string;
  classId: string;
  title: string;
  totalMarks: number;
  timeLimit: number;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  scheduledAt: string | null;
  createdAt: string;
};
export type ExamQuestionWithDetails = {
  examQuestionId: string;
  questionId: string;
  questionOrder: number;
  questionText: string;
  type: 'mcq' | 'short' | 'essay';
  marks: number;
  options: { optionId: string; optionText: string; isCorrect: boolean }[];
};
export const examsApi = {
  list: (classId?: string) =>
    api<Exam[]>(classId ? `/api/exams?classId=${classId}` : '/api/exams'),
  get: (id: string) => api<Exam & { questions: { examQuestionId: string; questionId: string; questionOrder: number }[] }>(`/api/exams/${id}`),
  getWithQuestions: (id: string) =>
    api<Exam & { questions: ExamQuestionWithDetails[] }>(`/api/exams/${id}/with-questions`),
  create: (data: {
    classId: string;
    title: string;
    totalMarks: number;
    timeLimit: number;
    questionIds?: string[];
  }) => api<Exam>('/api/exams', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { title?: string; totalMarks?: number; timeLimit?: number; status?: 'draft' | 'scheduled' | 'active' | 'completed'; scheduledAt?: string | null; questionIds?: string[] }) =>
    api<Exam>(`/api/exams/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// --- Attempts ---
export type ExamAttempt = {
  attemptId: string;
  examId: string;
  studentId: string;
  status: 'in_progress' | 'submitted';
  startedAt: string;
  submittedAt: string | null;
};
export type AttemptResponse = {
  responseId: string;
  attemptId: string;
  questionId: string;
  answerText: string | null;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  marksObtained: number | null;
  questionText?: string;
  options?: { optionId: string; optionText: string; isCorrect: boolean }[];
};
export type AttemptResult = {
  resultId: string;
  attemptId: string;
  totalScore: number;
  percentage: string;
  grade: string | null;
  generatedAt: string;
};
export const attemptsApi = {
  list: (examId?: string) =>
    api<ExamAttempt[]>(examId ? `/api/attempts?examId=${examId}` : '/api/attempts'),
  start: (examId: string) =>
    api<ExamAttempt>('/api/attempts/start', { method: 'POST', body: JSON.stringify({ examId }) }),
  get: (id: string) =>
    api<ExamAttempt & { responses: AttemptResponse[]; result: AttemptResult | null }>(`/api/attempts/${id}`),
  submitResponse: (attemptId: string, data: { questionId: string; answerText?: string; selectedOptionId?: string }) =>
    api<unknown>(`/api/attempts/${attemptId}/responses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submit: (attemptId: string) =>
    api<ExamAttempt & { result: AttemptResult }>(`/api/attempts/${attemptId}/submit`, { method: 'POST' }),
};

// --- AI (OpenAI) ---
export type GeneratedQuestion = {
  questionText: string;
  type: 'mcq' | 'short' | 'essay';
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  options: { optionText: string; isCorrect: boolean }[];
};
export const aiApi = {
  generateQuestions: (params: {
    topicId?: string;
    topicName: string;
    count?: number;
    type?: 'mcq' | 'short' | 'essay';
    difficulty?: 'easy' | 'medium' | 'hard';
  }) =>
    api<{ topicId: string | null; topicName: string; generated: GeneratedQuestion[] }>(
      '/api/ai/generate-questions',
      { method: 'POST', body: JSON.stringify(params) }
    ),
};

// --- Paper generation ---
export const paperApi = {
  generate: (data: {
    subjectId: string;
    topicIds: string[];
    totalMarks: number;
    questionCount: number;
    difficultyDistribution?: { easy: number; medium: number; hard: number };
  }) =>
    api<{ questions: Question[] }>('/api/paper/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// --- Analytics ---
export const analyticsApi = {
  instructor: () => api<Record<string, unknown>>('/api/analytics/instructor'),
  student: () => api<Record<string, unknown>>('/api/analytics/student'),
};
