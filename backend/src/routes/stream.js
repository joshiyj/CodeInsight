import { Router } from 'express';
import { streamAnalysis } from '../modules/ai/groqClient.js';
import { parseIssues }    from '../modules/analysis/issueParser.js';
import { formatGroqError } from '../utils/errorUtils.js';

export const streamRouter = Router();

const ISSUES_TAG  = '<issues>';
const LOOKAHEAD   = ISSUES_TAG.length; // hold back 8 chars to catch split-chunk leak

streamRouter.get('/', async (req, res) => {
  const { code, language } = req.query;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  const send = (event, data) =>
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    const stream = await streamAnalysis(code, language);

    let fullText = '';
    let sentUpTo = 0;

    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content;
      if (!text) continue;
      fullText += text;

      const issuesStart = fullText.indexOf(ISSUES_TAG);

      if (issuesStart === -1) {
        // <issues> not yet seen — hold back LOOKAHEAD chars to avoid partial-tag leak
        const safeUpTo = Math.max(sentUpTo, fullText.length - LOOKAHEAD);
        if (sentUpTo < safeUpTo) {
          send('token', { text: fullText.slice(sentUpTo, safeUpTo) });
          sentUpTo = safeUpTo;
        }
      } else if (sentUpTo < issuesStart) {
        // <issues> found — flush display portion cleanly and stop emitting tokens
        send('token', { text: fullText.slice(sentUpTo, issuesStart) });
        sentUpTo = issuesStart;
      }
      // After <issues> found: accumulate silently for parsing — never forward
    }

    // Stream ended — flush any buffered display text that didn't get sent
    const finalIssuesStart = fullText.indexOf(ISSUES_TAG);
    const finalDisplayUpTo = finalIssuesStart === -1 ? fullText.length : finalIssuesStart;
    if (sentUpTo < finalDisplayUpTo) {
      send('token', { text: fullText.slice(sentUpTo, finalDisplayUpTo) });
    }

    // Parse and send structured issues
    const issues = parseIssues(fullText);

    send('issues',   issues);
    send('complete', { issueCount: issues.length });

  } catch (err) {
    console.error('[Stream] Error:', err.message);
    const userMessage = formatGroqError(err, 'Analysis failed. Check your API key and try again.');
    send('error', { message: userMessage });
  } finally {
    res.end();
  }
});