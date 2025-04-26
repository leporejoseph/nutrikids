import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { FoodItem, NutritionReport, FoodPlan } from "@shared/schema";
import Header from "@/components/header";
import FoodEntryForm from "@/components/food-entry-form";
import SupplementEntryForm from "@/components/supplement-entry-form";
import FoodItemList from "@/components/food-item-list";
import FoodPlanManager from "@/components/food-plan-manager";
import DateSelector from "@/components/date-selector";
import NutritionReportView from "@/components/report/report-view";
import { APP_IMAGES } from "@/lib/constants";
import { getFoodItems, saveFoodItems, getAppSettings, getChildInfo, saveNutritionReport, getNutritionReport, getFoodPlans, saveFoodPlan } from "@/lib/localStorage";
import { Button } from "@/components/ui/button";
import { ChartPie, Apple, Pill, BookmarkPlus, Save, BookmarkCheck, Star } from "lucide-react";
import { generateNutritionReport } from "@/lib/ai";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export default function Home() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [view, setView] = useState<"entry" | "report">("entry");
  const [entryTab, setEntryTab] = useState<"food" | "supplement">("food");
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<NutritionReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [plans, setPlans] = useState<FoodPlan[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved food plans
    setPlans(getFoodPlans());
  }, []);

  useEffect(() => {
    // Load saved food items
    const savedItems = getFoodItems();
    
    // Add date field to any items that don't have it (backward compatibility)
    const itemsWithDates = savedItems.map(item => {
      if (!item.date) {
        return { ...item, date: format(new Date(item.createdAt), 'yyyy-MM-dd') };
      }
      return item;
    });
    
    setFoodItems(itemsWithDates);
    saveFoodItems(itemsWithDates); // Save back the items with dates

    // Load saved report (if any)
    const savedReport = getNutritionReport();
    setReport(savedReport);
  }, []);
  
  // Filter food items by selected date and type
  const filteredFoodItems = useMemo(() => {
    return foodItems.filter(item => 
      item.date === selectedDate && 
      (item.type === 'food' || !item.type)
    );
  }, [foodItems, selectedDate]);
  
  // Filter supplement items by selected date
  const filteredSupplements = useMemo(() => {
    return foodItems.filter(item => 
      item.date === selectedDate && 
      item.type === 'supplement'
    );
  }, [foodItems, selectedDate]);

  const handleAddFood = (food: FoodItem) => {
    const updatedItems = [...foodItems, food];
    setFoodItems(updatedItems);
    saveFoodItems(updatedItems);
  };

  const handleUpdateFood = (id: string, updatedItem: Partial<FoodItem>) => {
    const updatedItems = foodItems.map((item) => 
      item.id === id ? { ...item, ...updatedItem } : item
    );
    setFoodItems(updatedItems);
    saveFoodItems(updatedItems);
  };

  const handleDeleteFood = (id: string) => {
    const updatedItems = foodItems.filter((item) => item.id !== id);
    setFoodItems(updatedItems);
    saveFoodItems(updatedItems);
  };
  
  const handleLoadFoodPlan = (items: FoodItem[]) => {
    // Filter items to only include those for the selected date
    const itemsForSelectedDate = items.map(item => ({
      ...item,
      id: crypto.randomUUID(), // Generate new IDs to avoid conflicts
      date: selectedDate, // Set to the currently selected date
      createdAt: Date.now(), // Update the creation timestamp
    }));
    
    // Add the items to the current food items
    const updatedItems = [...foodItems, ...itemsForSelectedDate];
    setFoodItems(updatedItems);
    saveFoodItems(updatedItems);
    
    toast({
      title: "Food plan loaded",
      description: `${itemsForSelectedDate.length} items have been added to your current date.`,
    });
  };
  
  const handleSaveFoodPlan = (name: string, description: string, isDefault: boolean) => {
    const currentItems = [...filteredFoodItems, ...filteredSupplements];
    
    if (currentItems.length === 0) {
      toast({
        title: "No items to save",
        description: "Add at least one food or supplement item before saving a plan.",
        variant: "destructive"
      });
      return;
    }
    
    const newPlan: FoodPlan = {
      id: crypto.randomUUID(),
      name,
      description,
      items: currentItems,
      createdAt: Date.now(),
      isDefault
    };
    
    saveFoodPlan(newPlan);
    
    // Refresh plans list
    setPlans(getFoodPlans());
    
    toast({
      title: "Plan saved",
      description: `${newPlan.name} has been saved with ${currentItems.length} items.`,
    });
    
    setIsCreateDialogOpen(false);
  };

  const handleGenerateReport = async () => {
    // Reset any previous errors
    setReportError(null);
    
    try {
      setIsLoading(true);
      setView("report");

      const settings = getAppSettings();
      const childInfo = getChildInfo();

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

      // Combine food items and supplements for the current date for analysis
      const allCurrentItems = [...filteredFoodItems, ...filteredSupplements];
      
      const newReport = await generateNutritionReport({
        foodItems: allCurrentItems, // Both food and supplements for the current date 
        historyItems: foodItems, // All historical items for trend analysis
        childInfo,
        apiKey: settings.apiKey,
        model: settings.selectedModel,
      });

      // Successfully generated report
      setReport(newReport);
      saveNutritionReport(newReport);
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
    <div className="min-h-screen max-w-md mx-auto bg-white shadow-lg">
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
            
            {/* Tabs for Food and Supplements */}
            <Tabs defaultValue="food" className="w-full mt-4" onValueChange={(val) => setEntryTab(val as "food" | "supplement")}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="food" className="flex items-center justify-center gap-2">
                  <Apple className="h-4 w-4" /> Food
                </TabsTrigger>
                <TabsTrigger value="supplement" className="flex items-center justify-center gap-2">
                  <Pill className="h-4 w-4" /> Supplements
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="food" className="mt-0">
                <FoodEntryForm onAddFood={handleAddFood} selectedDate={selectedDate} />

                <div id="foodListContainer" className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-inter font-semibold text-lg">Food & Drinks</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Save current items as a plan"
                      >
                        <BookmarkPlus className="h-4 w-4" />
                      </button>
                      {plans.length > 0 && (
                        <button 
                          onClick={() => setIsLoadDialogOpen(true)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                          title="Load saved meal plan"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {filteredFoodItems.length > 0 ? (
                    <FoodItemList 
                      items={filteredFoodItems} 
                      onDelete={handleDeleteFood} 
                      onUpdate={handleUpdateFood} 
                    />
                  ) : (
                    <p className="text-gray-500 text-center py-6">No food items added for this date.</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="supplement" className="mt-0">
                <SupplementEntryForm onAddSupplement={handleAddFood} selectedDate={selectedDate} />

                <div id="supplementListContainer" className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-inter font-semibold text-lg">Supplements</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Save current items as a plan"
                      >
                        <BookmarkPlus className="h-4 w-4" />
                      </button>
                      {plans.length > 0 && (
                        <button 
                          onClick={() => setIsLoadDialogOpen(true)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                          title="Load saved meal plan"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {filteredSupplements.length > 0 ? (
                    <FoodItemList 
                      items={filteredSupplements} 
                      onDelete={handleDeleteFood} 
                      onUpdate={handleUpdateFood} 
                    />
                  ) : (
                    <p className="text-gray-500 text-center py-6">No supplements added for this date.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {(filteredFoodItems.length > 0 || filteredSupplements.length > 0) && (
              <div id="generateReportBtnContainer" className="mt-6">
                <Button 
                  onClick={handleGenerateReport}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-bold py-4 px-6 rounded-md shadow-md transition transform hover:scale-[1.02]"
                >
                  <ChartPie className="mr-2 h-4 w-4" /> Generate Nutrition Report
                </Button>
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
                      
                      handleSaveFoodPlan(name, description, isDefault);
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
                    
                    <div className="pt-2">
                      <h3 className="font-medium text-md mb-2">Items in this plan ({filteredFoodItems.length + filteredSupplements.length})</h3>
                      <div className="max-h-[200px] overflow-y-auto space-y-2 text-sm border border-gray-100 rounded-md p-2 bg-gray-50">
                        {filteredFoodItems.map(item => (
                          <div key={item.id} className="flex items-center gap-2">
                            <Apple className="h-3 w-3 text-green-500" />
                            <span>{item.name} ({item.quantity} {item.unit})</span>
                          </div>
                        ))}
                        {filteredSupplements.map(item => (
                          <div key={item.id} className="flex items-center gap-2">
                            <Pill className="h-3 w-3 text-blue-500" />
                            <span>{item.name} ({item.quantity} {item.unit})</span>
                          </div>
                        ))}
                        {filteredFoodItems.length + filteredSupplements.length === 0 && (
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
                        disabled={filteredFoodItems.length + filteredSupplements.length === 0}
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
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition"
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
                          <BookmarkCheck className="h-5 w-5 text-green-500" />
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
      </main>
    </div>
  );
}
