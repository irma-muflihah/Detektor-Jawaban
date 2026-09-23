import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleOmrScan } from './src/server/omrHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parser
app.use(express.json({ limit: '50mb' }));

// Health check endpoints for Cloud Run startup & liveness probes
app.get(['/health', '/_health', '/_healthz', '/api/health'], (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Gemini health check endpoint
app.get('/api/gemini/health', (req, res) => {
  const customKey = (req.headers['x-gemini-api-key'] as string) || (req.query.key as string);
  const hasKey = Boolean(customKey || process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    hasGeminiKey: hasKey,
    source: customKey ? 'client' : (process.env.GEMINI_API_KEY ? 'server' : 'none'),
  });
});

// Gemini OMR scan endpoint
app.post('/api/gemini/omr-scan', (req, res) => {
  handleOmrScan(req, res);
});

// Serve production frontend assets from dist directory
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Fallback HTML page if dist/index.html is ever missing
const fallbackHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DEJAWAB - Detektor Jawaban LJK</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; text-align: center; }
    .card { background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 440px; }
    h1 { color: #1565c0; margin-bottom: 0.5rem; font-size: 1.5rem; }
    p { color: #64748b; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>DEJAWAB</h1>
    <p>Aplikasi sedang menginisialisasi modul antarmuka...</p>
    <p><small>Silakan muat ulang peramban dalam beberapa detik.</small></p>
  </div>
</body>
</html>`;

// SPA Fallback: send index.html or fallback HTML (Always returns 200 for health probes)
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath, (err) => {
      if (err && !res.headersSent) {
        res.status(200).send(fallbackHtml);
      }
    });
  } else {
    res.status(200).send(fallbackHtml);
  }
});

// Global error handler so Express never crashes
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal Server Error', message: err?.message || String(err) });
  }
});

// Start listening if not running on Vercel
if (!process.env.VERCEL) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`DEJAWAB server listening on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error('Server listen error:', err);
  });
}

export default app;
