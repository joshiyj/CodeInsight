import Groq from 'groq-sdk';
import { config }       from '../../config/index.js';
import { buildSimulationPrompt } from './tracePrompt.js';
import { enrichSteps }  from './stepEnricher.js';

const groq = new Groq({ apiKey: config.groqApiKeyExecute });


/**
 * @param {string} code
 * @param {string} language
 * @param {string} simulationInput
 * @returns {Promise<{ steps: object[], truncated: boolean, stepCount: number }>}
 */
export async function generateTrace(code, language, simulationInput = '') {
  const prompt = buildSimulationPrompt(code, language, simulationInput);

  const response = await groq.chat.completions.create({
    model:       'llama-3.3-70b-versatile',
    temperature: 0.1,   // low — we need precision, not creativity
    max_tokens:  8000,
    messages:    [{ role: 'user', content: prompt }],
  });

  const raw = response.choices[0].message.content;

  // Extract <trace> block
  const match = raw.match(/<trace>([\s\S]*?)<\/trace>/);
  if (!match) throw new Error('Model did not return a <trace> block');

  // Strip any accidental markdown fences the model might add
  const cleaned = match[1].trim()
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/, '');

  let steps;
  try {
    steps = JSON.parse(cleaned);
  } catch {
    throw new Error('Trace JSON could not be parsed');
  }

  if (!Array.isArray(steps)) throw new Error('Trace must be a JSON array');

  // Drop steps missing required fields
  const valid = steps.filter(s =>
    typeof s.stepIndex  === 'number' &&
    typeof s.line       === 'number' &&
    s.methodName  &&
    s.variables   !== undefined &&
    Array.isArray(s.callStack) &&
    s.description
  );

  if (valid.length === 0) throw new Error('No valid steps in trace');

  const truncated = valid.length >= 500;
  const capped    = valid.slice(0, 500);

  return {
    steps:     enrichSteps(capped),
    truncated,
    stepCount: capped.length,
  };
}