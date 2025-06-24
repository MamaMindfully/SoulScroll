import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable gzip compression for all responses
app.use(compression());

// Set strong ETags for better caching
app.set('etag', 'strong');

// Debug: Log static file serving path
console.log('Serving static files from:', path.join(__dirname, 'dist'));

// Serve static files from Vite's dist folder
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
    if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
  }
}));

// Service worker serving
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'dist', 'service-worker.js'), err => {
    if (err) {
      console.log('Service worker not found, serving fallback');
      res.send(`self.addEventListener('install',()=>{self.skipWaiting();});`);
    }
  });
});

// Manifest icons (optional, if present in /dist)
['icon-192.png', 'icon-512.png', 'icon-144x144.png'].forEach(icon => {
  app.get(`/${icon}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', icon));
  });
});

// SPA fallback: always send index.html for all unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server ONCE!
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ SoulScrollAI running on http://0.0.0.0:${PORT}`);
  console.log(`📂 Static files served from: ${path.join(__dirname, 'dist')}`);
});