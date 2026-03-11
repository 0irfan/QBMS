import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { setupSocket } from './socket.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimit.js';
import { initializeAzureStorage, ensureContainerExists } from './lib/azure-storage.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { subjectsRouter } from './routes/subjects.js';
import { topicsRouter } from './routes/topics.js';
import { questionsRouter } from './routes/questions.js';
import { classesRouter } from './routes/classes.js';
import { examsRouter } from './routes/exams.js';
import { attemptsRouter } from './routes/attempts.js';
import { paperRouter } from './routes/paper.js';
import { uploadRouter } from './routes/upload.js';
import { analyticsRouter } from './routes/analytics.js';
import { auditRouter } from './routes/audit.js';
import { invitesRouter } from './routes/invites.js';
import { healthRouter } from './routes/health.js';
import { aiRouter } from './routes/ai.js';
import { questionExtractRouter } from './routes/question-extract.js';

const app = express();
const httpServer = createServer(app);

const PORT = Number(process.env.PORT) || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Initialize Azure Blob Storage
const azureInitialized = initializeAzureStorage();
// Don't call ensureContainerExists on startup - it will be called on first upload
// This prevents startup failures if Azure has issues

app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(rateLimiter);

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/classes', classesRouter);
app.use('/api/exams', examsRouter);
app.use('/api/attempts', attemptsRouter);
app.use('/api/paper', paperRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/invites', invitesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/question-extract', questionExtractRouter);

app.use(errorHandler);

setupSocket(httpServer);

httpServer.listen(PORT, () => {
  logger.info(`API listening on port ${PORT}`);
  logger.info(`Azure Blob Storage: ${azureInitialized ? 'Enabled' : 'Disabled (using local storage)'}`);
});

