// src/utils/errorUtils.js

/**
 * Formats Groq/LLM API errors into user-friendly messages.
 *
 * Handles:
 *  - 429 / quota exceeded  → "High traffic today" message
 *  - 401 / 403 / API key   → Invalid API key message
 *  - 503 / overloaded      → Temporary overload message
 *
 * @param {Error} err
 * @param {string} defaultMessage  Fallback if none of the known patterns match
 * @returns {string}
 */
export function formatGroqError(err, defaultMessage = 'API request failed') {
  const raw = err.message || '';

  if (
    raw.includes('429') ||
    raw.includes('Too Many Requests') ||
    raw.includes('quota') ||
    raw.includes('limit exceeded') ||
    raw.includes('rate limit')
  ) {
    return '⏳ High traffic today — daily API limit reached. Please come back tomorrow!';
  }

  if (raw.includes('API key') || raw.includes('403') || raw.includes('401')) {
    return '🔑 Invalid API key. Check GROQ_API_KEY in backend/.env';
  }

  if (raw.includes('503') || raw.includes('overloaded')) {
    return '🔄 AI service temporarily overloaded. Try again in a few seconds.';
  }

  return defaultMessage;
}
