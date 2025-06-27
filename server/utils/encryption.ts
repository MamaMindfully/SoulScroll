import crypto from 'crypto';
import { logger } from './logger';

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const FIELD_ENCRYPTION_KEY = process.env.FIELD_ENCRYPTION_KEY;

// Validate encryption key on startup
if (!FIELD_ENCRYPTION_KEY) {
  logger.warn('FIELD_ENCRYPTION_KEY not configured - field encryption disabled');
} else if (Buffer.from(FIELD_ENCRYPTION_KEY, 'hex').length !== 32) {
  logger.error('FIELD_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  throw new Error('Invalid encryption key length');
}

export class FieldEncryption {
  private static instance: FieldEncryption;
  private encryptionEnabled: boolean;
  private key: Buffer | null;

  private constructor() {
    this.encryptionEnabled = !!FIELD_ENCRYPTION_KEY;
    this.key = FIELD_ENCRYPTION_KEY ? Buffer.from(FIELD_ENCRYPTION_KEY, 'hex') : null;
    
    if (this.encryptionEnabled) {
      logger.info('Field encryption initialized');
    } else {
      logger.warn('Field encryption disabled - sensitive data will be stored as plaintext');
    }
  }

  public static getInstance(): FieldEncryption {
    if (!FieldEncryption.instance) {
      FieldEncryption.instance = new FieldEncryption();
    }
    return FieldEncryption.instance;
  }

  // Encrypt a field value
  public encryptField(plaintext: string): string {
    if (!this.encryptionEnabled || !this.key) {
      // Return plaintext if encryption is disabled
      return plaintext;
    }

    if (!plaintext || typeof plaintext !== 'string') {
      return plaintext;
    }

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return format: iv:encrypted_data
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      logger.error('Field encryption failed', { error: error.message });
      throw new Error('Failed to encrypt field');
    }
  }

  // Decrypt a field value
  public decryptField(encryptedField: string): string {
    if (!this.encryptionEnabled || !this.key) {
      // Return as-is if encryption is disabled
      return encryptedField;
    }

    if (!encryptedField || typeof encryptedField !== 'string') {
      return encryptedField;
    }

    // Check if the field is already decrypted (doesn't contain ':')
    if (!encryptedField.includes(':')) {
      return encryptedField;
    }

    try {
      const parts = encryptedField.split(':');
      if (parts.length !== 2) {
        logger.warn('Invalid encrypted field format, returning as plaintext');
        return encryptedField;
      }

      const [ivHex, encryptedData] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const encrypted = Buffer.from(encryptedData, 'hex');
      
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Field decryption failed', { error: error.message });
      // Return original field if decryption fails (might be legacy plaintext)
      return encryptedField;
    }
  }

  // Encrypt multiple fields in an object
  public encryptFields(obj: any, fieldNames: string[]): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const encrypted = { ...obj };
    
    for (const fieldName of fieldNames) {
      if (encrypted[fieldName] && typeof encrypted[fieldName] === 'string') {
        encrypted[fieldName] = this.encryptField(encrypted[fieldName]);
      }
    }
    
    return encrypted;
  }

  // Decrypt multiple fields in an object
  public decryptFields(obj: any, fieldNames: string[]): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const decrypted = { ...obj };
    
    for (const fieldName of fieldNames) {
      if (decrypted[fieldName] && typeof decrypted[fieldName] === 'string') {
        decrypted[fieldName] = this.decryptField(decrypted[fieldName]);
      }
    }
    
    return decrypted;
  }

  // Check if encryption is enabled
  public isEncryptionEnabled(): boolean {
    return this.encryptionEnabled;
  }

  // Generate a new encryption key (for setup/rotation)
  public static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Migrate plaintext fields to encrypted (one-time operation)
  public async migrateField(plaintext: string): Promise<string> {
    if (!this.encryptionEnabled) {
      return plaintext;
    }

    // Check if already encrypted
    if (plaintext.includes(':') && plaintext.split(':').length === 2) {
      try {
        // Try to decrypt to verify it's encrypted
        this.decryptField(plaintext);
        return plaintext; // Already encrypted
      } catch {
        // Not encrypted, proceed with encryption
      }
    }

    return this.encryptField(plaintext);
  }
}

// Export singleton instance
export const fieldEncryption = FieldEncryption.getInstance();

// Convenience functions
export const encryptField = (plaintext: string): string => {
  return fieldEncryption.encryptField(plaintext);
};

export const decryptField = (encryptedField: string): string => {
  return fieldEncryption.decryptField(encryptedField);
};

export const encryptFields = (obj: any, fieldNames: string[]): any => {
  return fieldEncryption.encryptFields(obj, fieldNames);
};

export const decryptFields = (obj: any, fieldNames: string[]): any => {
  return fieldEncryption.decryptFields(obj, fieldNames);
};

export default fieldEncryption;