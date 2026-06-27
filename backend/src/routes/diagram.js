import express from 'express';
import { generateDiagram } from '../modules/visualization/mermaidGenerator.js';
import { formatGroqError } from '../utils/errorUtils.js';

const router = express.Router();

const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java',
  'c', 'cpp', 'go', 'rust', 'kotlin', 'swift',
];

/**
 * POST /api/diagram
 * Body: { code: string, language: string }
 * Response: { mermaid: string | null }
 */
router.post('/', async (req, res) => {
  const { code, language } = req.body;

  // --- Input validation ---
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({ error: 'code is required and must be a non-empty string' });
  }

  if (!language || typeof language !== 'string') {
    return res.status(400).json({ error: 'language is required' });
  }

  const lang = language.toLowerCase();
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    return res.status(400).json({
      error: `Unsupported language: ${language}`,
      supported: SUPPORTED_LANGUAGES,
    });
  }

  if (code.length > 1500) {
    return res.status(400).json({ error: 'Code exceeds the maximum limit of 1500 characters for flowchart generation.' });
  }

  try {
    const mermaid = await generateDiagram(code, lang);
    return res.json({ mermaid }); // string | null — both are valid success states
  } catch (err) {
    console.error('[diagram] error:', err.message);
    const userMessage = formatGroqError(err, 'Diagram generation failed');
    return res.status(500).json({
      error: userMessage,
      message: err.message,
    });
  }
});

export default router;