import { Router }        from 'express';
import { generateTrace } from '../modules/execution/traceExtractor.js';
import { formatGroqError } from '../utils/errorUtils.js';

const executeRouter = Router();

const SUPPORTED = ['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'go', 'rust'];

executeRouter.post('/', async (req, res) => {
  const { code, language, simulationInput = '' } = req.body;

  if (!code || typeof code !== 'string' || !code.trim())
    return res.status(400).json({ error: 'code is required' });

  if (!language || !SUPPORTED.includes(language.toLowerCase()))
    return res.status(400).json({ error: `Unsupported language: ${language}` });
  if (code.length > 1500) {
    return res.status(400).json({ error: 'Code exceeds the maximum limit of 1500 characters for simulation.' });
  }

  try {
    const result = await generateTrace(code, language.toLowerCase(), simulationInput);
    return res.json(result); // { steps, truncated, stepCount }
  } catch (err) {
    console.error('[Execute]', err.message);
    const isParseError = err.message.includes('trace') || err.message.includes('parsed') || err.message.includes('valid steps');
    const userMessage = isParseError
      ? 'Could not parse execution trace'
      : formatGroqError(err, 'Simulation failed');
    return res.status(500).json({
      error:   userMessage,
      message: err.message,
    });
  }
});

export default executeRouter;