// src/routes/stream.js
import { Router } from 'express';
import { streamAnalysis } from '../modules/ai/geminiClient.js';
import { parseIssues }    from '../modules/analysis/issueParser.js';

export const streamRouter = Router();

streamRouter.get('/', async (req, res) => {
  const { code, language } = req.query;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const stream = await streamAnalysis(code, language);

    let fullText      = '';
    let sentUpTo      = 0;   // how many chars we've already forwarded to the client

    for await (const chunk of stream) {
      const text = chunk.text();
      if (!text) continue;

      fullText += text;

      // Safe display boundary = everything before <issues> starts
      const issuesStart    = fullText.indexOf('<issues>');
      const displayUpTo    = issuesStart === -1 ? fullText.length : issuesStart;

      if (sentUpTo < displayUpTo) {
        const toSend = fullText.slice(sentUpTo, displayUpTo);
        send('token', { text: toSend });
        sentUpTo = displayUpTo;
      }
    }

    // Stream finished — parse the full response for structured issues
    const issues = parseIssues(fullText);
    console.log(`[Stream] Parsed ${issues.length} issues`);

    if (issues.length === 0) {
      const start   = fullText.indexOf('<issues>');
      const end     = fullText.indexOf('</issues>');
      console.log('[Stream] <issues> found at index:', start, '| </issues> at:', end);
      if (start !== -1) {
        console.log('[Stream] Issues block content:\n', fullText.slice(start, end + 10));
      } else {
        console.log('[Stream] No <issues> block found. Last 200 chars:\n', fullText.slice(-200));
      }
    }

    send('issues',   issues);
    send('complete', { issueCount: issues.length });

  } catch (err) {
    console.error('[Stream] Error:', err.message);
    send('error', { message: 'Analysis failed. Check your API key or try again.' });
  } finally {
    res.end();
  }
});