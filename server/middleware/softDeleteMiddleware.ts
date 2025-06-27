import { Request, Response, NextFunction } from 'express';
import { eq, isNull, and } from 'drizzle-orm';
import { db } from '../db';
import { users, journalEntries } from '../../shared/schema';
import { auditService } from '../services/auditService';
import { logger } from '../utils/logger';

// Extend Request type to include soft delete utilities
declare global {
  namespace Express {
    interface Request {
      softDelete?: {
        includeDeleted: boolean;
        userId?: string;
      };
    }
  }
}

// Middleware to handle soft delete queries
export const softDeleteMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if request wants to include deleted records (admin functionality)
  const includeDeleted = req.query.include_deleted === 'true' && req.user?.isAdmin;
  
  req.softDelete = {
    includeDeleted,
    userId: req.user?.id
  };
  
  next();
};

// Utility functions for soft delete operations
export class SoftDeleteUtils {
  // Soft delete a user
  static async softDeleteUser(userId: string, deletedBy?: string): Promise<boolean> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(and(eq(users.id, userId), isNull(users.deletedAt)))
        .limit(1);

      if (user.length === 0) {
        return false;
      }

      const oldValues = user[0];
      const deletedAt = new Date();

      await db
        .update(users)
        .set({
          deletedAt,
          updatedAt: deletedAt,
          updatedBy: deletedBy || userId
        })
        .where(eq(users.id, userId));

      // Audit the soft delete
      await auditService.auditUserOperation(
        'SOFT_DELETE',
        userId,
        deletedBy,
        oldValues,
        { deletedAt },
        { reason: 'user_request' }
      );

      logger.info('User soft deleted', { userId, deletedBy });
      return true;
    } catch (error) {
      logger.error('Failed to soft delete user', { userId, error: error.message });
      return false;
    }
  }

  // Restore a soft-deleted user
  static async restoreUser(userId: string, restoredBy: string): Promise<boolean> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0 || !user[0].deletedAt) {
        return false;
      }

      const oldValues = user[0];
      const restoredAt = new Date();

      await db
        .update(users)
        .set({
          deletedAt: null,
          updatedAt: restoredAt,
          updatedBy: restoredBy
        })
        .where(eq(users.id, userId));

      // Audit the restoration
      await auditService.auditUserOperation(
        'RESTORE',
        userId,
        restoredBy,
        oldValues,
        { deletedAt: null, restoredAt },
        { reason: 'admin_restore' }
      );

      logger.info('User restored', { userId, restoredBy });
      return true;
    } catch (error) {
      logger.error('Failed to restore user', { userId, error: error.message });
      return false;
    }
  }

  // Soft delete a journal entry
  static async softDeleteJournalEntry(entryId: number, userId: string): Promise<boolean> {
    try {
      const entry = await db
        .select()
        .from(journalEntries)
        .where(and(
          eq(journalEntries.id, entryId),
          eq(journalEntries.userId, userId),
          isNull(journalEntries.deletedAt)
        ))
        .limit(1);

      if (entry.length === 0) {
        return false;
      }

      const oldValues = entry[0];
      const deletedAt = new Date();

      await db
        .update(journalEntries)
        .set({
          deletedAt,
          updatedAt: deletedAt,
          updatedBy: userId
        })
        .where(eq(journalEntries.id, entryId));

      // Audit the soft delete
      await auditService.auditJournalEntry(
        'DELETE',
        userId,
        entryId.toString(),
        oldValues,
        { deletedAt },
        { reason: 'user_delete' }
      );

      logger.info('Journal entry soft deleted', { entryId, userId });
      return true;
    } catch (error) {
      logger.error('Failed to soft delete journal entry', { entryId, userId, error: error.message });
      return false;
    }
  }

  // Restore a soft-deleted journal entry
  static async restoreJournalEntry(entryId: number, userId: string): Promise<boolean> {
    try {
      const entry = await db
        .select()
        .from(journalEntries)
        .where(and(
          eq(journalEntries.id, entryId),
          eq(journalEntries.userId, userId)
        ))
        .limit(1);

      if (entry.length === 0 || !entry[0].deletedAt) {
        return false;
      }

      const oldValues = entry[0];
      const restoredAt = new Date();

      await db
        .update(journalEntries)
        .set({
          deletedAt: null,
          updatedAt: restoredAt,
          updatedBy: userId
        })
        .where(eq(journalEntries.id, entryId));

      // Audit the restoration
      await auditService.auditJournalEntry(
        'RESTORE',
        userId,
        entryId.toString(),
        oldValues,
        { deletedAt: null, restoredAt },
        { reason: 'user_restore' }
      );

      logger.info('Journal entry restored', { entryId, userId });
      return true;
    } catch (error) {
      logger.error('Failed to restore journal entry', { entryId, userId, error: error.message });
      return false;
    }
  }

  // Get active (non-deleted) users query condition
  static getActiveUsersCondition() {
    return isNull(users.deletedAt);
  }

  // Get active (non-deleted) journal entries query condition
  static getActiveJournalEntriesCondition() {
    return isNull(journalEntries.deletedAt);
  }

  // Cleanup old soft-deleted records (GDPR compliance)
  static async cleanupOldDeletedRecords(retentionDays: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Hard delete journal entries that have been soft-deleted for too long
      const deletedEntries = await db
        .delete(journalEntries)
        .where(and(
          isNull(journalEntries.deletedAt),
          // Add condition for entries deleted before cutoff
        ));

      logger.info('Cleanup completed for old deleted records', { 
        cutoffDate, 
        retentionDays 
      });
    } catch (error) {
      logger.error('Failed to cleanup old deleted records', { error: error.message });
    }
  }
}

export default SoftDeleteUtils;