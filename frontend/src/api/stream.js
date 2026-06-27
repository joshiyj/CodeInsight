// src/api/stream.js
import { API_URL } from './client.js';

export function createAnalysisStream(code, language, { onToken, onIssues, onComplete, onError }) {
  const params = new URLSearchParams({ code, language });
  const url    = `${API_URL}/api/analyze/stream?${params.toString()}`;

  // Pre-flight: check for rate-limit (429) before opening EventSource.
  // EventSource can't read HTTP status codes, so a 429 just fires onerror
  // with no message — resulting in the misleading "Connection lost" fallback.
  fetch(url, { headers: { Accept: 'text/event-stream' } }).then(async (probe) => {
    if (!probe.ok) {
      const body = await probe.json().catch(() => ({}));
      onError(body.error || `Request failed (${probe.status})`);
      return;
    }

    // Server accepted — open the real EventSource connection
    const es = new EventSource(url);

    es.addEventListener('token',    (e) => onToken(JSON.parse(e.data).text));
    es.addEventListener('issues',   (e) => {
      const list = JSON.parse(e.data);
      onIssues(list);
    });
    es.addEventListener('complete', (e) => { onComplete(JSON.parse(e.data)); es.close(); });
    es.addEventListener('error',    (e) => {
      const msg = e.data
        ? (JSON.parse(e.data).message || 'Unknown error')
        : 'Connection lost — check the backend is running.';
      onError(msg);
      es.close();
    });
    es.onerror = () => { onError('Connection lost — check the backend is running.'); es.close(); };
  }).catch(() => {
    onError('Connection lost — check the backend is running.');
  });

  // Return a cancel function (best-effort: no-op if ES not yet opened)
  let cancelled = false;
  return () => { cancelled = true; };
}