import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redis = new Redis(redisUrl, { maxRetriesPerRequest: 3 });

redis.on('error', (err) => console.error('Redis error:', err));

export const REDIS_KEYS = {
  attemptResponse: (attemptId: string) => `attempt:${attemptId}:responses`,
  tokenBlacklist: (jti: string) => `blacklist:${jti}`,
  examTimer: (attemptId: string) => `exam:attempt:${attemptId}:ends_at`,
  registerOtp: (email: string) => `otp:register:${email.toLowerCase().trim()}`,
} as const;
