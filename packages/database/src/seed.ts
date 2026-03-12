import { createDb } from './index.js';
import {
  users,
  subjects,
  topics,
  questions,
  questionOptions,
  classes,
  classEnrollments,
} from './schema/index.js';
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;
const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'Admin@123';

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  const db = createDb(connectionString);

  const hash = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

  const [superAdmin] = await db
    .insert(users)
    .values({
      name: 'Super Admin',
      email: 'superadmin@qbms.local',
      passwordHash: hash,
      role: 'super_admin',
      status: 'active',
    })
    .returning({ userId: users.userId });

  if (!superAdmin) throw new Error('Failed to create super admin');
  console.log('Created Super Admin:', superAdmin.userId);

  const [instructor] = await db
    .insert(users)
    .values({
      name: 'Demo Instructor',
      email: 'instructor@qbms.local',
      passwordHash: hash,
      role: 'instructor',
      status: 'active',
    })
    .returning({ userId: users.userId });

  const [student] = await db
    .insert(users)
    .values({
      name: 'Demo Student',
      email: 'student@qbms.local',
      passwordHash: hash,
      role: 'student',
      status: 'active',
    })
    .returning({ userId: users.userId });

  // Create class first (Phase 4: classes no longer have subjectId)
  const [demoClass] = await db
    .insert(classes)
    .values({
      instructorId: instructor!.userId,
      className: 'Math 101',
      enrollmentCode: 'MATH101-2024',
    })
    .returning({ classId: classes.classId });

  // Create subjects with classId (Phase 4: subjects now require classId)
  const [math] = await db
    .insert(subjects)
    .values({ 
      classId: demoClass!.classId,
      subjectName: 'Mathematics', 
      description: 'Algebra, Calculus, Statistics' 
    })
    .returning({ subjectId: subjects.subjectId });
  const [physics] = await db
    .insert(subjects)
    .values({ 
      classId: demoClass!.classId,
      subjectName: 'Physics', 
      description: 'Mechanics, Optics, Electromagnetism' 
    })
    .returning({ subjectId: subjects.subjectId });

  const [algTopic] = await db
    .insert(topics)
    .values({ subjectId: math!.subjectId, topicName: 'Algebra' })
    .returning({ topicId: topics.topicId });
  const [calcTopic] = await db
    .insert(topics)
    .values({ subjectId: math!.subjectId, topicName: 'Calculus' })
    .returning({ topicId: topics.topicId });
  const [mechTopic] = await db
    .insert(topics)
    .values({ subjectId: physics!.subjectId, topicName: 'Mechanics' })
    .returning({ topicId: topics.topicId });

  const [q1] = await db
    .insert(questions)
    .values({
      topicId: algTopic!.topicId,
      questionText: 'What is 2 + 2?',
      type: 'mcq',
      difficulty: 'easy',
      marks: 2,
      createdBy: instructor!.userId,
    })
    .returning({ questionId: questions.questionId });

  await db.insert(questionOptions).values([
    { questionId: q1!.questionId, optionText: '3', isCorrect: false },
    { questionId: q1!.questionId, optionText: '4', isCorrect: true },
    { questionId: q1!.questionId, optionText: '5', isCorrect: false },
  ]);

  const [q2] = await db
    .insert(questions)
    .values({
      topicId: calcTopic!.topicId,
      questionText: 'Find the derivative of x^2.',
      type: 'short',
      difficulty: 'medium',
      marks: 5,
      createdBy: instructor!.userId,
    })
    .returning({ questionId: questions.questionId });

  // Enroll student in class
  await db.insert(classEnrollments).values({
    classId: demoClass!.classId,
    studentId: student!.userId,
  });

  console.log('Seed completed. Default Super Admin: superadmin@qbms.local /', defaultPassword);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
