const API_URL = import.meta.env.VITE_API_URL;

/**
 * Calls POST /api/diagram and returns the Mermaid string (or null).
 *
 * @param {string} code
 * @param {string} language
 * @returns {Promise<{ mermaid: string | null }>}
 * @throws {Error} on network failure or non-2xx response
 */
export async function fetchDiagram(code, language) {
  const res = await fetch(`${API_URL}/api/diagram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Diagram request failed: ${res.status}`);
  }

  return res.json(); // { mermaid: string | null }
}