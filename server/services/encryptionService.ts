import crypto from 'crypto';
import { logger } from '../utils/logger';

interface EncryptionResult {
  encrypted: string;
  iv: string;
  keyId: string;
}

interface DecryptionInput {
  encrypted: string;
  iv: string;
  keyId: string;
}

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  
  // Get encryption key from environment or key management system
  private getEncryptionKey(keyId?: string): Buffer {
    // In production, this would integrate with AWS KMS, Azure Key Vault, etc.
    const keyEnvVar = keyId ? `FIELD_ENCRYPTION_KEY_${keyId}` : 'FIELD_ENCRYPTION_KEY';
    const keyHex = process.env[keyEnvVar] || process.env.FIELD_ENCRYPTION_KEY;
    
    if (!keyHex) {
      throw new Error('Encryption key not configured');
    }
    
    // Ensure key is the correct length
    const key = Buffer.from(keyHex, 'hex');
    if (key.length !== this.keyLength) {
      throw new Error(`Invalid key length. Expected ${this.keyLength} bytes, got ${key.length}`);
    }
    
    return key;
  }

  // Encrypt sensitive field data
  async encryptField(plaintext: string, keyId?: string): Promise<EncryptionResult> {
    try {
      const key = this.getEncryptionKey(keyId);
      const iv = crypto.randomBytes(16); // 128-bit IV for GCM
      
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from('soulscroll-field-encryption')); // Additional authenticated data
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine encrypted data with auth tag
      const encryptedWithTag = encrypted + authTag.toString('hex');
      
      return {
        encrypted: encryptedWithTag,
        iv: iv.toString('hex'),
        keyId: keyId || 'default'
      };
    } catch (error) {
      logger.error('Field encryption failed', { error: error.message });
      throw new Error('Encryption failed');
    }
  }

  // Decrypt sensitive field data
  async decryptField(input: DecryptionInput): Promise<string> {
    try {
      const key = this.getEncryptionKey(input.keyId);
      const iv = Buffer.from(input.iv, 'hex');
      
      // Split encrypted data and auth tag
      const encryptedData = input.encrypted.slice(0, -32); // Remove last 32 hex chars (16 bytes)
      const authTag = Buffer.from(input.encrypted.slice(-32), 'hex');
      
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(Buffer.from('soulscroll-field-encryption'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Field decryption failed', { error: error.message, keyId: input.keyId });
      throw new Error('Decryption failed');
    }
  }

  // Encrypt journal content with metadata
  async encryptJournalContent(content: string, userId: string): Promise<EncryptionResult> {
    try {
      // Add metadata for additional security
      const metadata = {
        userId,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      const contentWithMetadata = JSON.stringify({
        content,
        metadata
      });
      
      return await this.encryptField(contentWithMetadata, 'journal');
    } catch (error) {
      logger.error('Journal content encryption failed', { userId, error: error.message });
      throw error;
    }
  }

  // Decrypt journal content and verify metadata
  async decryptJournalContent(input: DecryptionInput, expectedUserId: string): Promise<string> {
    try {
      const decryptedWithMetadata = await this.decryptField(input);
      const parsed = JSON.parse(decryptedWithMetadata);
      
      // Verify metadata
      if (parsed.metadata?.userId !== expectedUserId) {
        throw new Error('Content ownership verification failed');
      }
      
      return parsed.content;
    } catch (error) {
      logger.error('Journal content decryption failed', { 
        expectedUserId, 
        error: error.message 
      });
      throw error;
    }
  }

  // Generate content hash for integrity verification
  generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // Verify content integrity
  verifyContentIntegrity(content: string, expectedHash: string): boolean {
    const actualHash = this.generateContentHash(content);
    return actualHash === expectedHash;
  }

  // Generate secure random token
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Key rotation support
  async rotateEncryptionKey(oldKeyId: string, newKeyId: string): Promise<void> {
    // This would be implemented to re-encrypt data with new keys
    logger.info('Key rotation initiated', { oldKeyId, newKeyId });
    // Implementation would depend on your key management strategy
  }
}

export const encryptionService = new EncryptionService();
export default encryptionService;