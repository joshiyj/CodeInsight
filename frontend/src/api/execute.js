const API_URL = import.meta.env.VITE_API_URL;

/**
 * @param {string} code
 * @param {string} language
 * @param {string} simulationInput
 * @returns {Promise<{ steps: object[], truncated: boolean, stepCount: number }>}
 */
export async function simulateCode(code, language, simulationInput = '') {
  const res = await fetch(`${API_URL}/api/execute`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ code, language, simulationInput }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Simulation failed: ${res.status}`);
  }

  return res.json();
}