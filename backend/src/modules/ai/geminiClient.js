// src/modules/ai/geminiClient.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/index.js';
import { buildReviewPrompt, buildUserMessage } from './promptManager.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

/**
 * Streams a code review from Gemini.
 * @param {string} code      - the user's source code
 * @param {string} language  - e.g. "javascript", "python", "java"
 * @returns {Promise<AsyncIterable>} - stream of chunks; call chunk.text() on each
 */
export async function streamAnalysis(code, language) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: buildReviewPrompt(language),
  });

  const result = await model.generateContentStream(
    buildUserMessage(code, language)
  );

  return result.stream;
}