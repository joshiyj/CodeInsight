// src/middleware/rateLimiter.js
/**
 * Per-IP rate limits for each feature.
 *
 * Review    : 2 req/min, 3 req/day
 * Simulation: 2 req/min, 2 req/day
 * Flowchart : 2 req/min, 3 req/day
 *
 * Two limiters are composed per route — both must pass.
 * In-memory store is used (no Redis needed for a single-process server).
 */
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// ─── helpers ────────────────────────────────────────────────────────────────

function minutes(n) { return n * 60 * 1000; }
function hours(n)   { return n * 60 * 60 * 1000; }

function make(windowMs, max, message) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders:   false,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    handler: (_req, res) => res.status(429).json({ error: message }),
  });
}

// ─── Review (Analyze) ────────────────────────────────────────────────────────
export const reviewMinuteLimiter = make(
  minutes(1), 2,
  'Too many review requests — maximum 2 per minute. Please wait before retrying.'
);
export const reviewDayLimiter = make(
  hours(24), 3,
  'Daily review limit reached — maximum 3 reviews per day. Try again tomorrow.'
);

// ─── Execution Simulation ───────────────────────────────────────────────────
export const executeMinuteLimiter = make(
  minutes(1), 2,
  'Too many simulation requests — maximum 2 per minute. Please wait before retrying.'
);
export const executeDayLimiter = make(
  hours(24), 2,
  'Daily simulation limit reached — maximum 2 simulations per day. Try again tomorrow.'
);

// ─── Flowchart (Diagram) ─────────────────────────────────────────────────────
export const diagramMinuteLimiter = make(
  minutes(1), 2,
  'Too many diagram requests — maximum 2 per minute. Please wait before retrying.'
);
export const diagramDayLimiter = make(
  hours(24), 3,
  'Daily diagram limit reached — maximum 3 diagrams per day. Try again tomorrow.'
);
