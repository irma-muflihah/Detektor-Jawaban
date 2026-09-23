import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleOmrScan } from './src/server/omrHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

app.post('/api/gemini/omr-scan', (req, res) => {
  handleOmrScan(req, res);
});

app.get('/api/gemini/health', (req, res) => {
  const customKey = (req.headers['x-gemini-api-key'] as string) || (req.query.key as string);
  const hasKey = Boolean(customKey || process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasGeminiKey: hasKey,
    source: customKey ? 'client' : (process.env.GEMINI_API_KEY ? 'server' : 'none'),
  });
});

// Serve production frontend assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback compatible with Express 5 / path-to-regexp v8
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DEJAWAB server listening on http://0.0.0.0:${PORT}`);
  });
}

export default app;
