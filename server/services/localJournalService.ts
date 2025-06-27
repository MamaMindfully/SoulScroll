import { fieldEncryption } from '../utils/encryption';
import { logger } from '../utils/logger';
import auditService from './auditService';

// Local journal storage interface
export interface LocalJournalEntry {
  id: string;
  content: string;
  emotionScore: number;
  wordCount: number;
  createdAt: string;
  isLocalOnly: boolean;
  syncStatus: 'local' | 'synced' | 'pending' | 'failed';
  encryptedLocally: boolean;
}

export interface LocalJournalSync {
  userId: string;
  lastSyncAt: string;
  pendingEntries: string[];
  failedEntries: string[];
}

class LocalJournalService {
  // Convert server journal entry to local format with encryption
  public encryptForLocal(entry: any): LocalJournalEntry {
    try {
      return {
        id: entry.id,
        content: fieldEncryption.encryptField(entry.content || ''),
        emotionScore: entry.emotionScore || 5,
        wordCount: entry.wordCount || 0,
        createdAt: entry.createdAt?.toISOString() || new Date().toISOString(),
        isLocalOnly: entry.isLocalOnly || false,
        syncStatus: 'synced',
        encryptedLocally: true
      };
    } catch (error) {
      logger.error('Failed to encrypt journal entry for local storage', {
        entryId: entry.id,
        error: error.message
      });
      throw error;
    }
  }

  // Decrypt local journal entry for server sync
  public decryptFromLocal(localEntry: LocalJournalEntry): any {
    try {
      return {
        id: localEntry.id,
        content: localEntry.encryptedLocally 
          ? fieldEncryption.decryptField(localEntry.content)
          : localEntry.content,
        emotionScore: localEntry.emotionScore,
        wordCount: localEntry.wordCount,
        createdAt: new Date(localEntry.createdAt),
        isLocalOnly: localEntry.isLocalOnly
      };
    } catch (error) {
      logger.error('Failed to decrypt local journal entry', {
        entryId: localEntry.id,
        error: error.message
      });
      throw error;
    }
  }

  // Generate sync instructions for client
  public generateSyncInstructions(userId: string): any {
    return {
      encryptionEnabled: fieldEncryption.isEncryptionEnabled(),
      syncEndpoint: '/api/journal/sync',
      conflictResolution: 'server-wins', // or 'client-wins', 'merge'
      batchSize: 10,
      instructions: {
        encryption: 'Client should encrypt sensitive fields before local storage',
        sync: 'Upload local-only entries, download server entries',
        conflicts: 'Server timestamp wins in case of conflicts',
        offline: 'Queue operations when offline, sync when online'
      }
    };
  }

  // Process sync request from client
  public async processSyncRequest(userId: string, syncData: any): Promise<any> {
    const timer = logger.withTimer('local-journal-sync');
    
    try {
      const { localEntries, lastSyncTimestamp } = syncData;
      
      // Log sync attempt
      auditService.logAuditEvent({
        userId,
        action: 'LOCAL_JOURNAL_SYNC',
        metadata: {
          localEntriesCount: localEntries?.length || 0,
          lastSyncTimestamp
        },
        severity: 'info'
      });

      // Process local entries that need to be synced to server
      const entriesToSync = (localEntries || [])
        .filter((entry: LocalJournalEntry) => 
          entry.syncStatus === 'pending' && !entry.isLocalOnly
        );

      const syncResults = {
        uploaded: 0,
        skipped: 0,
        failed: 0,
        conflicts: 0
      };

      for (const localEntry of entriesToSync) {
        try {
          const decryptedEntry = this.decryptFromLocal(localEntry);
          
          // Here you would save to your journal entries table
          // const savedEntry = await journalService.createEntry(userId, decryptedEntry);
          
          syncResults.uploaded++;
          
          logger.debug('Local journal entry synced to server', {
            userId,
            entryId: localEntry.id
          });
        } catch (error) {
          syncResults.failed++;
          logger.error('Failed to sync local journal entry', {
            userId,
            entryId: localEntry.id,
            error: error.message
          });
        }
      }

      // Get server entries that are newer than last sync
      // This would query your journal entries table
      const serverEntries: any[] = []; // Placeholder for actual query

      // Encrypt server entries for local storage
      const encryptedServerEntries = serverEntries.map(entry => 
        this.encryptForLocal(entry)
      );

      timer.end({
        uploaded: syncResults.uploaded,
        downloaded: encryptedServerEntries.length
      });

      return {
        success: true,
        syncResults,
        serverEntries: encryptedServerEntries,
        syncTimestamp: new Date().toISOString(),
        nextSyncRecommended: Date.now() + (5 * 60 * 1000) // 5 minutes
      };

    } catch (error) {
      timer.end({ error: error.message });
      logger.error('Local journal sync failed', {
        userId,
        error: error.message
      });
      
      throw error;
    }
  }

  // Validate local storage structure
  public validateLocalStorage(data: any): boolean {
    try {
      if (!data || typeof data !== 'object') {
        return false;
      }

      if (data.entries && Array.isArray(data.entries)) {
        return data.entries.every((entry: any) => 
          entry.id && 
          typeof entry.content === 'string' &&
          typeof entry.createdAt === 'string' &&
          typeof entry.isLocalOnly === 'boolean'
        );
      }

      return true;
    } catch (error) {
      logger.warn('Local storage validation failed', { error: error.message });
      return false;
    }
  }

  // Generate local storage migration script
  public generateMigrationScript(): string {
    return `
// SoulScroll Local Storage Migration Script
// Run this in browser console to migrate local journal data

(async function migrateLocalStorage() {
  console.log('Starting SoulScroll local storage migration...');
  
  try {
    // Get existing data
    const existingData = JSON.parse(localStorage.getItem('soulscroll-journals') || '[]');
    
    if (!Array.isArray(existingData) || existingData.length === 0) {
      console.log('No local journal data found to migrate');
      return;
    }
    
    // Migrate to new format
    const migratedData = existingData.map(entry => ({
      id: entry.id || 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      content: entry.content || entry.text || '',
      emotionScore: entry.emotionScore || entry.mood || 5,
      wordCount: entry.wordCount || (entry.content || '').split(' ').length,
      createdAt: entry.createdAt || entry.date || new Date().toISOString(),
      isLocalOnly: entry.isLocalOnly !== undefined ? entry.isLocalOnly : true,
      syncStatus: 'pending',
      encryptedLocally: false
    }));
    
    // Save migrated data
    localStorage.setItem('soulscroll-local-journals', JSON.stringify({
      entries: migratedData,
      version: '2.0',
      migratedAt: new Date().toISOString()
    }));
    
    // Backup old data
    localStorage.setItem('soulscroll-journals-backup', JSON.stringify(existingData));
    
    console.log(\`Migration completed: \${migratedData.length} entries migrated\`);
    console.log('Original data backed up to soulscroll-journals-backup');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
})();
`;
  }
}

export const localJournalService = new LocalJournalService();
export default localJournalService;