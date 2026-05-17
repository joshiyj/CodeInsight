// src/server.js
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { analyzeRouter } from './routes/analyze.js';
import { errorHandler } from './middleware/errorHandler.js';
import diagramRouter from './routes/diagram.js';

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173',   // Vite dev server
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '50kb' }));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/analyze', analyzeRouter);

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