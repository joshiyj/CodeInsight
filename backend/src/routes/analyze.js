// src/routes/analyze.js
import { Router } from 'express';
import { streamRouter } from './stream.js';

export const analyzeRouter = Router();

const VALID_LANGUAGES = ['javascript', 'python', 'java', 'c', 'cpp'];
const MAX_CODE_LENGTH = 1500;

// Validation middleware shared by both routes
export function validateAnalysisInput(req, res, next) {
  // GET requests send params via query string, POST via body
  const { code, language } = { ...req.body, ...req.query };

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code is required and must be a string' });
  }
  if (code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({ error: `Code exceeds the maximum limit of 1500 characters for code review.` });
  }
  if (!language || !VALID_LANGUAGES.includes(language.toLowerCase())) {
    return res.status(400).json({
      error: `language must be one of: ${VALID_LANGUAGES.join(', ')}`,
    });
  }

  next();
}

// Mount the SSE stream endpoint under /api/analyze/stream
analyzeRouter.use('/stream', validateAnalysisInput, streamRouter);