import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable compression for all responses
app.use(compression());

// Set strong ETags for better caching
app.set('etag', 'strong');

// 1. CRITICAL: Serve static assets FIRST!
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
    if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
    if (filePath.endsWith('.json')) res.setHeader('Content-Type', 'application/json');
  }
}));

// 2. ONLY THEN: SPA catch-all route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ SoulScroll AI running on 0.0.0.0:${PORT}`);
  console.log(`📂 Static files served from: ${path.join(__dirname, 'dist')}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});