import { eq } from "drizzle-orm";
import { db } from "../db";
import { auditLogs, securityEvents, dataRetentionLogs } from "../../shared/auditSchema";
import { logger } from "../utils/logger";

interface AuditLogEntry {
  userId?: string;
  action: string;
  tableName?: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  source?: 'app' | 'api' | 'admin' | 'system';
  metadata?: any;
}

interface SecurityEventEntry {
  userId?: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  blocked?: boolean;
  ruleTriggered?: string;
  metadata?: any;
}

class AuditService {
  // Log general audit events
  async logAuditEvent(entry: AuditLogEntry): Promise<void> {
    try {
      await db.insert(auditLogs).values({
        userId: entry.userId,
        action: entry.action,
        tableName: entry.tableName,
        recordId: entry.recordId,
        oldValues: entry.oldValues,
        newValues: entry.newValues,
        userAgent: entry.userAgent,
        ipAddress: entry.ipAddress,
        sessionId: entry.sessionId,
        severity: entry.severity || 'info',
        source: entry.source || 'app',
        metadata: entry.metadata,
      });

      logger.info('Audit event logged', {
        userId: entry.userId,
        action: entry.action,
        tableName: entry.tableName,
        severity: entry.severity
      });
    } catch (error) {
      logger.error('Failed to log audit event', { error: error.message, entry });
    }
  }

  // Log security events
  async logSecurityEvent(entry: SecurityEventEntry): Promise<void> {
    try {
      await db.insert(securityEvents).values({
        userId: entry.userId,
        eventType: entry.eventType,
        severity: entry.severity,
        description: entry.description,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        requestPath: entry.requestPath,
        blocked: entry.blocked || false,
        ruleTriggered: entry.ruleTriggered,
        metadata: entry.metadata,
      });

      // Log critical security events to application logs as well
      if (entry.severity === 'CRITICAL' || entry.severity === 'HIGH') {
        logger.warn('Security event detected', {
          userId: entry.userId,
          eventType: entry.eventType,
          severity: entry.severity,
          ipAddress: entry.ipAddress
        });
      }
    } catch (error) {
      logger.error('Failed to log security event', { error: error.message, entry });
    }
  }

  // Log data retention actions
  async logDataRetention(
    userId: string,
    dataType: string,
    action: string,
    recordCount: number,
    reason: string,
    executedBy: string,
    metadata?: any
  ): Promise<void> {
    try {
      const verificationHash = this.generateVerificationHash(userId, dataType, action, recordCount);
      
      await db.insert(dataRetentionLogs).values({
        userId,
        dataType,
        action,
        recordCount,
        reason,
        executedBy,
        verificationHash,
        metadata,
      });

      logger.info('Data retention action logged', {
        userId,
        dataType,
        action,
        recordCount,
        reason
      });
    } catch (error) {
      logger.error('Failed to log data retention action', { error: error.message });
    }
  }

  // Audit journal entry operations
  async auditJournalEntry(
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW',
    userId: string,
    entryId: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ): Promise<void> {
    await this.logAuditEvent({
      userId,
      action,
      tableName: 'journal_entries',
      recordId: entryId,
      oldValues,
      newValues,
      metadata,
      severity: action === 'DELETE' ? 'warning' : 'info'
    });
  }

  // Audit user operations
  async auditUserOperation(
    action: string,
    userId: string,
    operatorId?: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ): Promise<void> {
    await this.logAuditEvent({
      userId: operatorId, // Who performed the action
      action,
      tableName: 'users',
      recordId: userId, // Which user was affected
      oldValues,
      newValues,
      metadata,
      severity: action.includes('DELETE') ? 'warning' : 'info'
    });
  }

  // Audit premium operations
  async auditPremiumOperation(
    action: string,
    userId: string,
    subscriptionData?: any,
    metadata?: any
  ): Promise<void> {
    await this.logAuditEvent({
      userId,
      action,
      tableName: 'users',
      recordId: userId,
      newValues: subscriptionData,
      metadata,
      severity: 'info',
      source: 'api'
    });
  }

  // Generate verification hash for data integrity
  private generateVerificationHash(
    userId: string,
    dataType: string,
    action: string,
    recordCount: number
  ): string {
    const crypto = require('crypto');
    const data = `${userId}:${dataType}:${action}:${recordCount}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Get audit trail for a user
  async getUserAuditTrail(userId: string, limit: number = 100) {
    try {
      return await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.userId, userId))
        .orderBy(auditLogs.timestamp)
        .limit(limit);
    } catch (error) {
      logger.error('Failed to retrieve user audit trail', { userId, error: error.message });
      return [];
    }
  }

  // Get security events for a user
  async getUserSecurityEvents(userId: string, limit: number = 50) {
    try {
      return await db
        .select()
        .from(securityEvents)
        .where(eq(securityEvents.userId, userId))
        .orderBy(securityEvents.timestamp)
        .limit(limit);
    } catch (error) {
      logger.error('Failed to retrieve user security events', { userId, error: error.message });
      return [];
    }
  }
}

export const auditService = new AuditService();
export default auditService;