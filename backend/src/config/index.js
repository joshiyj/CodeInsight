// src/config/index.js
import 'dotenv/config';

const required = ['GEMINI_API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
}

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  port:         parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv:      process.env.NODE_ENV ?? 'development',
  isDev:        process.env.NODE_ENV !== 'production',
};