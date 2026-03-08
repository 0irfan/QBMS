import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { redis, REDIS_KEYS } from './lib/redis.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:3000' },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
      (socket as any).userId = decoded.sub;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const attemptId = (socket.handshake.query?.attemptId as string) || (socket.handshake.auth?.attemptId as string);
    if (attemptId) socket.join(`attempt:${attemptId}`);

    socket.on('sync-time', () => {
      socket.emit('server-time', { now: Date.now() });
    });

    socket.on('disconnect', () => {});
  });

  setInterval(async () => {
    const now = Date.now();
    const keys = await redis.keys('exam:attempt:*');
    for (const key of keys) {
      const endsAt = await redis.get(key);
      if (endsAt && Number(endsAt) <= now) {
        const attemptId = key.replace('exam:attempt:', '').replace(':ends_at', '');
        io.to(`attempt:${attemptId}`).emit('exam-ended', { attemptId });
      }
    }
  }, 5000);

  return io;
}
