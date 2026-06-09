// src/server.js
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { analyzeRouter } from './routes/analyze.js';
import { errorHandler } from './middleware/errorHandler.js';
import diagramRouter from './routes/diagram.js';
import executeRouter from './routes/execute.js';

const app = express();

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
app.use('/api/analyze', analyzeRouter);

app.use('/api/execute', executeRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: config.nodeEnv });
});

// ── Error Handler (must be last) ──────────────────────────────
app.use(errorHandler);

// ── Mermaid Diagram Router ──────────────────────────────────────────────
app.use('/api/diagram', diagramRouter);

// ── Start ─────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`✅ CodeInsight backend running on http://localhost:${config.port}`);
});