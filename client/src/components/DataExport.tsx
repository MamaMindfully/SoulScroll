import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Shield, 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  EyeOff 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { traceManager } from '@/utils/traceId';

interface ExportStatus {
  inProgress: boolean;
  progress: number;
  downloadUrl?: string;
  fileSize?: number;
  expiresAt?: number;
  exportId?: string;
}

const DataExport: React.FC = () => {
  const [exportStatus, setExportStatus] = useState<ExportStatus>({ 
    inProgress: false, 
    progress: 0 
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [includeAuditLogs, setIncludeAuditLogs] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { toast } = useToast();

  const validateForm = (): boolean => {
    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Export password must be at least 8 characters long",
        variant: "destructive"
      });
      return false;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both password fields match",
        variant: "destructive"
      });
      return false;
    }

    if (!agreedToTerms) {
      toast({
        title: "Terms Required",
        description: "Please acknowledge the data export terms",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const generateExport = async () => {
    if (!validateForm()) return;

    setExportStatus({ inProgress: true, progress: 10 });

    try {
      // Start export process
      setExportStatus(prev => ({ ...prev, progress: 30 }));

      const response = await traceManager.tracedFetch('/api/data-export/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password,
          includeAuditLogs
        })
      });

      setExportStatus(prev => ({ ...prev, progress: 70 }));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Export failed');
      }

      const data = await response.json();

      setExportStatus({
        inProgress: false,
        progress: 100,
        downloadUrl: data.downloadUrl,
        fileSize: data.fileSize,
        expiresAt: data.expiresAt,
        exportId: data.exportId
      });

      toast({
        title: "Export Generated Successfully",
        description: `Your encrypted data export is ready for download. File expires in 15 minutes.`
      });

    } catch (error) {
      console.error('Export failed:', error);
      
      setExportStatus({ inProgress: false, progress: 0 });
      
      toast({
        title: "Export Failed",
        description: error.message || "Failed to generate data export. Please try again.",
        variant: "destructive"
      });
    }
  };

  const downloadExport = async () => {
    if (!exportStatus.downloadUrl) return;

    try {
      // Create download link
      const link = document.createElement('a');
      link.href = exportStatus.downloadUrl;
      link.download = 'soulscroll-data-export.zip.enc';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "Your encrypted data export is downloading. Keep your password safe!"
      });

      // Clear export status after download
      setTimeout(() => {
        setExportStatus({ inProgress: false, progress: 0 });
        setPassword('');
        setConfirmPassword('');
        setIncludeAuditLogs(false);
        setAgreedToTerms(false);
      }, 2000);

    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download export file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeRemaining = (expiresAt: number): string => {
    const now = Date.now();
    const remaining = Math.max(0, expiresAt - now);
    const minutes = Math.floor(remaining / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Your Data
        </CardTitle>
        <CardDescription>
          Download a complete, encrypted copy of all your SoulScroll AI data. 
          This includes journal entries, insights, and analytics.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Security Notice */}
        <Alert>
          <Shield className="w-4 h-4" />
          <AlertDescription>
            Your data will be encrypted with a password you provide. 
            Keep this password safe - we cannot recover it if lost.
          </AlertDescription>
        </Alert>

        {/* Export Form */}
        {!exportStatus.downloadUrl && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="export-password">Export Password</Label>
              <div className="relative">
                <Input
                  id="export-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a strong password (min 8 characters)"
                  disabled={exportStatus.inProgress}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={exportStatus.inProgress}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-audit-logs"
                  checked={includeAuditLogs}
                  onCheckedChange={setIncludeAuditLogs}
                  disabled={exportStatus.inProgress}
                />
                <Label htmlFor="include-audit-logs" className="text-sm">
                  Include audit logs (account activity history)
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agree-terms"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                  disabled={exportStatus.inProgress}
                />
                <Label htmlFor="agree-terms" className="text-sm leading-relaxed">
                  I understand this export contains all my personal data and will handle it securely. 
                  The encrypted file will expire in 15 minutes for security.
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {exportStatus.inProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generating export...</span>
              <span>{exportStatus.progress}%</span>
            </div>
            <Progress value={exportStatus.progress} className="w-full" />
          </div>
        )}

        {/* Download Section */}
        {exportStatus.downloadUrl && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                Your encrypted data export is ready for download!
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">File Size:</span>
                <span className="text-sm">{formatFileSize(exportStatus.fileSize || 0)}</span>
              </div>
              
              {exportStatus.expiresAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expires In:</span>
                  <span className="text-sm text-orange-600">
                    {formatTimeRemaining(exportStatus.expiresAt)}
                  </span>
                </div>
              )}
            </div>

            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>Important:</strong> Remember your password! The file cannot be decrypted without it. 
                Download will start automatically and the file will be deleted from our servers.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!exportStatus.downloadUrl ? (
            <Button 
              onClick={generateExport}
              disabled={exportStatus.inProgress || !password || !confirmPassword || !agreedToTerms}
              className="flex-1"
            >
              {exportStatus.inProgress ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Generating Export...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Encrypted Export
                </>
              )}
            </Button>
          ) : (
            <Button onClick={downloadExport} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download Encrypted File
            </Button>
          )}
        </div>

        {/* Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Export includes: Journal entries, AI insights, emotional analytics, reflection letters</p>
          <p>• File format: Encrypted ZIP archive with JSON data</p>
          <p>• Security: AES-256 encryption with your password</p>
          <p>• Retention: Files automatically deleted after 15 minutes</p>
          <p>• Privacy: Only you can decrypt the export with your password</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExport;