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
    max_tokens:  4000,
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

  // Sanitize common LLM JSON mistakes before parsing
  const sanitized = sanitizeJson(cleaned);

  let steps;
  try {
    steps = JSON.parse(sanitized);
  } catch (parseErr) {
    // Log a snippet to help debug future failures
    console.error('[Execute] JSON parse failed. First 500 chars of trace:\n', sanitized.slice(0, 500));
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

  const truncated = valid.length >= 25;
  const capped    = valid.slice(0, 25);

  return {
    steps:     enrichSteps(capped),
    truncated,
    stepCount: capped.length,
  };
}

/**
 * Fixes the most common LLM JSON mistakes so JSON.parse succeeds.
 * - Replaces single-quoted string/char values with double-quoted equivalents
 *   e.g.  'a'  →  "a"   and  'hello'  →  "hello"
 * - Removes trailing commas before ] or }
 * @param {string} raw
 * @returns {string}
 */
function sanitizeJson(raw) {
  return raw
    // Replace single-quoted string values (JSON values only, not inside double-quoted strings)
    // Handles cases like: "ch": 'a'  or  "s": 'hello'
    .replace(/:\s*'([^']*)'/g, (_, inner) => `: "${inner}"`)
    // Also handle single-quoted values in arrays: ['a', 'b'] → ["a", "b"]
    .replace(/,\s*'([^']*)'/g, (_, inner) => `, "${inner}"`)
    .replace(/\[\s*'([^']*)'/g, (_, inner) => `["${inner}"`)
    // C/C++: replace hex memory addresses with null — e.g. "ptr": "0x7fff1234" → "ptr": null
    .replace(/:\s*"0x[0-9a-fA-F]+"/g, ': null')
    .replace(/:\s*0x[0-9a-fA-F]+/g, ': null')
    // C/C++: convert arrow-accessor JSON keys like "node->val" to "node_val"
    .replace(/"(\w+)->(\w+)"/g, '"$1_$2"')
    // Remove trailing commas before closing brackets/braces
    .replace(/,\s*([}\]])/g, '$1');
}