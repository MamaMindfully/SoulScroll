import { Router, Request, Response } from "express";
import { eq, and, isNull } from "drizzle-orm";
import { requireAdmin } from "../middleware/isPremium";
import { db } from "../db";
import { users, journalEntries } from "../../shared/schema";
import { auditService } from "../services/auditService";
import { encryptionService } from "../services/encryptionService";
import { SoftDeleteUtils } from "../middleware/softDeleteMiddleware";
import { logger } from "../utils/logger";

const router = Router();

// Get user's data privacy dashboard
router.get('/privacy/dashboard', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get user's privacy settings and data overview
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Count active journal entries
    const entryCount = await db
      .select({ count: journalEntries.id })
      .from(journalEntries)
      .where(and(
        eq(journalEntries.userId, userId),
        isNull(journalEntries.deletedAt)
      ));

    // Get recent audit trail
    const auditTrail = await auditService.getUserAuditTrail(userId, 10);

    const dashboard = {
      user: {
        id: user[0].id,
        email: user[0].email,
        createdAt: user[0].createdAt,
        privacyLevel: user[0].privacyLevel,
        accountType: user[0].accountType,
        lastLoginAt: user[0].lastLoginAt
      },
      dataOverview: {
        journalEntries: entryCount.length,
        dataRetentionPeriod: '7 years', // Default
        encryptionStatus: user[0].encryptionKeyId ? 'enabled' : 'standard'
      },
      recentActivity: auditTrail.slice(0, 5)
    };

    res.json(dashboard);
  } catch (error) {
    logger.error('Error fetching privacy dashboard', { 
      userId: req.user?.id, 
      error: error.message 
    });
    res.status(500).json({ error: 'Failed to fetch privacy dashboard' });
  }
});

// Request data export (GDPR Article 20)
router.post('/privacy/export', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get all user data
    const userData = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    const journalData = await db
      .select()
      .from(journalEntries)
      .where(and(
        eq(journalEntries.userId, userId),
        isNull(journalEntries.deletedAt)
      ));

    // Decrypt encrypted content if needed
    const decryptedEntries = await Promise.all(
      journalData.map(async (entry) => {
        if (entry.encryptedContent) {
          try {
            const decryptedContent = await encryptionService.decryptJournalContent(
              {
                encrypted: entry.encryptedContent,
                iv: entry.contentHash, // Assuming IV is stored here
                keyId: 'journal'
              },
              userId
            );
            return { ...entry, content: decryptedContent, encryptedContent: undefined };
          } catch (error) {
            logger.warn('Failed to decrypt entry for export', { entryId: entry.id });
            return entry;
          }
        }
        return entry;
      })
    );

    const exportData = {
      exportDate: new Date().toISOString(),
      user: userData[0],
      journalEntries: decryptedEntries,
      metadata: {
        format: 'JSON',
        version: '1.0',
        totalEntries: decryptedEntries.length
      }
    };

    // Log the export request
    await auditService.logAuditEvent({
      userId,
      action: 'DATA_EXPORT',
      metadata: {
        entriesExported: decryptedEntries.length,
        exportFormat: 'JSON'
      },
      severity: 'info'
    });

    // In production, you might want to generate a downloadable file
    // and send a download link instead of returning data directly
    res.json(exportData);
  } catch (error) {
    logger.error('Error exporting user data', { 
      userId: req.user?.id, 
      error: error.message 
    });
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Request account deletion (GDPR Article 17)
router.post('/privacy/delete-account', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { confirmDeletion, reason } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!confirmDeletion) {
      return res.status(400).json({ 
        error: 'Account deletion must be explicitly confirmed',
        required: 'confirmDeletion: true'
      });
    }

    // Soft delete the user account
    const success = await SoftDeleteUtils.softDeleteUser(userId, userId);
    
    if (!success) {
      return res.status(400).json({ error: 'Account deletion failed' });
    }

    // Log the deletion request
    await auditService.logAuditEvent({
      userId,
      action: 'ACCOUNT_DELETION_REQUEST',
      metadata: {
        reason: reason || 'user_request',
        confirmationProvided: confirmDeletion
      },
      severity: 'warning'
    });

    res.json({
      message: 'Account deletion initiated',
      deletionDate: new Date().toISOString(),
      recoveryPeriod: '30 days',
      note: 'Your account has been deactivated and will be permanently deleted after 30 days. Contact support to recover your account within this period.'
    });
  } catch (error) {
    logger.error('Error processing account deletion', { 
      userId: req.user?.id, 
      error: error.message 
    });
    res.status(500).json({ error: 'Failed to process account deletion' });
  }
});

// Update privacy settings
router.put('/privacy/settings', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { privacyLevel, encryptionLevel } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const validPrivacyLevels = ['standard', 'enhanced', 'maximum'];
    if (privacyLevel && !validPrivacyLevels.includes(privacyLevel)) {
      return res.status(400).json({ 
        error: 'Invalid privacy level',
        valid: validPrivacyLevels
      });
    }

    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: userId
    };

    if (privacyLevel) {
      updateData.privacyLevel = privacyLevel;
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));

    // Log the privacy settings update
    await auditService.logAuditEvent({
      userId,
      action: 'PRIVACY_SETTINGS_UPDATE',
      metadata: {
        newPrivacyLevel: privacyLevel,
        newEncryptionLevel: encryptionLevel
      },
      severity: 'info'
    });

    res.json({
      message: 'Privacy settings updated',
      updatedAt: updateData.updatedAt
    });
  } catch (error) {
    logger.error('Error updating privacy settings', { 
      userId: req.user?.id, 
      error: error.message 
    });
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

// Admin: View audit logs
router.get('/admin/audit-logs', isAuthenticated, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, limit = 100, action } = req.query;
    
    let query = db.select().from(auditService.auditLogs);
    
    if (userId) {
      query = query.where(eq(auditService.auditLogs.userId, userId as string));
    }
    
    if (action) {
      query = query.where(eq(auditService.auditLogs.action, action as string));
    }
    
    const logs = await query
      .orderBy(auditService.auditLogs.timestamp)
      .limit(parseInt(limit as string));

    res.json({
      logs,
      total: logs.length,
      filters: { userId, action, limit }
    });
  } catch (error) {
    logger.error('Error fetching audit logs', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;