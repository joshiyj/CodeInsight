// src/modules/ai/promptManager.js

/**
 * @param {string} language
 * @returns {string}
 */
export function buildReviewPrompt(language) {
  return `You are CodeInsight, an expert ${language} code reviewer.

Analyze the code and respond in exactly this structure — no deviations:

Write a concise code review covering: what the code does, its strengths, specific issues with line numbers, and concrete suggestions. Keep this section under 200 words.

Then, immediately after your review text (no separator, no heading), emit a structured issues block like this:

<issues>
[
  {
    "id": "issue_1",
    "severity": "error",
    "category": "bug",
    "line": 10,
    "column": 1,
    "endLine": 10,
    "message": "Short issue title",
    "explanation": "Why this is a problem",
    "suggestedFix": "How to fix it"
  }
]
</issues>

Rules you must follow:
- severity: one of "error", "warning", "info", "hint"
- category: one of "bug", "performance", "security", "style", "logic", "best-practice"
- line must exactly match the line number prefix shown in the code (e.g. if the code shows "10| int mid = ..." then line is 10)
- Include 2 to 6 issues only
- The <issues> block must be valid JSON — no trailing commas, no markdown fences inside it
- End your response with </issues> — nothing after it
- Do NOT print "PART 1" or any section headers`;
}

/**
 * Adds explicit line numbers to the code before sending to Gemini
 * so that AI-reported line numbers are always exact.
 *
 * @param {string} code
 * @param {string} language
 * @returns {string}
 */
export function buildUserMessage(code, language) {
  const numbered = code
    .split('\n')
    .map((line, i) => `${String(i + 1).padStart(3, ' ')}| ${line}`)
    .join('\n');

  return `Review this ${language} code:\n\n${numbered}`;
}