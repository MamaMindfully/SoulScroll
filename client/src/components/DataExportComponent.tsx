import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  FileText, 
  Archive,
  Cloud,
  Shield,
  Calendar,
  Database,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface DataExport {
  id: number;
  exportType: string;
  status: string;
  downloadUrl?: string;
  expiresAt?: string;
  createdAt: string;
}

interface ExportOptions {
  includeEntries: boolean;
  includeAnalytics: boolean;
  includeVoiceNotes: boolean;
  includeInsights: boolean;
  dateRange: string;
  format: string;
}

export default function DataExportComponent() {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeEntries: true,
    includeAnalytics: true,
    includeVoiceNotes: false,
    includeInsights: true,
    dateRange: "all",
    format: "pdf"
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exportHistory } = useQuery<DataExport[]>({
    queryKey: ["/api/exports"],
    refetchInterval: 5000, // Check for updates every 5 seconds
  });

  const createExportMutation = useMutation({
    mutationFn: async (options: ExportOptions) => {
      return await apiRequest("POST", "/api/exports/create", options);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exports"] });
      toast({
        title: "Export started",
        description: "Your data export is being prepared. You'll be notified when ready.",
      });
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Unable to start data export. Please try again.",
        variant: "destructive",
      });
    },
  });

  const downloadExportMutation = useMutation({
    mutationFn: async (exportId: number) => {
      const response = await fetch(`/api/exports/${exportId}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `luma-export-${exportId}.${exportOptions.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Download started",
        description: "Your export file is downloading.",
      });
    },
    onError: () => {
      toast({
        title: "Download failed",
        description: "Unable to download export file.",
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    createExportMutation.mutate(exportOptions);
  };

  const handleDownload = (exportId: number) => {
    downloadExportMutation.mutate(exportId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card className="border-serenity bg-gradient-to-br from-serenity/20 to-warmth/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Download className="w-6 h-6 text-serenity" />
              <CardTitle className="text-wisdom">Data Export & Backup</CardTitle>
              <Badge variant="secondary" className="bg-serenity/20 text-serenity">
                Premium
              </Badge>
            </div>
            <Shield className="w-5 h-5 text-serenity" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-white/70 rounded-lg border-l-4 border-serenity">
            <p className="text-sm text-wisdom/90 leading-relaxed">
              Export your complete journaling data for backup, portability, or analysis. 
              All exports are encrypted and automatically deleted after 7 days for security.
            </p>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="font-medium text-wisdom">Export Options</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-wisdom/80">Include Data:</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="entries"
                      checked={exportOptions.includeEntries}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeEntries: checked as boolean }))
                      }
                    />
                    <label htmlFor="entries" className="text-sm text-wisdom">
                      Journal entries and content
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="analytics"
                      checked={exportOptions.includeAnalytics}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeAnalytics: checked as boolean }))
                      }
                    />
                    <label htmlFor="analytics" className="text-sm text-wisdom">
                      Emotional analysis & mood data
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="voice"
                      checked={exportOptions.includeVoiceNotes}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeVoiceNotes: checked as boolean }))
                      }
                    />
                    <label htmlFor="voice" className="text-sm text-wisdom">
                      Voice notes & transcriptions
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insights"
                      checked={exportOptions.includeInsights}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, includeInsights: checked as boolean }))
                      }
                    />
                    <label htmlFor="insights" className="text-sm text-wisdom">
                      AI insights & reflection letters
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-wisdom/80">Format & Range:</h4>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-sm text-wisdom/70 block mb-1">Export Format:</label>
                    <Select
                      value={exportOptions.format}
                      onValueChange={(value) => 
                        setExportOptions(prev => ({ ...prev, format: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span>PDF Report</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="json">
                          <div className="flex items-center space-x-2">
                            <Database className="w-4 h-4" />
                            <span>JSON Data</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="zip">
                          <div className="flex items-center space-x-2">
                            <Archive className="w-4 h-4" />
                            <span>Complete Backup (ZIP)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-wisdom/70 block mb-1">Date Range:</label>
                    <Select
                      value={exportOptions.dateRange}
                      onValueChange={(value) => 
                        setExportOptions(prev => ({ ...prev, dateRange: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="year">Past Year</SelectItem>
                        <SelectItem value="6months">Past 6 Months</SelectItem>
                        <SelectItem value="3months">Past 3 Months</SelectItem>
                        <SelectItem value="month">Past Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleExport}
              disabled={createExportMutation.isPending}
              className="w-full bg-serenity hover:bg-serenity/90 text-white"
            >
              {createExportMutation.isPending ? (
                "Preparing Export..."
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Create Export
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Export History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exportHistory && exportHistory.length > 0 ? (
            <div className="space-y-3">
              {exportHistory.map((exportItem) => (
                <div
                  key={exportItem.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-serenity/10 to-warmth/10 rounded-lg border border-serenity/20"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(exportItem.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-wisdom">
                          {exportItem.exportType.toUpperCase()} Export
                        </span>
                        <Badge className={getStatusColor(exportItem.status)}>
                          {exportItem.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-wisdom/70">
                        Created: {new Date(exportItem.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {exportItem.expiresAt && (
                          <span className="ml-2">
                            • Expires: {new Date(exportItem.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {exportItem.status === "completed" && exportItem.downloadUrl && (
                      <Button
                        size="sm"
                        onClick={() => handleDownload(exportItem.id)}
                        disabled={downloadExportMutation.isPending}
                        className="bg-warmth hover:bg-warmth/90 text-white"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    )}
                    
                    {exportItem.status === "pending" && (
                      <div className="animate-pulse text-sm text-wisdom/60">
                        Processing...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Archive className="w-12 h-12 text-wisdom/40 mx-auto mb-3" />
              <p className="text-wisdom/70">No exports created yet</p>
              <p className="text-sm text-wisdom/50">Create your first data export above</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cloud Backup Options */}
      <Card className="border-warmth/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="w-5 h-5" />
            <span>Cloud Backup</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-wisdom/80">
            Automatically backup your journal data to secure cloud storage services.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-warmth/30">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Cloud className="w-5 h-5 text-warmth" />
                  <span className="font-medium text-wisdom">Google Drive</span>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
                <p className="text-sm text-wisdom/70 mb-3">
                  Automatic weekly backups to your Google Drive
                </p>
                <Button size="sm" disabled className="w-full">
                  Connect Google Drive
                </Button>
              </CardContent>
            </Card>

            <Card className="border-serenity/30">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Mail className="w-5 h-5 text-serenity" />
                  <span className="font-medium text-wisdom">Email Backup</span>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
                <p className="text-sm text-wisdom/70 mb-3">
                  Monthly email backups to your registered email
                </p>
                <Button size="sm" disabled className="w-full">
                  Setup Email Backup
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}