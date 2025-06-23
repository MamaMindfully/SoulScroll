const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from Vite's dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Service worker direct serving (Replit-specific fix)
app.get('/service-worker.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'service-worker.js'));
});

// Serve manifest icons directly
app.use('/icon-192.png', express.static(path.join(__dirname, 'dist', 'icon-192.png')));
app.use('/icon-512.png', express.static(path.join(__dirname, 'dist', 'icon-512.png')));
app.use('/icon-144x144.png', express.static(path.join(__dirname, 'dist', 'icon-144x144.png')));

// Handle SPA fallback - send index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ SoulScrollAI is running on port ${PORT}`);
});