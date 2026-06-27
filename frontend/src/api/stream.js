// src/api/stream.js
import { API_URL } from './client.js';

export function createAnalysisStream(code, language, { onToken, onIssues, onComplete, onError }) {
  const params = new URLSearchParams({ code, language });
  const url    = `${API_URL}/api/analyze/stream?${params.toString()}`;

  let cancelled = false;
  let reader = null;

  // Run async stream read
  (async () => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        onError(body.error || `Request failed (${response.status})`);
        return;
      }

      if (!response.body) {
        onError('ReadableStream is not supported by the server response.');
        return;
      }

      reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (!cancelled) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Split by double newline (SSE block separator)
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || ''; // Keep the last incomplete block in the buffer

        for (const part of parts) {
          const lines = part.split('\n');
          let eventName = '';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataStr = line.slice(5).trim();
            }
          }

          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            if (eventName === 'token') {
              onToken(data.text);
            } else if (eventName === 'issues') {
              onIssues(data);
            } else if (eventName === 'complete') {
              onComplete(data);
            } else if (eventName === 'error') {
              onError(data.message || 'Unknown error');
            }
          } catch (e) {
            console.error('Failed to parse stream event JSON:', e);
          }
        }
      }

    } catch (err) {
      if (!cancelled) {
        console.error('Stream reader error:', err);
        onError('Connection lost — check the backend is running.');
      }
    }
  })();

  // Return a cancel function
  return () => {
    cancelled = true;
    if (reader) {
      reader.cancel().catch(() => {});
    }
  };
}