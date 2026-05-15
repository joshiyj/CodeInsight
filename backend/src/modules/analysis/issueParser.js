// src/modules/analysis/issueParser.js

const VALID_SEVERITIES = ['error', 'warning', 'info', 'hint'];
const VALID_CATEGORIES = ['bug', 'performance', 'security', 'style', 'logic', 'best-practice'];

/**
 * Extracts and validates the <issues> JSON block from a full AI response string.
 * Defensively handles: markdown fences, trailing commas, unclosed arrays.
 *
 * @param {string} fullText
 * @returns {CodeIssue[]}
 */
export function parseIssues(fullText) {
  try {
    // 1. Extract the <issues> block
    const match = fullText.match(/<issues>([\s\S]*?)<\/issues>/);
    if (!match) {
      console.warn('[issueParser] No <issues> block found in response');
      return [];
    }

    let raw = match[1].trim();

    // 2. Strip markdown code fences (```json ... ```)
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

    // 3. If array isn't closed, close it
    if (raw.endsWith('}') && !raw.endsWith('}]')) {
      raw = raw + '\n]';
    }

    // 4. Remove trailing commas before ] or } (common LLM mistake)
    raw = raw.replace(/,\s*([}\]])/g, '$1');

    // 5. Parse
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('[issueParser] Parsed value is not an array');
      return [];
    }

    // 6. Map with safe defaults, then filter out anything still invalid
    const issues = parsed
      .map((item, index) => ({
        id:           String(item.id ?? `issue_${index + 1}`),
        severity:     VALID_SEVERITIES.includes(item.severity) ? item.severity : 'warning',
        category:     VALID_CATEGORIES.includes(item.category) ? item.category : 'logic',
        line:         Math.max(1, Number(item.line) || 1),
        column:       Math.max(1, Number(item.column) || 1),
        endLine:      Math.max(1, Number(item.endLine || item.line) || 1),
        message:      String(item.message  ?? '').trim(),
        explanation:  String(item.explanation ?? '').trim(),
        suggestedFix: item.suggestedFix ? String(item.suggestedFix).trim() : undefined,
      }))
      .filter((item) => item.message.length > 0);

    console.log(`[issueParser] Successfully parsed ${issues.length} issues`);
    return issues;

  } catch (err) {
    console.warn('[issueParser] Parse failed:', err.message);
    return [];
  }
}