import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface JobStatus {
  jobId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  result?: any;
  error?: string;
}

export const useJobStatus = (jobId: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['/api/ai/journal/status', jobId],
    queryFn: async (): Promise<JobStatus> => {
      if (!jobId) throw new Error('No job ID provided');
      
      const response = await apiRequest('GET', `/api/ai/journal/status/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job status');
      }

      return response.json();
    },
    enabled: enabled && !!jobId,
    refetchInterval: (data) => {
      // Stop polling if job is completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      // Poll every 2 seconds for active jobs
      return 2000;
    },
    staleTime: 0, // Always fetch fresh data
  });
};