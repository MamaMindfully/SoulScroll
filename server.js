import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// --- Security Middleware (Insert at the top, after "const app = express();") ---
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000'];

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// --- Example Zod validation for an endpoint ---
const entrySchema = z.object({
  content: z.string().max(10000),
  mood: z.string().optional()
});
app.post('/api/entry', (req, res) => {
  try {
    const parsed = entrySchema.parse(req.body);
    // Continue with logic
    res.status(201).json({ success: true, data: parsed });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid input', details: err.errors });
  }
});

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