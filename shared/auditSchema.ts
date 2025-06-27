import { pgTable, serial, varchar, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { users } from "./schema";

// Audit log for tracking all significant actions
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(), // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  tableName: varchar("table_name"), // Which table was affected
  recordId: varchar("record_id"), // ID of the affected record
  oldValues: jsonb("old_values"), // Previous state (for updates/deletes)
  newValues: jsonb("new_values"), // New state (for creates/updates)
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  sessionId: varchar("session_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  severity: varchar("severity").default("info"), // info, warning, error, critical
  source: varchar("source").default("app"), // app, api, admin, system
  metadata: jsonb("metadata"), // Additional context
});

// Data retention and privacy compliance
export const dataRetentionLogs = pgTable("data_retention_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  dataType: varchar("data_type").notNull(), // journal_entries, user_data, etc.
  action: varchar("action").notNull(), // ANONYMIZE, DELETE, ARCHIVE, EXPORT
  recordCount: integer("record_count"),
  reason: varchar("reason"), // user_request, policy_compliance, retention_policy
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  executedBy: varchar("executed_by"),
  verificationHash: varchar("verification_hash"), // To verify data integrity
  metadata: jsonb("metadata"),
});

// Security events and monitoring
export const securityEvents = pgTable("security_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  eventType: varchar("event_type").notNull(), // FAILED_LOGIN, SUSPICIOUS_ACCESS, PERMISSION_VIOLATION
  severity: varchar("severity").notNull(), // LOW, MEDIUM, HIGH, CRITICAL
  description: text("description"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  requestPath: varchar("request_path"),
  blocked: boolean("blocked").default(false),
  ruleTriggered: varchar("rule_triggered"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  metadata: jsonb("metadata"),
});

// Encryption key management
export const encryptionKeys = pgTable("encryption_keys", {
  id: varchar("id").primaryKey(),
  keyVersion: integer("key_version").notNull(),
  algorithm: varchar("algorithm").default("AES-256-GCM"),
  purpose: varchar("purpose").notNull(), // field_encryption, backup_encryption, etc.
  keyHash: varchar("key_hash").notNull(), // Hash of the key for verification
  createdAt: timestamp("created_at").defaultNow().notNull(),
  rotatedAt: timestamp("rotated_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by"),
  metadata: jsonb("metadata"),
});

// User consent and privacy settings
export const userPrivacySettings = pgTable("user_privacy_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  dataProcessingConsent: boolean("data_processing_consent").default(false),
  analyticsConsent: boolean("analytics_consent").default(false),
  marketingConsent: boolean("marketing_consent").default(false),
  dataRetentionPeriod: integer("data_retention_period").default(2555), // days (7 years default)
  encryptionLevel: varchar("encryption_level").default("standard"), // standard, enhanced, maximum
  allowDataSharing: boolean("allow_data_sharing").default(false),
  allowAiProcessing: boolean("allow_ai_processing").default(true),
  consentVersion: varchar("consent_version").notNull(),
  consentDate: timestamp("consent_date").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type DataRetentionLog = typeof dataRetentionLogs.$inferSelect;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type EncryptionKey = typeof encryptionKeys.$inferSelect;
export type UserPrivacySettings = typeof userPrivacySettings.$inferSelect;