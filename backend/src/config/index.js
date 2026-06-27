// src/config/index.js
import 'dotenv/config';

const required = ['GROQ_API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
}

export const config = {
  groqApiKey:        process.env.GROQ_API_KEY,
  groqApiKeyExecute: process.env.GROQ_API_KEY_EXECUTE ?? process.env.GROQ_API_KEY,
  corsOrigin: process.env.CORS_ORIGIN ?? null,
  port:       parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv:    process.env.NODE_ENV ?? 'development',
  isDev:      process.env.NODE_ENV !== 'production',
};