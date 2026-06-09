import { Router }        from 'express';
import { generateTrace } from '../modules/execution/traceExtractor.js';

const executeRouter = Router();

const SUPPORTED = ['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'go', 'rust'];

executeRouter.post('/', async (req, res) => {
  const { code, language, simulationInput = '' } = req.body;

  if (!code || typeof code !== 'string' || !code.trim())
    return res.status(400).json({ error: 'code is required' });

  if (!language || !SUPPORTED.includes(language.toLowerCase()))
    return res.status(400).json({ error: `Unsupported language: ${language}` });

  const truncatedCode = code.length > 8000 ? code.slice(0, 8000) : code;

  try {
    const result = await generateTrace(truncatedCode, language.toLowerCase(), simulationInput);
    return res.json(result); // { steps, truncated, stepCount }
  } catch (err) {
    console.error('[Execute]', err.message);
    const isParseError = err.message.includes('trace') || err.message.includes('parsed') || err.message.includes('valid steps');
    return res.status(500).json({
      error:   isParseError ? 'Could not parse execution trace' : 'Simulation failed',
      message: err.message,
    });
  }
});

export default executeRouter;