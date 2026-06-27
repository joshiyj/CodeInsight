// src/server.js
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { analyzeRouter } from './routes/analyze.js';
import { errorHandler } from './middleware/errorHandler.js';
import diagramRouter from './routes/diagram.js';
import executeRouter from './routes/execute.js';
import {
  reviewMinuteLimiter,  reviewDayLimiter,
  executeMinuteLimiter, executeDayLimiter,
  diagramMinuteLimiter, diagramDayLimiter,
} from './middleware/rateLimiter.js';

const app = express();

// ── Trust proxy — required for correct req.ip behind Render/Railway/Vercel ──
app.set('trust proxy', true);

// ── Middleware ────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'https://code-insight-beta.vercel.app',
];
if (config.corsOrigin) {
  allowedOrigins.push(config.corsOrigin);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || config.isDev) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '50kb' }));

// ── Routes ────────────────────────────────────────────────────
// Review: day checked first so daily message takes priority over per-minute message
app.use('/api/analyze', reviewDayLimiter, reviewMinuteLimiter, analyzeRouter);

// Simulation: day checked first so daily message takes priority over per-minute message
app.use('/api/execute', executeDayLimiter, executeMinuteLimiter, executeRouter);

// Flowchart: day checked first so daily message takes priority over per-minute message
app.use('/api/diagram', diagramDayLimiter, diagramMinuteLimiter, diagramRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: config.nodeEnv });
});

// ── Error Handler (must be after ALL routes) ──────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`✅ CodeInsight backend running on http://localhost:${config.port}`);
});