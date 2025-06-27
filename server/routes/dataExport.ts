import { Router, Request, Response } from 'express';
import { requirePremium } from '../middleware/isPremium';
import { getUserAllData } from '../services/exportService';
import { v4 as uuidv4 } from 'uuid';
import { createGzip } from 'zlib';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import AdmZip from 'adm-zip';
import { logger } from '../utils/logger';
import auditService from '../services/auditService';

const router = Router();

// Ensure export directory exists
const EXPORT_DIR = path.join(process.cwd(), 'tmp', 'exports');
try {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
} catch (error) {
  logger.error('Failed to create export directory', { error: error.message });
}

// Helper to encrypt file with password
function encryptFile(input: Buffer, password: string): Buffer {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, 'soulscroll-salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([iv, cipher.update(input), cipher.final()]);
}

// Helper to decrypt file
function decryptFile(encryptedData: Buffer, password: string): Buffer {
  const iv = encryptedData.subarray(0, 16);
  const encrypted = encryptedData.subarray(16);
  const key = crypto.scryptSync(password, 'soulscroll-salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// Generate secure data export
router.post('/export', isAuthenticated, requirePremium, async (req: Request, res: Response) => {
  const timer = logger.withTimer('data-export-request');
  
  try {
    const userId = req.user?.id;
    const { password, includeAuditLogs = false } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Require password for export security
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ 
        error: 'Export password required (minimum 8 characters)',
        traceId: req.traceId
      });
    }

    // Get all user data
    const userData = await getUserAllData(userId, includeAuditLogs);
    
    // Create formatted JSON export
    const prettyJSON = JSON.stringify(userData, null, 2);
    
    // Create README file
    const readme = `SoulScroll AI - Personal Data Export
    
Generated: ${new Date().toISOString()}
User ID: ${userData.user.id}
Email: ${userData.user.email}

This export contains your complete SoulScroll AI data including:
- ${userData.journalEntries.length} journal entries
- ${userData.insights.length} AI insights
- ${userData.emotionalInsights.length} emotional analysis reports
- ${userData.reflectionLetters.length} reflection letters
- ${userData.subscriptions.length} subscription records
- ${userData.pushSubscriptions.length} notification preferences

Data Format: JSON (structured data format)
Privacy: All personal data is included - handle securely
Encryption: This file is encrypted with your provided password

For questions about your data:
- Privacy Policy: https://soulscroll.ai/privacy
- Support: support@soulscroll.ai
- Data Rights: https://soulscroll.ai/data-rights

To decrypt this export:
1. Use the password you provided during export
2. The file contains your complete SoulScroll AI data
3. Data is in JSON format for easy import/analysis

SoulScroll AI respects your data ownership and privacy.
`;

    // Create privacy summary
    const privacySummary = {
      totalDataPoints: userData.metadata.totalDataPoints,
      categories: {
        personalInfo: 1,
        journalEntries: userData.journalEntries.length,
        aiInsights: userData.insights.length,
        emotionalAnalytics: userData.emotionalInsights.length,
        subscriptionData: userData.subscriptions.length,
        preferences: userData.pushSubscriptions.length
      },
      sensitivityLevel: 'HIGH',
      recommendedHandling: 'Store securely, encrypt at rest, delete after use',
      gdprCompliant: true,
      ccpaCompliant: true
    };

    // Create ZIP archive
    const zipId = uuidv4();
    const zipPath = path.join(EXPORT_DIR, `export-${zipId}.zip`);
    const zip = new AdmZip();

    // Add files to ZIP
    zip.addFile('soulscroll-data.json', Buffer.from(prettyJSON, 'utf-8'));
    zip.addFile('README.txt', Buffer.from(readme, 'utf-8'));
    zip.addFile('privacy-summary.json', Buffer.from(JSON.stringify(privacySummary, null, 2), 'utf-8'));

    // Write ZIP file
    zip.writeZip(zipPath);

    // Encrypt the ZIP file
    const zipBuffer = fs.readFileSync(zipPath);
    const encryptedData = encryptFile(zipBuffer, password);
    const encryptedPath = `${zipPath}.enc`;
    fs.writeFileSync(encryptedPath, encryptedData);

    // Clean up unencrypted ZIP
    fs.unlinkSync(zipPath);

    // Set expiration (15 minutes)
    const expirationTime = 15 * 60 * 1000; // 15 minutes
    const expiresAt = Date.now() + expirationTime;
    
    setTimeout(() => {
      try {
        if (fs.existsSync(encryptedPath)) {
          fs.unlinkSync(encryptedPath);
          logger.info('Export file auto-deleted after expiration', { 
            userId, 
            exportId: zipId 
          });
        }
      } catch (error) {
        logger.error('Failed to delete expired export file', { 
          userId, 
          exportId: zipId, 
          error: error.message 
        });
      }
    }, expirationTime);

    // Log successful export
    auditService.logAuditEvent({
      userId,
      action: 'DATA_EXPORT_COMPLETED',
      metadata: {
        exportId: zipId,
        totalEntries: userData.journalEntries.length,
        totalInsights: userData.insights.length,
        includeAuditLogs,
        fileSize: encryptedData.length,
        expiresAt
      },
      severity: 'info'
    });

    logger.info('Data export generated successfully', {
      userId,
      exportId: zipId,
      fileSize: encryptedData.length,
      traceId: req.traceId,
      duration: timer.end()
    });

    res.json({
      success: true,
      exportId: zipId,
      downloadUrl: `/api/data-export/download/${path.basename(encryptedPath)}`,
      fileSize: encryptedData.length,
      expiresAt,
      expiresIn: expirationTime,
      metadata: {
        totalEntries: userData.journalEntries.length,
        totalInsights: userData.insights.length,
        exportDate: userData.metadata.exportDate
      }
    });

  } catch (error) {
    timer.end({ error: error.message });
    logger.error('Data export failed', {
      userId: req.user?.id,
      traceId: req.traceId,
      error: error.message
    });

    auditService.logAuditEvent({
      userId: req.user?.id || 'unknown',
      action: 'DATA_EXPORT_FAILED',
      metadata: {
        error: error.message,
        traceId: req.traceId
      },
      severity: 'error'
    });

    res.status(500).json({
      error: 'Failed to generate data export',
      message: 'Please try again or contact support if the problem persists',
      traceId: req.traceId
    });
  }
});

// Download encrypted export file
router.get('/download/:filename', async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(EXPORT_DIR, filename);

    // Validate filename format
    if (!filename.match(/^export-[a-f0-9-]+\.zip\.enc$/)) {
      return res.status(400).json({ error: 'Invalid filename format' });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      logger.warn('Export file not found or expired', { 
        filename, 
        traceId: req.traceId 
      });
      return res.status(404).json({ 
        error: 'Export file not found or has expired',
        message: 'Export files are automatically deleted after 15 minutes for security'
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Set download headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="soulscroll-data-export.zip.enc"');
    res.setHeader('Content-Length', stats.size.toString());
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Log download
    logger.info('Export file downloaded', {
      filename,
      fileSize: stats.size,
      traceId: req.traceId
    });

    // Clean up file after download
    fileStream.on('end', () => {
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            logger.info('Export file deleted after download', { filename });
          }
        } catch (error) {
          logger.error('Failed to delete export file after download', { 
            filename, 
            error: error.message 
          });
        }
      }, 5000); // 5 second delay to ensure download completes
    });

  } catch (error) {
    logger.error('Export download failed', {
      filename: req.params.filename,
      traceId: req.traceId,
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to download export file',
      traceId: req.traceId
    });
  }
});

// Get export status
router.get('/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get recent export activities from audit logs
    const recentExports = await auditService.getAuditEvents(userId, {
      actions: ['DATA_EXPORT_COMPLETED', 'DATA_EXPORT_FAILED'],
      limit: 5
    });

    res.json({
      success: true,
      recentExports: recentExports.map(event => ({
        action: event.action,
        timestamp: event.timestamp,
        success: event.action === 'DATA_EXPORT_COMPLETED',
        metadata: event.metadata
      })),
      exportLimits: {
        maxPerDay: 5,
        maxFileSize: '50MB',
        retentionPeriod: '15 minutes'
      }
    });

  } catch (error) {
    logger.error('Failed to get export status', {
      userId: req.user?.id,
      traceId: req.traceId,
      error: error.message
    });

    res.status(500).json({
      error: 'Failed to get export status',
      traceId: req.traceId
    });
  }
});

export default router;