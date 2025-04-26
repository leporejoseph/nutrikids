import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { FoodItem, NutritionReport } from "@shared/schema";
import Header from "@/components/header";
import FoodEntryForm from "@/components/food-entry-form";
import SupplementEntryForm from "@/components/supplement-entry-form";
import FoodItemList from "@/components/food-item-list";
import DateSelector from "@/components/date-selector";
import NutritionReportView from "@/components/report/report-view";
import { APP_IMAGES } from "@/lib/constants";
import { getFoodItems, saveFoodItems, getAppSettings, getChildInfo, saveNutritionReport, getNutritionReport } from "@/lib/localStorage";
import { Button } from "@/components/ui/button";
import { ChartPie, Apple, Pill } from "lucide-react";
import { generateNutritionReport } from "@/lib/ai";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [view, setView] = useState<"entry" | "report">("entry");
  const [entryTab, setEntryTab] = useState<"food" | "supplement">("food");
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<NutritionReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const { toast } = useToast();

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
                  <h3 className="font-inter font-semibold text-lg mb-2">Food Items</h3>
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
                  <h3 className="font-inter font-semibold text-lg mb-2">Supplements</h3>
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
