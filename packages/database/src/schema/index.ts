import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  decimal,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['super_admin', 'instructor', 'student']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive']);
export const questionTypeEnum = pgEnum('question_type', ['mcq', 'short', 'essay']);
export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard']);
export const examStatusEnum = pgEnum('exam_status', ['draft', 'scheduled', 'active', 'completed']);
export const attemptStatusEnum = pgEnum('attempt_status', ['in_progress', 'submitted', 'graded']);

export const users = pgTable(
  'users',
  {
    userId: uuid('user_id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: userRoleEnum('role').notNull().default('student'),
    status: userStatusEnum('status').notNull().default('active'),
    failedLoginAttempts: integer('failed_login_attempts').default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ users_email_idx: uniqueIndex('users_email_idx').on(t.email) })
);

export const refreshTokens = pgTable('refresh_tokens', {
  tokenId: uuid('token_id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  tokenId: uuid('token_id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const instructorInvites = pgTable('instructor_invites', {
  inviteId: uuid('invite_id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subjects = pgTable('subjects', {
  subjectId: uuid('subject_id').primaryKey().defaultRandom(),
  classId: uuid('class_id')
    .notNull()
    .references(() => classes.classId, { onDelete: 'cascade' }),
  subjectName: varchar('subject_name', { length: 255 }).notNull(),
  description: text('description'),
  createdBy: uuid('created_by').references(() => users.userId),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const topics = pgTable('topics', {
  topicId: uuid('topic_id').primaryKey().defaultRandom(),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjects.subjectId, { onDelete: 'cascade' }),
  topicName: varchar('topic_name', { length: 255 }).notNull(),
});

export const questions = pgTable('questions', {
  questionId: uuid('question_id').primaryKey().defaultRandom(),
  topicId: uuid('topic_id')
    .notNull()
    .references(() => topics.topicId, { onDelete: 'cascade' }),
  questionText: text('question_text').notNull(),
  type: questionTypeEnum('type').notNull(),
  difficulty: difficultyEnum('difficulty').notNull(),
  marks: integer('marks').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.userId, { onDelete: 'restrict' }),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const questionOptions = pgTable('question_options', {
  optionId: uuid('option_id').primaryKey().defaultRandom(),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.questionId, { onDelete: 'cascade' }),
  optionText: text('option_text').notNull(),
  isCorrect: boolean('is_correct').notNull().default(false),
});

export const classes = pgTable(
  'classes',
  {
    classId: uuid('class_id').primaryKey().defaultRandom(),
    instructorId: uuid('instructor_id')
      .notNull()
      .references(() => users.userId, { onDelete: 'cascade' }),
    className: varchar('class_name', { length: 255 }).notNull(),
    enrollmentCode: varchar('enrollment_code', { length: 50 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ classes_enrollment_code_idx: uniqueIndex('classes_enrollment_code_idx').on(t.enrollmentCode) })
);

export const classEnrollments = pgTable('class_enrollments', {
  enrollmentId: uuid('enrollment_id').primaryKey().defaultRandom(),
  classId: uuid('class_id')
    .notNull()
    .references(() => classes.classId, { onDelete: 'cascade' }),
  studentId: uuid('student_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'cascade' }),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
});

export const exams = pgTable('exams', {
  examId: uuid('exam_id').primaryKey().defaultRandom(),
  classId: uuid('class_id')
    .notNull()
    .references(() => classes.classId, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  totalMarks: integer('total_marks').notNull(),
  timeLimit: integer('time_limit').notNull(), // minutes
  status: examStatusEnum('status').notNull().default('draft'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const examQuestions = pgTable('exam_questions', {
  examQuestionId: uuid('exam_question_id').primaryKey().defaultRandom(),
  examId: uuid('exam_id')
    .notNull()
    .references(() => exams.examId, { onDelete: 'cascade' }),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.questionId, { onDelete: 'cascade' }),
  questionOrder: integer('question_order').notNull(),
});

export const examAttempts = pgTable('exam_attempts', {
  attemptId: uuid('attempt_id').primaryKey().defaultRandom(),
  examId: uuid('exam_id')
    .notNull()
    .references(() => exams.examId, { onDelete: 'cascade' }),
  studentId: uuid('student_id')
    .notNull()
    .references(() => users.userId, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  status: attemptStatusEnum('status').notNull().default('in_progress'),
});

export const responses = pgTable('responses', {
  responseId: uuid('response_id').primaryKey().defaultRandom(),
  attemptId: uuid('attempt_id')
    .notNull()
    .references(() => examAttempts.attemptId, { onDelete: 'cascade' }),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.questionId, { onDelete: 'cascade' }),
  answerText: text('answer_text'),
  selectedOptionId: uuid('selected_option_id').references(() => questionOptions.optionId),
  isCorrect: boolean('is_correct'),
  marksObtained: integer('marks_obtained'),
});

export const results = pgTable('results', {
  resultId: uuid('result_id').primaryKey().defaultRandom(),
  attemptId: uuid('attempt_id')
    .notNull()
    .unique()
    .references(() => examAttempts.attemptId, { onDelete: 'cascade' }),
  totalScore: integer('total_score').notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  grade: varchar('grade', { length: 10 }),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  logId: uuid('log_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.userId, { onDelete: 'set null' }),
  userEmail: varchar('user_email', { length: 255 }),
  userRole: userRoleEnum('user_role'),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  refreshTokens: many(refreshTokens),
  questions: many(questions),
  classes: many(classes),
  classEnrollments: many(classEnrollments),
  examAttempts: many(examAttempts),
  auditLogs: many(auditLogs),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  class: one(classes, {
    fields: [subjects.classId],
    references: [classes.classId],
  }),
  topics: many(topics),
  createdByUser: one(users, {
    fields: [subjects.createdBy],
    references: [users.userId],
  }),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  topic: one(topics),
  creator: one(users),
  options: many(questionOptions),
  examQuestions: many(examQuestions),
  responses: many(responses),
}));

export const questionOptionsRelations = relations(questionOptions, ({ one }) => ({
  question: one(questions),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  instructor: one(users, {
    fields: [classes.instructorId],
    references: [users.userId],
  }),
  subjects: many(subjects),
  enrollments: many(classEnrollments),
  exams: many(exams),
}));

export const classEnrollmentsRelations = relations(classEnrollments, ({ one }) => ({
  class: one(classes),
  student: one(users),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  class: one(classes),
  examQuestions: many(examQuestions),
  attempts: many(examAttempts),
}));

export const examQuestionsRelations = relations(examQuestions, ({ one }) => ({
  exam: one(exams),
  question: one(questions),
}));

export const examAttemptsRelations = relations(examAttempts, ({ one, many }) => ({
  exam: one(exams),
  student: one(users),
  responses: many(responses),
  result: one(results),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  attempt: one(examAttempts),
  question: one(questions),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  attempt: one(examAttempts),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users),
}));
