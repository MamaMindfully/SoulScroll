import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from Vite's dist/public folder with proper headers
app.use(express.static(path.join(__dirname, 'dist', 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Service worker direct serving (Replit-specific fix)
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-cache');
  // Try multiple possible locations for service worker
  const swPaths = [
    path.join(__dirname, 'dist', 'public', 'service-worker.js'),
    path.join(__dirname, 'client', 'public', 'service-worker.js'),
    path.join(__dirname, 'dist', 'service-worker.js')
  ];
  
  let serviceWorkerPath = null;
  for (const swPath of swPaths) {
    if (require('fs').existsSync(swPath)) {
      serviceWorkerPath = swPath;
      break;
    }
  }
  
  if (serviceWorkerPath) {
    res.sendFile(serviceWorkerPath);
  } else {
    if (err) {
      console.log('Service worker not found, serving fallback');
      res.send(`
        self.addEventListener('install', () => {
          console.log('Fallback Service Worker installed');
          self.skipWaiting();
        });
        self.addEventListener('activate', () => {
          console.log('Fallback Service Worker activated');
          return self.clients.claim();
        });
        self.addEventListener('fetch', (event) => {
          // Passthrough all requests
        });
      `);
    }
  });
});

// Serve manifest icons directly
app.get('/icon-192.png', (req, res) => {
  const iconPath = path.join(__dirname, 'client', 'public', 'icon-192.png');
  res.sendFile(iconPath);
});
app.get('/icon-512.png', (req, res) => {
  const iconPath = path.join(__dirname, 'client', 'public', 'icon-512.png');
  res.sendFile(iconPath);
});
app.get('/icon-144x144.png', (req, res) => {
  const iconPath = path.join(__dirname, 'client', 'public', 'icon-144x144.png');
  res.sendFile(iconPath);
});

// Serve manifest
app.get('/manifest.json', (req, res) => {
  const manifestPath = path.join(__dirname, 'client', 'public', 'manifest.json');
  res.sendFile(manifestPath);
});

// Handle SPA fallback - send index.html for all other routes
app.get('*', (req, res) => {
  // Try to serve built index.html first
  const builtIndexPath = path.join(__dirname, 'dist', 'public', 'index.html');
  const devIndexPath = path.join(__dirname, 'client', 'index.html');
  
  if (require('fs').existsSync(builtIndexPath)) {
    res.sendFile(builtIndexPath);
  } else if (require('fs').existsSync(devIndexPath)) {
    res.sendFile(devIndexPath);
  } else {
    res.status(404).send('Application not found. Please run the build command.');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ SoulScrollAI is running on port ${PORT}`);
});