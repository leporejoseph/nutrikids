import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReportHistoryItem, NutritionReport, MultiChildReport } from "@shared/schema";
import { getReportHistory, deleteReportFromHistory, clearReportHistory } from '@/lib/localStorage';
import { FileText, Calendar as CalendarIcon, Trash2, TrendingUp, Zap, Users } from 'lucide-react';

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
    
    // Always set the selected date to today
    setSelectedDate(new Date());
    
    // Initialize filtered reports to today's date
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaysReports = history.filter(item => item.reportDate === today);
    
    // If there are today's reports, show them; otherwise show all reports
    setFilteredReports(todaysReports.length > 0 ? todaysReports : history);
  };
  
  // Get first report from multi-child report, or return the single report
  const getReportFromHistoryItem = (item: ReportHistoryItem): NutritionReport => {
    if (item.isMultiChild && item.childReports) {
      // Get the first child report from the multi-child report
      const childIds = Object.keys(item.childReports);
      if (childIds.length > 0) {
        return item.childReports[childIds[0]];
      }
      // If no child reports found, return a default report structure
      throw new Error("No child reports available");
    } else if (item.report) {
      // Return the single report
      return item.report;
    }
    throw new Error("No report data available");
  };
  
  const handleSelectReport = (item: ReportHistoryItem) => {
    try {
      // Get the appropriate report based on the item type
      const report = getReportFromHistoryItem(item);
      onSelectReport(report);
      onClose();
    } catch (error) {
      console.error("Error selecting report:", error);
      // Could show a toast message here
    }
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
  
  // Calculate average calories for multi-child reports
  const getAverageCalories = (childReports: Record<string, NutritionReport>) => {
    const reports = Object.values(childReports);
    if (reports.length === 0) {
      return { calories: 0, caloriesTarget: 0 };
    }
    
    const totalCalories = reports.reduce((sum, report) => sum + (report.calories || 0), 0);
    const totalTarget = reports.reduce((sum, report) => sum + (report.caloriesTarget || 0), 0);
    
    return {
      calories: Math.round(totalCalories / reports.length),
      caloriesTarget: Math.round(totalTarget / reports.length)
    };
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby="history-description" className="max-w-4xl w-[calc(100vw-32px)] sm:w-[calc(100vw-48px)] md:w-auto p-3 sm:p-6">
        <DialogHeader className="mb-3">
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Nutrition Report History
          </DialogTitle>
          <p id="history-description" className="text-sm text-gray-500 mt-1">
            View and load your past nutrition reports
          </p>
        </DialogHeader>
        
        {/* Mobile date picker dropdown */}
        <div className="md:hidden mb-4">
          <select 
            className="w-full p-2 border border-gray-200 rounded-md text-sm" 
            value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ""}
            onChange={(e) => {
              if (e.target.value === "") {
                setSelectedDate(undefined);
              } else {
                setSelectedDate(new Date(e.target.value));
              }
            }}
          >
            <option value="">All Available Reports</option>
            {datesWithReports.map((date, index) => (
              <option key={index} value={format(date, 'yyyy-MM-dd')}>
                {format(date, 'MMMM d, yyyy')}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left side: Calendar - Only visible on tablets and larger */}
          <div className="hidden md:block md:w-[280px] flex-none">
            <div className="bg-white rounded-lg border shadow-sm p-3">
              <h3 className="font-medium text-sm mb-2 text-gray-700">Select Date</h3>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md w-full"
                  classNames={{
                    root: "w-full",
                    table: "w-full",
                    month: "space-y-1",
                    cell: "text-center p-0",
                    day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100"
                  }}
                  disabled={(date) => {
                    return !datesWithReports.some(d => 
                      d.getDate() === date.getDate() && 
                      d.getMonth() === date.getMonth() && 
                      d.getFullYear() === date.getFullYear()
                    );
                  }}
                />
              </div>
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
          <div className="md:w-2/3 w-full">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="p-3 border-b bg-gray-50 flex flex-wrap justify-between items-center">
                <h3 className="font-medium flex items-center text-sm">
                  <CalendarIcon className="mr-2 h-4 w-4 text-purple-500" />
                  {selectedDate ? formatDate(format(selectedDate, 'yyyy-MM-dd')) : 'All Available Reports'}
                </h3>
                <span className="text-xs text-gray-500">{filteredReports.length} reports</span>
              </div>
              
              <ScrollArea className="h-[250px] sm:h-[300px] md:h-[350px]">
                {filteredReports.length === 0 ? (
                  <div className="p-4 sm:p-8 text-center">
                    <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300 mx-auto mb-2 sm:mb-3" />
                    <p className="text-gray-500 text-sm">
                      No reports found for the selected date
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-2 p-2 sm:p-3">
                    {filteredReports.map((item) => {
                      // Get calorie and nutrition info based on report type
                      const caloriesInfo = item.isMultiChild && item.childReports 
                        ? getAverageCalories(item.childReports)
                        : item.report ? { calories: item.report.calories, caloriesTarget: item.report.caloriesTarget } : { calories: 0, caloriesTarget: 0 };
                      
                      return (
                        <div 
                          key={item.id}
                          className="p-2 sm:p-3 border rounded-md hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-all"
                          onClick={() => handleSelectReport(item)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 sm:space-y-2 pr-2 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="font-medium text-sm">{formatDate(item.reportDate)}</span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-1 sm:px-2 py-0.5 rounded truncate">
                                  {formatTime(item.analysisDate)}
                                </span>
                                {item.isMultiChild && (
                                  <span className="text-xs text-purple-600 bg-purple-50 px-1 sm:px-2 py-0.5 rounded flex items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    Family Report
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex flex-wrap gap-1 sm:gap-2">
                                <div className="flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-50 rounded text-xs sm:text-sm">
                                  <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-blue-500" />
                                  <span className="text-blue-700">Score: <span className="font-semibold">{item.nutritionScore}%</span></span>
                                </div>
                                
                                <div className="flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-amber-50 rounded text-xs sm:text-sm">
                                  <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-amber-500" />
                                  <span className="text-amber-700">
                                    Cal: <span className="font-semibold">{caloriesInfo.calories}</span>
                                    /<span className="text-amber-600">{caloriesInfo.caloriesTarget}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={(e) => handleDeleteReport(item.id, e)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 sm:p-1.5 rounded-full transition-colors flex-shrink-0"
                              title="Delete report"
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
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