import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { FoodItem, NutritionReport, FoodPlan, ReportHistoryItem, ChildInfo } from "@shared/schema";
import Header from "@/components/header";
import FoodEntryForm from "@/components/food-entry-form";
import SupplementEntryForm from "@/components/supplement-entry-form";
import FoodItemList from "@/components/food-item-list";
import FoodPlanManager from "@/components/food-plan-manager";
import DateSelector from "@/components/date-selector";
import NutritionReportView from "@/components/report/report-view";
import ReportHistoryModal from "@/components/report/report-history-modal";
import { APP_IMAGES } from "@/lib/constants";
import { getFoodItems, saveFoodItems, getAppSettings, getChildInfo, saveNutritionReport, getNutritionReport, getFoodPlans, saveFoodPlan, deleteFoodPlan, getReportHistory } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { ChartPie, Apple, Pill, BookmarkPlus, Save, BookmarkCheck, Star, Coffee, Upload, Trash2, MinusCircle, History, FileText, Users, Bookmark } from "lucide-react";
import { generateNutritionReport } from "@/lib/ai";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function Home() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [view, setView] = useState<"entry" | "report">("entry");
  const [entryType, setEntryType] = useState<"food" | "drink" | "supplement">("food");
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<NutritionReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [plans, setPlans] = useState<FoodPlan[]>([]);
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null);
  const { toast } = useToast();
  
  // Get the selected child ID
  const selectedChildId = useMemo(() => {
    return childInfo?.selectedChildId || null;
  }, [childInfo]);
  
  // Check if selected date is today
  const isToday = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return selectedDate === today;
  }, [selectedDate]);

  useEffect(() => {
    // Load saved food plans and child information
    const loadData = async () => {
      try {
        const foodPlans = await getFoodPlans();
        setPlans(foodPlans);
        
        // Load child information
        const loadedChildInfo = await getChildInfo();
        setChildInfo(loadedChildInfo);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    // Load saved food items
    const loadData = async () => {
      try {
        // Load food items
        const savedItems = await getFoodItems();
        
        // Add date field to any items that don't have it (backward compatibility)
        const itemsWithDates = savedItems.map(item => {
          if (!item.date) {
            return { ...item, date: format(new Date(item.createdAt), 'yyyy-MM-dd') };
          }
          return item;
        });
        
        setFoodItems(itemsWithDates);
        await saveFoodItems(itemsWithDates); // Save back the items with dates

        // Load saved report (if any)
        const savedReport = await getNutritionReport();
        setReport(savedReport);
        
        // Load report history
        const history = await getReportHistory();
        setReportHistory(history);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);
  
  // Filter items by selected date and child (if a child is selected)
  const filteredItems = useMemo(() => {
    return foodItems.filter(item => {
      // Always filter by date
      const dateMatches = item.date === selectedDate;
      
      // If a child is selected, also filter by childId
      if (selectedChildId) {
        // Include items specifically for this child or items with no childId (general items)
        return dateMatches && (!item.childId || item.childId === selectedChildId);
      }
      
      return dateMatches;
    });
  }, [foodItems, selectedDate, selectedChildId]);

  const handleAddFood = async (food: FoodItem) => {
    // Associate the food item with the selected child (if any)
    const foodWithChildId = {
      ...food,
      childId: selectedChildId || undefined
    };
    
    const updatedItems = [...foodItems, foodWithChildId];
    setFoodItems(updatedItems);
    try {
      await saveFoodItems(updatedItems);
    } catch (error) {
      console.error("Error saving food items:", error);
    }
  };

  const handleUpdateFood = async (id: string, updatedItem: Partial<FoodItem>) => {
    const updatedItems = foodItems.map((item) => 
      item.id === id ? { ...item, ...updatedItem } : item
    );
    setFoodItems(updatedItems);
    try {
      await saveFoodItems(updatedItems);
    } catch (error) {
      console.error("Error updating food items:", error);
    }
  };

  const handleDeleteFood = async (id: string) => {
    const updatedItems = foodItems.filter((item) => item.id !== id);
    setFoodItems(updatedItems);
    try {
      await saveFoodItems(updatedItems);
    } catch (error) {
      console.error("Error deleting food item:", error);
    }
  };
  
  const handleLoadFoodPlan = async (items: FoodItem[]) => {
    // Filter items to only include those for the selected date
    const itemsForSelectedDate = items.map(item => ({
      ...item,
      id: crypto.randomUUID(), // Generate new IDs to avoid conflicts
      date: selectedDate, // Set to the currently selected date
      createdAt: Date.now(), // Update the creation timestamp
      // Keep or set the childId - if loading from a general plan, associate with selected child
      childId: item.childId || selectedChildId || undefined
    }));
    
    // Add the items to the current food items
    const updatedItems = [...foodItems, ...itemsForSelectedDate];
    setFoodItems(updatedItems);
    
    try {
      await saveFoodItems(updatedItems);
      
      toast({
        title: "Food plan loaded",
        description: `${itemsForSelectedDate.length} items have been added to your current date.`,
      });
    } catch (error) {
      console.error("Error loading food plan:", error);
      toast({
        title: "Error loading plan",
        description: "There was a problem loading the food plan. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleSaveFoodPlan = async (name: string, description: string, isDefault: boolean, isChildSpecific: boolean = true) => {
    if (filteredItems.length === 0) {
      toast({
        title: "No items to save",
        description: "Add at least one food, drink, or supplement item before saving a plan.",
        variant: "destructive"
      });
      return;
    }
    
    // Convert FoodItems to match FoodPlan items structure (with childId as string|null)
    const itemsWithNullableChildId = filteredItems.map(item => {
      const { childId, ...rest } = item;
      return {
        ...rest,
        childId: childId || null
      };
    });
    
    const newPlan: FoodPlan = {
      id: crypto.randomUUID(),
      name,
      description,
      items: itemsWithNullableChildId,
      createdAt: Date.now(),
      isDefault,
      // Associate with the selected child if child-specific is selected
      childId: isChildSpecific && selectedChildId ? selectedChildId : null
    };
    
    try {
      await saveFoodPlan(newPlan);
      
      // Refresh plans list
      const updatedPlans = await getFoodPlans();
      setPlans(updatedPlans);
      
      toast({
        title: "Plan saved",
        description: `${newPlan.name} has been saved with ${filteredItems.length} items.`,
      });
      
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error saving food plan:", error);
      toast({
        title: "Error saving plan",
        description: "There was a problem saving the food plan. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteFoodPlan = async (planId: string, e: React.MouseEvent) => {
    // Stop event propagation to prevent the plan from being loaded
    e.stopPropagation();
    
    // Get the plan we're deleting for the toast message
    const planToDelete = plans.find(plan => plan.id === planId);
    
    try {
      // Delete the plan
      await deleteFoodPlan(planId);
      
      // Refresh the plans list
      const updatedPlans = await getFoodPlans();
      setPlans(updatedPlans);
      
      // Show a confirmation toast
      toast({
        title: "Plan deleted",
        description: planToDelete ? `Plan "${planToDelete.name}" has been deleted.` : "Food plan has been deleted.",
      });
    } catch (error) {
      console.error("Error deleting food plan:", error);
      toast({
        title: "Error deleting plan",
        description: "There was a problem deleting the food plan. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle loading a report from history
  const handleSelectHistoryReport = async (historicalReport: NutritionReport) => {
    setReport(historicalReport);
    setReportError(null);
    setView("report");
    
    toast({
      title: "Historical Report Loaded",
      description: `Loaded report from ${historicalReport.reportDate || 'unknown date'}`,
    });
  };
  
  const handleGenerateReport = async () => {
    // Reset any previous errors
    setReportError(null);
    
    try {
      setIsLoading(true);
      setView("report");

      // Get settings and child info with await to handle promises
      const settings = await getAppSettings();
      const childInfo = await getChildInfo();

      if (!settings.apiKey) {
        const errorMsg = "Google Gemini API key is required. Please add it in the settings.";
        setReportError(errorMsg);
        toast({
          title: "API Key Missing",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }
      
      if (!settings.selectedModel) {
        const errorMsg = "Please select an AI model in the settings.";
        setReportError(errorMsg);
        toast({
          title: "Model Not Selected",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      const newReport = await generateNutritionReport({
        foodItems: filteredItems, // Only items for the current date - these are used for the nutritional analysis
        historyItems: foodItems,  // All historical items for context and recommendations
        childInfo,
        apiKey: settings.apiKey,
        model: settings.selectedModel,
      });

      // Successfully generated report
      setReport(newReport);
      await saveNutritionReport(newReport);
      setReportError(null);
      
    } catch (error) {
      console.error("Error generating report:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      
      // Set the error to be displayed in the report view
      setReportError(errorMessage);
      
      toast({
        title: "Error Generating Report",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Clear any previous report when there's an error
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-background shadow-lg">
      <Header title="NutriKids" />

      <main className="p-4">
        {view === "entry" ? (
          <div id="entryView" className="animate-in fade-in">
            <div className="mb-6">
              <h2 className="font-inter font-bold text-xl mb-2">Nutrition Tracker</h2>
              <p className="text-gray-600">Track your child's food and supplements</p>
            </div>
            
            {/* Date Selector */}
            <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            
            {/* Consolidated Item List - MOVED TO TOP */}
            <div id="itemsListContainer" className="mt-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-inter font-semibold text-lg">Added Items</h3>
                <div className="flex space-x-2">
                  {filteredItems.length > 0 && (
                    <button 
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Save current items as a plan"
                    >
                      <BookmarkPlus className="h-4 w-4" />
                    </button>
                  )}
                  {plans.length > 0 && (
                    <button 
                      onClick={() => setIsLoadDialogOpen(true)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      title="Load saved meal plan"
                    >
                      <Upload className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <FoodItemList 
                items={filteredItems} 
                onDelete={handleDeleteFood} 
                onUpdate={handleUpdateFood}
                onAddFood={handleAddFood}
                selectedDate={selectedDate}
              />
            </div>

            {/* Add the FoodPlanManager component */}
            <div className="mt-4 mb-6 border rounded-md p-4 bg-blue-50 border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-inter font-semibold text-lg flex items-center">
                  <Bookmark className="mr-2 h-5 w-5 text-blue-600" /> Food Plans
                </h3>
                {childInfo?.selectedChildId && (
                  <div className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-full flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {childInfo.children?.find(c => c.id === childInfo.selectedChildId)?.name || 'Selected Child'}
                  </div>
                )}
              </div>
              
              {/* FoodPlanManager component */}
              <FoodPlanManager 
                currentItems={filteredItems} 
                onLoadPlan={handleLoadFoodPlan}
                selectedChildId={selectedChildId}
              />
            </div>

            {filteredItems.length > 0 && (
              <div id="generateReportBtnContainer" className="mt-6 space-y-2">
                {/* Only show the Generate Report button for today's date */}
                {isToday ? (
                  <Button 
                    onClick={handleGenerateReport}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-bold py-4 px-6 rounded-md shadow-md transition transform hover:scale-[1.02]"
                  >
                    <ChartPie className="mr-2 h-4 w-4" /> Generate Nutrition Report
                  </Button>
                ) : (
                  <div className="text-center text-gray-500 bg-gray-100 rounded-md p-3 mb-3 text-sm">
                    <p>Nutrition reports can only be generated for today's date.</p>
                    <p>Select today's date to enable report generation.</p>
                  </div>
                )}
                
                {/* History button - always show if there are reports in history */}
                {/* Using state variable to check for report history instead of direct call */}
                {reportHistory.length > 0 && (
                  <Button 
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3 px-6 rounded-md"
                    variant="outline"
                  >
                    <History className="mr-2 h-4 w-4" /> View Report History
                  </Button>
                )}
              </div>
            )}

            {/* Save Plan Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Current Items as Plan</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const name = (form.elements.namedItem('planName') as HTMLInputElement).value;
                      const description = (form.elements.namedItem('planDescription') as HTMLTextAreaElement).value;
                      const isDefault = (form.elements.namedItem('isDefault') as HTMLInputElement).checked;
                      const isChildSpecificElem = form.elements.namedItem('isChildSpecific') as HTMLInputElement;
                      const isChildSpecific = isChildSpecificElem ? isChildSpecificElem.checked : false;
                      
                      handleSaveFoodPlan(name, description, isDefault, isChildSpecific);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label htmlFor="planName" className="text-sm font-medium">
                        Plan Name
                      </label>
                      <input
                        id="planName"
                        name="planName"
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                        required
                        placeholder="e.g., Weekday Breakfast"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="planDescription" className="text-sm font-medium">
                        Description (optional)
                      </label>
                      <textarea
                        id="planDescription"
                        name="planDescription"
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                        rows={3}
                        placeholder="Add any notes about this meal plan"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        name="isDefault"
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="isDefault" className="text-sm">
                        Set as default plan
                      </label>
                    </div>
                    
                    {childInfo?.children && childInfo.children.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isChildSpecific"
                          name="isChildSpecific"
                          className="rounded border-gray-300"
                          defaultChecked={true}
                        />
                        <label htmlFor="isChildSpecific" className="text-sm">
                          {childInfo.selectedChildId ? 
                            `Make specific to ${childInfo.children.find(c => c.id === childInfo.selectedChildId)?.name || 'selected child'}` 
                            : 'Make specific to selected child'}
                        </label>
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <h3 className="font-medium text-md mb-2">Items in this plan ({filteredItems.length})</h3>
                      <div className="max-h-[200px] overflow-y-auto space-y-2 text-sm border border-gray-100 rounded-md p-2 bg-gray-50">
                        {filteredItems.map(item => (
                          <div key={item.id} className="flex items-center gap-2">
                            {item.type === "supplement" ? (
                              <Pill className="h-3 w-3 text-blue-500" />
                            ) : item.type === "drink" ? (
                              <Coffee className="h-3 w-3 text-purple-500" />
                            ) : (
                              <Apple className="h-3 w-3 text-green-500" />
                            )}
                            <span>{item.name} ({item.quantity} {item.unit})</span>
                          </div>
                        ))}
                        {filteredItems.length === 0 && (
                          <p className="text-gray-500 italic">No items to save</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="mr-2"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-blue-600 text-white"
                        disabled={filteredItems.length === 0}
                      >
                        <BookmarkPlus className="mr-2 h-4 w-4" />
                        Save Plan
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Load Plan Dialog */}
            <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Load Food Plan</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-4">
                    Select a plan to load
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {plans.map((plan) => (
                      <div 
                        key={plan.id} 
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition relative"
                        onClick={() => {
                          handleLoadFoodPlan(plan.items);
                          setIsLoadDialogOpen(false);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium flex items-center">
                              {plan.name}
                              {plan.isDefault && (
                                <span className="ml-2 text-amber-500">
                                  <Star className="h-4 w-4" />
                                </span>
                              )}
                            </div>
                            {plan.description && (
                              <p className="text-sm text-gray-500">{plan.description}</p>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              {plan.items.length} items • {new Date(plan.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={(e) => handleDeleteFoodPlan(plan.id, e)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              title="Delete plan"
                            >
                              <MinusCircle className="h-5 w-5" />
                            </button>
                            <BookmarkCheck className="h-5 w-5 text-green-500" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* Images for visual appeal */}
            <div className="mt-8 grid grid-cols-3 gap-2">
              <img src={APP_IMAGES.fruits} alt="Healthy fruits" className="w-full h-24 object-cover rounded-lg shadow-sm" />
              <img src={APP_IMAGES.vegetables} alt="Vegetable plate" className="w-full h-24 object-cover rounded-lg shadow-sm" />
              <img src={APP_IMAGES.childEating} alt="Child eating" className="w-full h-24 object-cover rounded-lg shadow-sm" />
            </div>
          </div>
        ) : (
          <NutritionReportView 
            report={report} 
            isLoading={isLoading} 
            onBack={() => setView("entry")}
            error={reportError}
          />
        )}
        {/* Report History Modal */}
        <ReportHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          onSelectReport={handleSelectHistoryReport}
        />
      </main>


    </div>
  );
}
