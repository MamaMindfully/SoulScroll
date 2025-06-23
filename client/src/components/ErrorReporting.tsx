import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Bug, 
  Send, 
  CheckCircle, 
  X, 
  Info,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ErrorReport {
  id: string;
  type: 'bug' | 'crash' | 'performance' | 'feature';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  steps: string;
  expectedBehavior: string;
  actualBehavior: string;
  userAgent: string;
  url: string;
  timestamp: string;
  userId?: string;
  attachments?: File[];
}

interface ErrorReportingProps {
  isOpen: boolean;
  onClose: () => void;
  initialError?: {
    type?: string;
    message?: string;
    stack?: string;
    componentStack?: string;
  };
}

export default function ErrorReporting({ isOpen, onClose, initialError }: ErrorReportingProps) {
  const [report, setReport] = useState<Partial<ErrorReport>>({
    type: 'bug',
    severity: 'medium',
    title: '',
    description: '',
    steps: '',
    expectedBehavior: '',
    actualBehavior: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialError) {
      setReport(prev => ({
        ...prev,
        type: 'crash',
        severity: 'high',
        title: initialError.message || 'Application Error',
        description: `Error: ${initialError.message}\n\nStack: ${initialError.stack}`,
        actualBehavior: 'Application crashed or threw an error'
      }));
    }
  }, [initialError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const reportData: ErrorReport = {
        ...report as ErrorReport,
        id: crypto.randomUUID(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem('userId') || undefined
      };

      const response = await fetch('/api/error-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        setSubmitted(true);
        toast({
          title: "Report submitted",
          description: "Thank you for helping us improve SoulScroll!",
        });
        
        // Close after delay
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setReport({
            type: 'bug',
            severity: 'medium',
            title: '',
            description: '',
            steps: '',
            expectedBehavior: '',
            actualBehavior: ''
          });
        }, 2000);
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Please try again or contact support directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-black/80 border-purple-500/30 backdrop-blur-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-white">Report an Issue</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">Report Submitted!</h3>
              <p className="text-gray-400">Thank you for helping us improve SoulScroll.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Issue Type */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Issue Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'bug', label: 'Bug', icon: Bug, color: 'red' },
                    { value: 'crash', label: 'Crash', icon: AlertTriangle, color: 'orange' },
                    { value: 'performance', label: 'Performance', icon: Info, color: 'blue' },
                    { value: 'feature', label: 'Feature Request', icon: AlertCircle, color: 'green' }
                  ].map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={report.type === type.value ? "default" : "outline"}
                      className={`justify-start ${
                        report.type === type.value 
                          ? `bg-${type.color}-500 text-white` 
                          : 'text-gray-400 border-gray-600'
                      }`}
                      onClick={() => setReport({ ...report, type: type.value as any })}
                    >
                      <type.icon className="w-4 h-4 mr-2" />
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Severity
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'low', label: 'Low', color: 'green' },
                    { value: 'medium', label: 'Medium', color: 'yellow' },
                    { value: 'high', label: 'High', color: 'orange' },
                    { value: 'critical', label: 'Critical', color: 'red' }
                  ].map((severity) => (
                    <Badge
                      key={severity.value}
                      className={`cursor-pointer transition-all ${
                        report.severity === severity.value
                          ? `bg-${severity.color}-500 text-white`
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                      onClick={() => setReport({ ...report, severity: severity.value as any })}
                    >
                      {severity.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Brief Description
                </label>
                <Input
                  placeholder="Describe the issue in one sentence..."
                  value={report.title}
                  onChange={(e) => setReport({ ...report, title: e.target.value })}
                  className="bg-black/40 border-purple-500/30 text-white"
                  required
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Detailed Description
                </label>
                <Textarea
                  placeholder="Provide more details about what happened..."
                  value={report.description}
                  onChange={(e) => setReport({ ...report, description: e.target.value })}
                  className="bg-black/40 border-purple-500/30 text-white min-h-[100px]"
                  required
                />
              </div>

              {/* Steps to Reproduce */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Steps to Reproduce
                </label>
                <Textarea
                  placeholder={`1. Go to...\n2. Click on...\n3. See error`}
                  value={report.steps}
                  onChange={(e) => setReport({ ...report, steps: e.target.value })}
                  className="bg-black/40 border-purple-500/30 text-white"
                />
              </div>

              {/* Expected vs Actual Behavior */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Expected Behavior
                  </label>
                  <Textarea
                    placeholder="What should have happened?"
                    value={report.expectedBehavior}
                    onChange={(e) => setReport({ ...report, expectedBehavior: e.target.value })}
                    className="bg-black/40 border-purple-500/30 text-white"
                  />
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">
                    Actual Behavior
                  </label>
                  <Textarea
                    placeholder="What actually happened?"
                    value={report.actualBehavior}
                    onChange={(e) => setReport({ ...report, actualBehavior: e.target.value })}
                    className="bg-black/40 border-purple-500/30 text-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-600 text-gray-400 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !report.title || !report.description}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Global error boundary integration
export class ErrorReportingBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; showReporter: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, showReporter: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry
    console.error('React Error Boundary caught error:', error, errorInfo);
    
    // Show error reporter
    this.setState({ showReporter: true });
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center p-4">
            <Card className="bg-black/80 border-red-500/30 backdrop-blur-lg max-w-md">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-white text-xl font-bold mb-2">Oops! Something went wrong</h2>
                <p className="text-gray-400 mb-4">
                  We're sorry for the inconvenience. The error has been logged.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Reload Page
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => this.setState({ showReporter: true })}
                    className="border-gray-600 text-gray-400"
                  >
                    Report Issue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <ErrorReporting
            isOpen={this.state.showReporter}
            onClose={() => this.setState({ showReporter: false })}
            initialError={this.state.error}
          />
        </>
      );
    }

    return this.props.children;
  }
}

// Hook for manual error reporting
export const useErrorReporting = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<any>(null);

  const reportError = (error?: any) => {
    setError(error);
    setIsOpen(true);
  };

  const ErrorReporter = () => (
    <ErrorReporting
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      initialError={error}
    />
  );

  return { reportError, ErrorReporter };
};