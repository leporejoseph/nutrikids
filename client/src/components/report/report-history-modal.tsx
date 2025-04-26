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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Nutrition Report History
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            View and load your past nutrition reports
          </p>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left side: Calendar */}
          <div className="md:w-1/3">
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <h3 className="font-medium text-sm mb-3 text-gray-700">Select Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md mx-auto"
                disabled={(date) => {
                  return !datesWithReports.some(d => 
                    d.getDate() === date.getDate() && 
                    d.getMonth() === date.getMonth() && 
                    d.getFullYear() === date.getFullYear()
                  );
                }}
              />
              <div className="mt-2 text-center">
                <div className="text-xs text-gray-500 mb-2">
                  {datesWithReports.length} dates with reports
                </div>
                
                {selectedDate && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedDate(undefined)}
                    className="text-xs"
                  >
                    Show All Reports
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Right side: Reports list */}
          <div className="md:w-2/3">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-medium flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4 text-purple-500" />
                  {selectedDate ? formatDate(format(selectedDate, 'yyyy-MM-dd')) : 'All Available Reports'}
                </h3>
                <span className="text-sm text-gray-500">{filteredReports.length} reports</span>
              </div>
              
              <ScrollArea className="h-[350px]">
                {filteredReports.length === 0 ? (
                  <div className="p-8 text-center">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No reports found for the selected date
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2 p-3">
                    {filteredReports.map((item) => (
                      <div 
                        key={item.id}
                        className="p-4 border rounded-md hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-all"
                        onClick={() => handleSelectReport(item.report)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <span className="font-medium">{formatDate(item.reportDate)}</span>
                              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                {formatTime(item.analysisDate)}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-3">
                              <div className="flex items-center px-2 py-1 bg-blue-50 rounded text-sm">
                                <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                                <span className="text-blue-700">Score: <span className="font-semibold">{item.nutritionScore}%</span></span>
                              </div>
                              
                              <div className="flex items-center px-2 py-1 bg-amber-50 rounded text-sm">
                                <Zap className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                                <span className="text-amber-700">
                                  Calories: <span className="font-semibold">{item.report.calories}</span>
                                  /<span className="text-amber-600">{item.report.caloriesTarget}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => handleDeleteReport(item.id, e)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors ml-2"
                            title="Delete report"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between items-center mt-4">
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
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