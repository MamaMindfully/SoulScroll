import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Download, FileText, Calendar as CalendarIcon, Crown } from "lucide-react";
import { exportJournalToPDF, exportDateRange, getExportStats } from '../utils/PDFExportEngine';
import { usePremium } from "@/context/PremiumContext";
import { format } from "date-fns";

const ExportManager = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { totalEntries, canExport } = getExportStats();
  const { isPremium } = usePremium();

  const handleFullExport = async () => {
    if (!canExport) return;
    
    setIsExporting(true);
    try {
      const allEntries = JSON.parse(localStorage.getItem('soulscroll-entries') || '[]');
      const success = exportJournalToPDF(allEntries);
      
      if (success) {
        // Track export in localStorage
        const exportHistory = JSON.parse(localStorage.getItem('soulscroll-exports') || '[]');
        exportHistory.push({
          type: 'full',
          timestamp: new Date().toISOString(),
          entriesCount: allEntries.length
        });
        localStorage.setItem('soulscroll-exports', JSON.stringify(exportHistory));
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDateRangeExport = async () => {
    if (!canExport || !startDate || !endDate) return;
    
    setIsExporting(true);
    try {
      const success = exportDateRange(startDate, endDate);
      
      if (success) {
        const exportHistory = JSON.parse(localStorage.getItem('soulscroll-exports') || '[]');
        exportHistory.push({
          type: 'date-range',
          timestamp: new Date().toISOString(),
          dateRange: { from: startDate, to: endDate }
        });
        localStorage.setItem('soulscroll-exports', JSON.stringify(exportHistory));
        setShowDatePicker(false);
        setStartDate(undefined);
        setEndDate(undefined);
      }
    } catch (error) {
      console.error('Date range export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export Journal</span>
          </div>
          {!isPremium && (
            <Badge className="bg-yellow-100 text-yellow-800">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-gray-600" />
            <div>
              <div className="text-sm font-medium">Total Entries</div>
              <div className="text-xs text-gray-600">{totalEntries} journal entries available</div>
            </div>
          </div>
          <Badge variant="outline">{totalEntries}</Badge>
        </div>

        {isPremium ? (
          <div className="space-y-3">
            {/* Full Export */}
            <Button
              onClick={handleFullExport}
              disabled={isExporting || totalEntries === 0}
              className="w-full"
              variant="default"
            >
              {isExporting ? 'Generating PDF...' : 'Export All Entries to PDF'}
            </Button>

            {/* Date Range Export */}
            <div className="space-y-2">
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {startDate && endDate ? (
                      `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd")}`
                    ) : (
                      "Export Date Range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Start Date</label>
                      <input
                        type="date"
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        onChange={(e) => setStartDate(new Date(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <input
                        type="date"
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        onChange={(e) => setEndDate(new Date(e.target.value))}
                      />
                    </div>
                    <Button
                      onClick={handleDateRangeExport}
                      disabled={!startDate || !endDate}
                      className="w-full"
                      size="sm"
                    >
                      Export Selected Range
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <p className="text-xs text-gray-600">
              PDF exports include all entry details, moods, and AI reflections with professional formatting.
            </p>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <Crown className="w-12 h-12 mx-auto text-yellow-500" />
            <div>
              <h4 className="font-medium text-gray-900">Premium Feature</h4>
              <p className="text-sm text-gray-600 mt-1">
                Export your journal entries to beautifully formatted PDF files
              </p>
            </div>
            <Button 
              variant="outline" 
              className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
            >
              Upgrade to Premium
            </Button>
          </div>
        )}

        {/* Export History */}
        {isPremium && (
          <div className="pt-3 border-t">
            <div className="text-xs text-gray-600 mb-2">Recent Exports</div>
            <ExportHistory />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ExportHistory = () => {
  const [exports] = useState(() => {
    return JSON.parse(localStorage.getItem('soulscroll-exports') || '[]').slice(-3);
  });

  if (exports.length === 0) {
    return (
      <div className="text-xs text-gray-500 italic">
        No exports yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {exports.map((exportItem: any, index: number) => (
        <div key={index} className="flex items-center justify-between text-xs">
          <span className="text-gray-600">
            {exportItem.type === 'full' ? 'Full Export' : 'Date Range'}
          </span>
          <span className="text-gray-500">
            {new Date(exportItem.timestamp).toLocaleDateString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ExportManager;