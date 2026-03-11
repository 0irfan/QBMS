import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { extractQuestionsFromFile } from '../lib/question-extractor.js';
import { db } from '../lib/db.js';
import { questions, questionOptions } from '@qbms/database';
import { v4 as uuidv4 } from 'uuid';

export const questionExtractRouter = Router();
questionExtractRouter.use(authMiddleware);
questionExtractRouter.use(requireRoles('super_admin', 'instructor'));

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
  },
});

/** Upload and extract questions from a question paper */
questionExtractRouter.post('/upload', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { subjectId, topicId } = req.body;
    // subjectId is optional now - AI will extract subject name

    // Extract questions using AI
    const result = await extractQuestionsFromFile(req.file);

    // Return extracted questions and subject name for review
    res.json({
      message: 'Questions extracted successfully',
      subjectName: result.subjectName,
      questions: result.questions,
      count: result.questions.length,
    });
  } catch (error) {
    console.error('Question extraction error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to extract questions' 
    });
  }
});

/** Bulk import approved questions */
questionExtractRouter.post('/bulk-import', async (req: AuthRequest, res) => {
  try {
    const { questions: questionsToImport, topicId } = req.body;

    if (!Array.isArray(questionsToImport) || questionsToImport.length === 0) {
      return res.status(400).json({ error: 'No questions provided' });
    }

    if (!topicId) {
      return res.status(400).json({ error: 'topicId is required' });
    }

    const results = [];

    for (const q of questionsToImport) {
      try {
        const questionId = uuidv4();
        
        // Insert question
        await db.insert(questions).values({
          questionId,
          topicId,
          questionText: q.questionText,
          type: q.type || 'short',
          difficulty: q.difficulty || 'medium',
          marks: q.marks || 2,
          createdBy: req.user!.userId,
        });

        // Insert options if MCQ
        if (q.type === 'mcq' && q.options && Array.isArray(q.options)) {
          for (const opt of q.options) {
            await db.insert(questionOptions).values({
              optionId: uuidv4(),
              questionId,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect || false,
            });
          }
        }

        results.push({ success: true, questionText: q.questionText });
      } catch (error) {
        results.push({ 
          success: false, 
          questionText: q.questionText, 
          error: error instanceof Error ? error.message : 'Failed to import' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    res.json({
      message: `Imported ${successCount} of ${questionsToImport.length} questions`,
      results,
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to import questions' 
    });
  }
});
