interface AutoSaveOptions {
  interval?: number; // milliseconds
  minLength?: number; // minimum characters before saving
  onSave?: (content: string) => Promise<void>;
  onStatus?: (status: 'saving' | 'saved' | 'error' | 'idle') => void;
}

export class AutoSaveManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private lastSavedContent: string = '';
  private options: Required<AutoSaveOptions>;

  constructor(options: AutoSaveOptions = {}) {
    this.options = {
      interval: 20000, // 20 seconds
      minLength: 10,
      onSave: async () => {},
      onStatus: () => {},
      ...options
    };
  }

  public startAutoSave(content: string): void {
    // Clear existing timeout
    this.clearTimeout();

    // Don't save if content is too short or unchanged
    if (content.length < this.options.minLength || content === this.lastSavedContent) {
      return;
    }

    // Set new timeout
    this.timeoutId = setTimeout(() => {
      this.performSave(content);
    }, this.options.interval);
  }

  private async performSave(content: string): Promise<void> {
    try {
      this.options.onStatus('saving');
      await this.options.onSave(content);
      this.lastSavedContent = content;
      this.options.onStatus('saved');
      
      // Clear saved status after 3 seconds
      setTimeout(() => {
        this.options.onStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      this.options.onStatus('error');
      
      // Retry after 10 seconds
      setTimeout(() => {
        this.performSave(content);
      }, 10000);
    }
  }

  public forceSave(content: string): Promise<void> {
    this.clearTimeout();
    return this.performSave(content);
  }

  public stop(): void {
    this.clearTimeout();
    this.options.onStatus('idle');
  }

  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  public updateLastSaved(content: string): void {
    this.lastSavedContent = content;
  }
}

// Hook for React components
import { useEffect, useRef } from 'react';

export const useAutoSave = (
  content: string,
  onSave: (content: string) => Promise<void>,
  options: Omit<AutoSaveOptions, 'onSave'> = {}
) => {
  const autoSaveManager = useRef<AutoSaveManager | null>(null);

  useEffect(() => {
    autoSaveManager.current = new AutoSaveManager({
      ...options,
      onSave
    });

    return () => {
      autoSaveManager.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (autoSaveManager.current && content) {
      autoSaveManager.current.startAutoSave(content);
    }
  }, [content]);

  const forceSave = () => {
    if (autoSaveManager.current && content) {
      return autoSaveManager.current.forceSave(content);
    }
    return Promise.resolve();
  };

  const stop = () => {
    autoSaveManager.current?.stop();
  };

  const updateLastSaved = (content: string) => {
    autoSaveManager.current?.updateLastSaved(content);
  };

  return {
    forceSave,
    stop,
    updateLastSaved
  };
};