// src/modules/ai/groqClient.js
import Groq from 'groq-sdk';
import { config } from '../../config/index.js';
import { buildReviewPrompt, buildUserMessage } from './promptManager.js';

const groq = new Groq({ apiKey: config.groqApiKey });

/**
 * Streams a code review from Groq (llama-3.3-70b-versatile).
 * Returns an async iterable of chunks — each chunk has
 * choices[0].delta.content (string | null).
 *
 * @param {string} code
 * @param {string} language
 * @returns {Promise<AsyncIterable>}
 */
export async function streamAnalysis(code, language) {
  const stream = await groq.chat.completions.create({
    model:       'llama-3.3-70b-versatile',
    stream:      true,
    temperature: 0.3,
    messages: [
      { role: 'system',  content: buildReviewPrompt(language) },
      { role: 'user',    content: buildUserMessage(code, language) },
    ],
  });

  return stream; // AsyncIterable of ChatCompletionChunk
}
