import Groq from 'groq-sdk';
import { config } from '../../config/index.js';
import { buildDiagramPrompt } from '../ai/promptTemplates/diagram.js';

const groq = new Groq({ apiKey: config.groqApiKey });

/**
 * Extracts the JSON graph from between <graph>...</graph> tags.
 * @param {string} responseText
 * @returns {{ nodes: Array, edges: Array } | null}
 */
export function extractGraph(responseText) {
  const match = responseText.match(/<graph>([\s\S]*?)<\/graph>/);
  if (!match) return null;

  const content = match[1].trim();
  if (!content || content === 'NONE') return null;

  try {
    const graph = JSON.parse(content);
    if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) return null;
    return graph;
  } catch {
    return null;
  }
}

/**
 * Sanitizes a plain-text label for safe embedding in Mermaid.
 * Only needs to handle text content — no Mermaid syntax concerns.
 * @param {string} label
 * @returns {string}
 */
function sanitizeLabel(label) {
  return String(label)
    .replace(/"/g, "'")   // only escape double quotes — they'd break our "..." wrapper
    .replace(/\n/g, ' ')  // no newlines
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
}

/**
 * Converts a validated JSON graph to a Mermaid flowchart string.
 * This function owns 100% of the Mermaid syntax — Gemini never touches it.
 * @param {{ nodes: Array, edges: Array }} graph
 * @returns {string}
 */
export function graphToMermaid(graph) {
  const lines = ['flowchart TD'];

  for (const node of graph.nodes) {
    const id    = String(node.id).replace(/\W/g, '');
    const label = sanitizeLabel(node.label || id);

    switch (node.shape) {
      case 'diamond':
        lines.push(`    ${id}{"${label}"}`);
        break;
      case 'rounded':
        lines.push(`    ${id}("${label}")`);
        break;
      default:
        lines.push(`    ${id}["${label}"]`);
    }
  }

  for (const edge of graph.edges) {
    const from  = String(edge.from).replace(/\W/g, '');
    const to    = String(edge.to).replace(/\W/g, '');
    const label = edge.label ? sanitizeLabel(edge.label) : null;

    if (label) {
      lines.push(`    ${from} -- "${label}" --> ${to}`);
    } else {
      lines.push(`    ${from} --> ${to}`);
    }
  }

  return lines.join('\n');
}

/**
 * Main entry point. Calls Groq (llama-3.1-8b-instant), parses JSON graph,
 * converts to valid Mermaid syntax.
 * @param {string} code
 * @param {string} language
 * @returns {Promise<string | null>}
 */
export async function generateDiagram(code, language) {
  const prompt = buildDiagramPrompt(code, language);

  const completion = await groq.chat.completions.create({
    model:       'llama-3.1-8b-instant',
    stream:      false,
    temperature: 0.1,   // low temp = more deterministic JSON
    messages: [
      { role: 'user', content: prompt },
    ],
  });

  const responseText = completion.choices[0]?.message?.content ?? '';

  const graph = extractGraph(responseText);
  if (!graph) return null;

  return graphToMermaid(graph);
}