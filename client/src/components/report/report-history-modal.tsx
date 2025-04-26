import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReportHistoryItem, NutritionReport } from "@shared/schema";
import { getReportHistory, deleteReportFromHistory, clearReportHistory } from '@/lib/localStorage';
import { FileText, Calendar as CalendarIcon, Trash2, TrendingUp, Zap } from 'lucide-react';

interface ReportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (report: NutritionReport) => void;
}

export default function ReportHistoryModal({ isOpen, onClose, onSelectReport }: ReportHistoryModalProps) {
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filteredReports, setFilteredReports] = useState<ReportHistoryItem[]>([]);
  
  // Get dates with reports (for the calendar)
  const datesWithReports = reportHistory
    .map(item => new Date(item.reportDate))
    .filter((date, index, self) => 
      index === self.findIndex(d => d.toDateString() === date.toDateString())
    );
  
  // Load report history when the component mounts
  useEffect(() => {
    if (isOpen) {
      loadReportHistory();
    }
  }, [isOpen]);
  
  // Filter reports when selected date changes
  useEffect(() => {
    if (selectedDate) {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const filtered = reportHistory.filter(item => item.reportDate === formattedDate);
      setFilteredReports(filtered);
    } else {
      setFilteredReports(reportHistory);
    }
  }, [selectedDate, reportHistory]);
  
  const loadReportHistory = () => {
    const history = getReportHistory();
    setReportHistory(history);
    // Initialize filtered reports to today's date if available, or all reports
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaysReports = history.filter(item => item.reportDate === today);
    setFilteredReports(todaysReports.length > 0 ? todaysReports : history);
  };
  
  const handleSelectReport = (report: NutritionReport) => {
    onSelectReport(report);
    onClose();
  };
  
  const handleDeleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteReportFromHistory(id);
    loadReportHistory();
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMMM d, yyyy');
  };
  
  // Format time for display
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return format(date, 'h:mm a');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Report History
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Calendar (left column on larger screens) */}
          <div className="md:col-span-2 border rounded-md p-2">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="border rounded-md"
              disabled={(date) => {
                return !datesWithReports.some(d => 
                  d.getDate() === date.getDate() && 
                  d.getMonth() === date.getMonth() && 
                  d.getFullYear() === date.getFullYear()
                );
              }}
            />
            <div className="text-xs text-center mt-2 text-gray-500">
              {datesWithReports.length} dates with reports
            </div>
          </div>
          
          {/* Report list (right column) */}
          <div className="md:col-span-3 border rounded-md">
            <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-medium text-sm flex items-center">
                <CalendarIcon className="mr-1 h-4 w-4 text-gray-500" />
                {selectedDate ? formatDate(format(selectedDate, 'yyyy-MM-dd')) : 'All Reports'}
              </h3>
              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate(undefined)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Show all
                </button>
              )}
            </div>
            
            <ScrollArea className="h-[300px] p-2">
              {filteredReports.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No reports found for the selected date
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredReports.map((item) => (
                    <div 
                      key={item.id}
                      className="p-3 border rounded-md hover:bg-blue-50 cursor-pointer transition"
                      onClick={() => handleSelectReport(item.report)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium flex items-center">
                            <span className="mr-2">{formatDate(item.reportDate)}</span>
                            <span className="text-xs text-gray-500">{formatTime(item.analysisDate)}</span>
                          </div>
                          <div className="mt-1 flex items-center space-x-3 text-sm">
                            <div className="flex items-center">
                              <TrendingUp className="w-3 h-3 mr-1 text-blue-500" />
                              <span>Score: {item.nutritionScore}%</span>
                            </div>
                            <div className="flex items-center">
                              <Zap className="w-3 h-3 mr-1 text-amber-500" />
                              <span>Calories: {item.report.calories}/{item.report.caloriesTarget}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteReport(item.id, e)}
                          className="text-red-500 hover:bg-red-50 p-1 rounded-full transition"
                          title="Delete report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between items-center">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => {
              if (confirm("Are you sure you want to clear all report history? This action cannot be undone.")) {
                clearReportHistory();
                loadReportHistory();
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All History
          </Button>
          
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}