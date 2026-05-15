// src/api/stream.js
import { API_URL } from './client.js';

export function createAnalysisStream(code, language, { onToken, onIssues, onComplete, onError }) {
  const params = new URLSearchParams({ code, language });
  const url    = `${API_URL}/api/analyze/stream?${params.toString()}`;

  const es = new EventSource(url);

  es.addEventListener('token',    (e) => onToken(JSON.parse(e.data).text));
  es.addEventListener('issues',   (e) => {
    const list = JSON.parse(e.data);
    console.log('[SSE] issues event received:', list.length, 'issues', list);
    onIssues(list);
  });
  es.addEventListener('complete', (e) => { onComplete(JSON.parse(e.data)); es.close(); });
  es.addEventListener('error',    (e) => { onError(e);                     es.close(); });
  es.onerror = (e) => { onError(e); es.close(); };

  return () => es.close();
}