import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.trim() === '') return null;
  if (!client) client = new OpenAI({ apiKey: key });
  return client;
}

export function isOpenAIAvailable(): boolean {
  return getOpenAIClient() !== null;
}
