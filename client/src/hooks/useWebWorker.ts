import { useEffect, useRef, useState, useCallback } from 'react';

interface WorkerTask {
  id: string;
  type: string;
  data: any;
}

interface WorkerResult {
  id: string;
  result: any;
  error?: string;
}

export const useWebWorker = (workerUrl: string) => {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const pendingTasks = useRef<Map<string, (result: any) => void>>(new Map());

  useEffect(() => {
    try {
      workerRef.current = new Worker(workerUrl);
      
      workerRef.current.onmessage = (event: MessageEvent<WorkerResult>) => {
        const { id, result, error } = event.data;
        const resolver = pendingTasks.current.get(id);
        
        if (resolver) {
          if (error) {
            console.error('Worker error:', error);
            resolver(null);
          } else {
            resolver(result);
          }
          pendingTasks.current.delete(id);
        }
      };
      
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        setIsReady(false);
      };
      
      setIsReady(true);
    } catch (error) {
      console.error('Failed to create worker:', error);
      setIsReady(false);
    }

    return () => {
      workerRef.current?.terminate();
      pendingTasks.current.clear();
    };
  }, [workerUrl]);

  const postMessage = useCallback(<T>(type: string, data: any): Promise<T> => {
    return new Promise((resolve) => {
      if (!workerRef.current || !isReady) {
        resolve(null as T);
        return;
      }

      const id = Math.random().toString(36).substr(2, 9);
      pendingTasks.current.set(id, resolve);

      const task: WorkerTask = { id, type, data };
      workerRef.current.postMessage(task);
    });
  }, [isReady]);

  return {
    isReady,
    postMessage
  };
};