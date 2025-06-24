import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import stripeWebhook from "./stripeWebhook";
import stripeRoutes from "./routes/stripeRoutes";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { gracefulDegradation, serviceFailureHandler, detectServiceAvailability } from "./middleware/gracefulDegradation";
import { performStartupChecks } from "./utils/deploymentReadiness";
import { deploymentSafetyMiddleware, redisErrorHandler } from "./middleware/deploymentSafety";
import { initializeDeploymentSafety } from "./utils/deploymentSafety";
import { databaseErrorHandler, ensureDatabaseConnection } from "./middleware/databaseErrorHandler";

// Initialize deployment safety measures before any Redis imports
initializeDeploymentSafety();

// Initialize queue workers (will gracefully fallback if Redis unavailable)
import "./queue/journalWorker";

const app = express();

// Add comprehensive error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Never exit on Redis or database connection errors, just log them
  if (error.message && (error.message.includes('Redis') || error.message.includes('terminating connection') || error.message.includes('connection terminated'))) {
    console.warn('Connection error caught globally - continuing with fallback mode');
    return;
  }
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason: any, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Never exit on Redis or database connection errors, just log them
  if (reason?.message && (reason.message.includes('Redis') || reason.message.includes('terminating connection') || reason.message.includes('connection terminated'))) {
    console.warn('Connection rejection caught globally - continuing with fallback mode');
    return;
  }
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Add Helmet security middleware with error handling
try {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.openai.com", "https://api.stripe.com", "wss:", "ws:"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));
} catch (error) {
  console.error('Failed to initialize Helmet middleware:', error);
  // Continue without Helmet in case of issues
}

// Add deployment safety middleware
app.use(deploymentSafetyMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Detect service availability and apply graceful degradation
const services = detectServiceAvailability();
app.use(gracefulDegradation(services));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Perform deployment readiness checks
    await performStartupChecks();
    
    // Register routes with error handling
    let server;
    try {
      server = await registerRoutes(app);
      log("Routes registered successfully");
    } catch (error) {
      console.error("Failed to register routes:", error);
      // Create a basic HTTP server if route registration fails
      server = require('http').createServer(app);
    }

    // Service failure handler (before global error handler)
    app.use(serviceFailureHandler);

    // Add Redis error handler before general error handler
    app.use(redisErrorHandler);

    // Enhanced error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.error(`Error ${status}:`, message, err.stack);
      
      // Don't throw the error, just log it and respond
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });

    // Setup Vite or static serving with error handling
    try {
      if (app.get("env") === "development") {
        await setupVite(app, server);
        log("Vite development server setup complete");
      } else {
        // Enhanced static serving for Replit deployment
        const distPath = path.resolve(__dirname, "..", "dist");
        if (fs.existsSync(distPath)) {
          app.use(express.static(distPath));
          app.get('*', (req, res) => {
            res.sendFile(path.resolve(distPath, "index.html"));
          });
          log("Static file serving setup complete");
        } else {
          throw new Error(`Build directory not found: ${distPath}`);
        }
      }
    } catch (error) {
      console.error("Failed to setup frontend serving:", error);
      // Add a basic fallback route
      app.get('*', (req, res) => {
        res.status(503).json({ 
          message: "Service temporarily unavailable",
          error: "Frontend serving failed to initialize"
        });
      });
    }

    // Server startup with comprehensive error handling
    const port = 5000;
    const host = "0.0.0.0";
    
    try {
      server.listen({
        port,
        host,
        reusePort: true,
      }, () => {
        log(`Server successfully started on ${host}:${port}`);
        log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // Handle server errors
      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use`);
        } else if (error.code === 'EACCES') {
          console.error(`Permission denied to bind to port ${port}`);
        } else {
          console.error('Server error:', error);
        }
        
        // Don't exit immediately, try to handle gracefully
        setTimeout(() => {
          console.log('Attempting to restart server...');
          process.exit(1);
        }, 5000);
      });

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }

  } catch (error) {
    console.error('Critical application startup error:', error);
    process.exit(1);
  }
})().catch((error) => {
  console.error('Unhandled async error during startup:', error);
  process.exit(1);
});
