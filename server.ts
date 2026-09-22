import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleOmrScan } from './src/server/omrHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

app.post('/api/gemini/omr-scan', (req, res) => {
  handleOmrScan(req, res);
});

app.get('/api/gemini/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Serve production frontend assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DEJAWAB server listening on http://0.0.0.0:${PORT}`);
});
