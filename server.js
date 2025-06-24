import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// Manifest icons (optional, if present)
['icon-192.png', 'icon-512.png', 'icon-144x144.png'].forEach(icon => {
  app.get(`/${icon}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', icon));
  });
});

// SPA fallback: always send index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ SoulScrollAI running on port ${PORT}`);
});