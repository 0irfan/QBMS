-- Initial schema
CREATE TYPE "user_role" AS ENUM('super_admin', 'instructor', 'student');
--> statement-breakpoint
CREATE TYPE "user_status" AS ENUM('active', 'inactive');
--> statement-breakpoint
CREATE TYPE "question_type" AS ENUM('mcq', 'short', 'essay');
--> statement-breakpoint
CREATE TYPE "difficulty" AS ENUM('easy', 'medium', 'hard');
--> statement-breakpoint
CREATE TYPE "exam_status" AS ENUM('draft', 'scheduled', 'active', 'completed');
--> statement-breakpoint
CREATE TYPE "attempt_status" AS ENUM('in_progress', 'submitted', 'graded');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
  "user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "password_hash" varchar(255) NOT NULL,
  "role" "user_role" NOT NULL DEFAULT 'student',
  "status" "user_status" NOT NULL DEFAULT 'active',
  "failed_login_attempts" integer DEFAULT 0,
  "locked_until" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "token_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("user_id") ON DELETE CASCADE,
  "token_hash" varchar(255) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "token_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("user_id") ON DELETE CASCADE,
  "token_hash" varchar(255) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subjects" (
  "subject_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subject_name" varchar(255) NOT NULL,
  "description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "topics" (
  "topic_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "subject_id" uuid NOT NULL REFERENCES "subjects"("subject_id") ON DELETE CASCADE,
  "topic_name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questions" (
  "question_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "topic_id" uuid NOT NULL REFERENCES "topics"("topic_id") ON DELETE CASCADE,
  "question_text" text NOT NULL,
  "type" "question_type" NOT NULL,
  "difficulty" "difficulty" NOT NULL,
  "marks" integer NOT NULL,
  "created_by" uuid REFERENCES "users"("user_id") ON DELETE SET NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "question_options" (
  "option_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "question_id" uuid NOT NULL REFERENCES "questions"("question_id") ON DELETE CASCADE,
  "option_text" text NOT NULL,
  "is_correct" boolean NOT NULL DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "classes" (
  "class_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "instructor_id" uuid NOT NULL REFERENCES "users"("user_id") ON DELETE CASCADE,
  "subject_id" uuid NOT NULL REFERENCES "subjects"("subject_id") ON DELETE CASCADE,
  "class_name" varchar(255) NOT NULL,
  "enrollment_code" varchar(50) NOT NULL UNIQUE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "class_enrollments" (
  "enrollment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "class_id" uuid NOT NULL REFERENCES "classes"("class_id") ON DELETE CASCADE,
  "student_id" uuid NOT NULL REFERENCES "users"("user_id") ON DELETE CASCADE,
  "enrolled_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exams" (
  "exam_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "class_id" uuid NOT NULL REFERENCES "classes"("class_id") ON DELETE CASCADE,
  "title" varchar(255) NOT NULL,
  "total_marks" integer NOT NULL,
  "time_limit" integer NOT NULL,
  "status" "exam_status" NOT NULL DEFAULT 'draft',
  "scheduled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exam_questions" (
  "exam_question_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "exam_id" uuid NOT NULL REFERENCES "exams"("exam_id") ON DELETE CASCADE,
  "question_id" uuid NOT NULL REFERENCES "questions"("question_id") ON DELETE CASCADE,
  "question_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exam_attempts" (
  "attempt_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "exam_id" uuid NOT NULL REFERENCES "exams"("exam_id") ON DELETE CASCADE,
  "student_id" uuid NOT NULL REFERENCES "users"("user_id") ON DELETE CASCADE,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "submitted_at" timestamp with time zone,
  "status" "attempt_status" NOT NULL DEFAULT 'in_progress'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "responses" (
  "response_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "attempt_id" uuid NOT NULL REFERENCES "exam_attempts"("attempt_id") ON DELETE CASCADE,
  "question_id" uuid NOT NULL REFERENCES "questions"("question_id") ON DELETE CASCADE,
  "answer_text" text,
  "selected_option_id" uuid REFERENCES "question_options"("option_id"),
  "is_correct" boolean,
  "marks_obtained" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "results" (
  "result_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "attempt_id" uuid NOT NULL UNIQUE REFERENCES "exam_attempts"("attempt_id") ON DELETE CASCADE,
  "total_score" integer NOT NULL,
  "percentage" decimal(5, 2) NOT NULL,
  "grade" varchar(10),
  "generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
  "log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("user_id") ON DELETE SET NULL,
  "action" varchar(100) NOT NULL,
  "resource_type" varchar(100) NOT NULL,
  "resource_id" uuid,
  "ip_address" varchar(45),
  "user_agent" text,
  "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "classes_enrollment_code_idx" ON "classes" ("enrollment_code");
