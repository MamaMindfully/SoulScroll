import { traceManager } from './traceId';

// Local journal entry interface
export interface LocalJournalEntry {
  id: string;
  content: string;
  emotionScore: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  isLocalOnly: boolean;
  syncStatus: 'local' | 'synced' | 'pending' | 'failed';
  encryptedLocally: boolean;
  tags?: string[];
}

export interface LocalJournalData {
  entries: LocalJournalEntry[];
  version: string;
  lastSyncAt?: string;
  syncToken?: string;
  encryptionEnabled: boolean;
}

class LocalJournalStorage {
  private storageKey = 'soulscroll-local-journals';
  private encryptionKey: string | null = null;

  constructor() {
    this.initializeStorage();
    this.setupPeriodicSync();
  }

  // Initialize local storage with default structure
  private initializeStorage(): void {
    try {
      const existing = localStorage.getItem(this.storageKey);
      
      if (!existing) {
        const defaultData: LocalJournalData = {
          entries: [],
          version: '2.0',
          encryptionEnabled: false
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(defaultData));
        console.log('Initialized local journal storage');
      } else {
        // Validate and migrate if necessary
        this.validateAndMigrate(JSON.parse(existing));
      }
    } catch (error) {
      console.error('Failed to initialize local storage:', error);
    }
  }

  // Validate and migrate old storage format
  private validateAndMigrate(data: any): void {
    try {
      if (!data.version || data.version < '2.0') {
        console.log('Migrating local journal storage to v2.0...');
        
        // Handle legacy format
        const entries = Array.isArray(data) ? data : (data.entries || []);
        
        const migratedData: LocalJournalData = {
          entries: entries.map((entry: any) => ({
            id: entry.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            content: entry.content || entry.text || '',
            emotionScore: entry.emotionScore || entry.mood || 5,
            wordCount: entry.wordCount || this.countWords(entry.content || entry.text || ''),
            createdAt: entry.createdAt || entry.date || new Date().toISOString(),
            updatedAt: entry.updatedAt || entry.createdAt || entry.date || new Date().toISOString(),
            isLocalOnly: entry.isLocalOnly !== undefined ? entry.isLocalOnly : true,
            syncStatus: entry.syncStatus || 'pending',
            encryptedLocally: entry.encryptedLocally || false,
            tags: entry.tags || []
          })),
          version: '2.0',
          lastSyncAt: data.lastSyncAt,
          encryptionEnabled: data.encryptionEnabled || false
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(migratedData));
        
        // Backup old format
        localStorage.setItem(`${this.storageKey}-backup`, JSON.stringify(data));
        
        console.log(`Migration completed: ${migratedData.entries.length} entries migrated`);
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  // Get all local journal data
  public getLocalData(): LocalJournalData {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {
        entries: [],
        version: '2.0',
        encryptionEnabled: false
      };
    } catch (error) {
      console.error('Failed to get local data:', error);
      return {
        entries: [],
        version: '2.0',
        encryptionEnabled: false
      };
    }
  }

  // Save journal data to local storage
  private saveLocalData(data: LocalJournalData): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save local data:', error);
      throw new Error('Local storage save failed');
    }
  }

  // Add new journal entry
  public addEntry(entry: Omit<LocalJournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): LocalJournalEntry {
    const data = this.getLocalData();
    
    const newEntry: LocalJournalEntry = {
      ...entry,
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: entry.isLocalOnly ? 'local' : 'pending',
      wordCount: entry.wordCount || this.countWords(entry.content)
    };
    
    data.entries.unshift(newEntry); // Add to beginning
    this.saveLocalData(data);
    
    console.log('Added local journal entry:', newEntry.id);
    
    // Trigger sync if not local-only
    if (!newEntry.isLocalOnly) {
      this.queueForSync(newEntry.id);
    }
    
    return newEntry;
  }

  // Update existing entry
  public updateEntry(id: string, updates: Partial<LocalJournalEntry>): LocalJournalEntry | null {
    const data = this.getLocalData();
    const entryIndex = data.entries.findIndex(e => e.id === id);
    
    if (entryIndex === -1) {
      console.warn('Entry not found for update:', id);
      return null;
    }
    
    const updatedEntry = {
      ...data.entries[entryIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      syncStatus: data.entries[entryIndex].isLocalOnly ? 'local' : 'pending'
    };
    
    data.entries[entryIndex] = updatedEntry;
    this.saveLocalData(data);
    
    console.log('Updated local journal entry:', id);
    
    // Trigger sync if not local-only
    if (!updatedEntry.isLocalOnly) {
      this.queueForSync(id);
    }
    
    return updatedEntry;
  }

  // Delete entry
  public deleteEntry(id: string): boolean {
    const data = this.getLocalData();
    const initialLength = data.entries.length;
    
    data.entries = data.entries.filter(e => e.id !== id);
    
    if (data.entries.length < initialLength) {
      this.saveLocalData(data);
      console.log('Deleted local journal entry:', id);
      return true;
    }
    
    return false;
  }

  // Get entries with filtering
  public getEntries(options?: {
    localOnly?: boolean;
    syncStatus?: string;
    limit?: number;
    offset?: number;
  }): LocalJournalEntry[] {
    const data = this.getLocalData();
    let entries = data.entries;
    
    if (options?.localOnly !== undefined) {
      entries = entries.filter(e => e.isLocalOnly === options.localOnly);
    }
    
    if (options?.syncStatus) {
      entries = entries.filter(e => e.syncStatus === options.syncStatus);
    }
    
    // Sort by creation date (newest first)
    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (options?.offset) {
      entries = entries.slice(options.offset);
    }
    
    if (options?.limit) {
      entries = entries.slice(0, options.limit);
    }
    
    return entries;
  }

  // Get sync statistics
  public getSyncStats(): {
    total: number;
    local: number;
    synced: number;
    pending: number;
    failed: number;
  } {
    const entries = this.getEntries();
    
    return {
      total: entries.length,
      local: entries.filter(e => e.syncStatus === 'local').length,
      synced: entries.filter(e => e.syncStatus === 'synced').length,
      pending: entries.filter(e => e.syncStatus === 'pending').length,
      failed: entries.filter(e => e.syncStatus === 'failed').length
    };
  }

  // Queue entry for sync
  private queueForSync(entryId: string): void {
    // Update sync status
    const data = this.getLocalData();
    const entry = data.entries.find(e => e.id === entryId);
    
    if (entry && entry.syncStatus !== 'synced') {
      entry.syncStatus = 'pending';
      this.saveLocalData(data);
      
      // Trigger sync attempt
      this.attemptSync();
    }
  }

  // Attempt to sync pending entries
  public async attemptSync(): Promise<void> {
    const pendingEntries = this.getEntries({ syncStatus: 'pending' });
    
    if (pendingEntries.length === 0) {
      return;
    }
    
    try {
      const response = await traceManager.tracedFetch('/api/journal/local-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entries: pendingEntries,
          lastSyncAt: this.getLocalData().lastSyncAt
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        this.processSyncResult(result);
      } else {
        this.markSyncFailed(pendingEntries.map(e => e.id));
      }
    } catch (error) {
      console.error('Sync attempt failed:', error);
      this.markSyncFailed(pendingEntries.map(e => e.id));
    }
  }

  // Process sync result from server
  private processSyncResult(result: any): void {
    const data = this.getLocalData();
    
    // Update sync status for uploaded entries
    if (result.uploadedIds) {
      result.uploadedIds.forEach((id: string) => {
        const entry = data.entries.find(e => e.id === id);
        if (entry) {
          entry.syncStatus = 'synced';
        }
      });
    }
    
    // Add new entries from server
    if (result.serverEntries) {
      result.serverEntries.forEach((serverEntry: LocalJournalEntry) => {
        const existing = data.entries.find(e => e.id === serverEntry.id);
        if (!existing) {
          data.entries.push(serverEntry);
        }
      });
    }
    
    // Update last sync timestamp
    data.lastSyncAt = result.syncTimestamp || new Date().toISOString();
    
    this.saveLocalData(data);
    console.log('Sync completed successfully');
  }

  // Mark entries as sync failed
  private markSyncFailed(entryIds: string[]): void {
    const data = this.getLocalData();
    
    entryIds.forEach(id => {
      const entry = data.entries.find(e => e.id === id);
      if (entry) {
        entry.syncStatus = 'failed';
      }
    });
    
    this.saveLocalData(data);
  }

  // Setup periodic sync
  private setupPeriodicSync(): void {
    // Sync every 5 minutes when online
    setInterval(() => {
      if (navigator.onLine) {
        this.attemptSync();
      }
    }, 5 * 60 * 1000);
    
    // Sync when coming back online
    window.addEventListener('online', () => {
      console.log('Back online - attempting sync...');
      this.attemptSync();
    });
  }

  // Count words in text
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // Export local data
  public exportLocalData(): string {
    const data = this.getLocalData();
    return JSON.stringify(data, null, 2);
  }

  // Import local data
  public importLocalData(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData);
      
      if (this.validateImportData(importedData)) {
        this.saveLocalData(importedData);
        console.log('Local data imported successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }

  // Validate import data structure
  private validateImportData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.entries) &&
      typeof data.version === 'string' &&
      data.entries.every((entry: any) => 
        entry.id && 
        typeof entry.content === 'string' &&
        typeof entry.createdAt === 'string'
      )
    );
  }

  // Clear all local data
  public clearAllData(): void {
    localStorage.removeItem(this.storageKey);
    this.initializeStorage();
    console.log('All local journal data cleared');
  }
}

// Export singleton instance
export const localJournalStorage = new LocalJournalStorage();
export default localJournalStorage;