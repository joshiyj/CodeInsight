import { Router } from 'express';
import { streamAnalysis } from '../modules/ai/groqClient.js';
import { parseIssues }    from '../modules/analysis/issueParser.js';

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
    console.log(`[Stream] Parsed ${issues.length} issues`);

    if (issues.length === 0) {
      const start = fullText.indexOf('<issues>');
      const end   = fullText.indexOf('</issues>');
      if (start !== -1) {
        console.log('[Stream] Issues block:\n', fullText.slice(start, end + 10));
      } else {
        console.log('[Stream] No <issues> block. Last 200 chars:\n', fullText.slice(-200));
      }
    }

    send('issues',   issues);
    send('complete', { issueCount: issues.length });

  } catch (err) {
    console.error('[Stream] Error:', err.message);

    let userMessage = 'Analysis failed. Check your API key and try again.';
    const raw = err.message || '';

    if (raw.includes('429') || raw.includes('Too Many Requests') || raw.includes('quota')) {
      const retryMatch = raw.match(/retry[^\d]*(\d+)[^s]*s/i) ||
                         raw.match(/retryDelay[":\s]+(\d+)/i)  ||
                         raw.match(/(\d+)[^\d]*s[^\w]/i);
      const seconds = retryMatch ? retryMatch[1] : null;
      userMessage = seconds
        ? `⏳ Rate limit hit. Please wait ${seconds}s and try again.`
        : '⏳ Rate limit hit. Please wait a moment and try again.';
    } else if (raw.includes('API key') || raw.includes('403') || raw.includes('401')) {
      userMessage = '🔑 Invalid API key. Check GROQ_API_KEY in backend/.env';
    } else if (raw.includes('503') || raw.includes('overloaded')) {
      userMessage = '🔄 AI service temporarily overloaded. Try again in a few seconds.';
    }

    send('error', { message: userMessage });
  } finally {
    res.end();
  }
});