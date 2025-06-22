import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useJobStatus } from '@/hooks/useJobStatus';

interface JobStatusIndicatorProps {
  jobId: string | null;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

const JobStatusIndicator: React.FC<JobStatusIndicatorProps> = ({
  jobId,
  onComplete,
  onError
}) => {
  const { data: jobStatus, isLoading } = useJobStatus(jobId);

  React.useEffect(() => {
    if (jobStatus?.status === 'completed' && jobStatus.result) {
      onComplete?.(jobStatus.result);
    } else if (jobStatus?.status === 'failed' && jobStatus.error) {
      onError?.(jobStatus.error);
    }
  }, [jobStatus, onComplete, onError]);

  if (!jobId || isLoading) {
    return null;
  }

  if (!jobStatus) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-600">Could not fetch job status</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    switch (jobStatus.status) {
      case 'waiting':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'active':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (jobStatus.status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusMessage = () => {
    switch (jobStatus.status) {
      case 'waiting':
        return 'Your journal is in the queue for AI analysis...';
      case 'active':
        return 'AI is analyzing your journal entry...';
      case 'completed':
        return 'Analysis complete! Your insights are ready.';
      case 'failed':
        return 'Analysis failed. Please try again.';
      default:
        return 'Processing your request...';
    }
  };

  // Don't show indicator for completed jobs (handled by parent)
  if (jobStatus.status === 'completed') {
    return null;
  }

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getStatusMessage()}
              </p>
              <p className="text-xs text-gray-500">
                Job ID: {jobStatus.jobId}
              </p>
            </div>
          </div>
          
          <Badge variant="secondary" className={getStatusColor()}>
            {jobStatus.status}
          </Badge>
        </div>
        
        {jobStatus.status === 'active' && jobStatus.progress > 0 && (
          <div className="mt-3">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${jobStatus.progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {jobStatus.progress}% complete
            </p>
          </div>
        )}
        
        {jobStatus.error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-700">{jobStatus.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobStatusIndicator;