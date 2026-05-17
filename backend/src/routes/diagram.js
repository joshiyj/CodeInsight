import express from 'express';
import { generateDiagram } from '../modules/visualization/mermaidGenerator.js';

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

  // Truncate very large inputs — keep prompt manageable
  const truncatedCode = code.length > 8000 ? code.slice(0, 8000) : code;

  try {
    const mermaid = await generateDiagram(truncatedCode, lang);
    return res.json({ mermaid }); // string | null — both are valid success states
  } catch (err) {
    console.error('[diagram] Gemini error:', err.message);
    return res.status(500).json({
      error: 'Diagram generation failed',
      message: err.message,
    });
  }
});

export default router;