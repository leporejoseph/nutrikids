import { useState, useEffect } from "react";
import { FoodItem, NutritionReport } from "@shared/schema";
import Header from "@/components/header";
import FoodEntryForm from "@/components/food-entry-form";
import FoodItemList from "@/components/food-item-list";
import NutritionReportView from "@/components/report/report-view";
import { APP_IMAGES } from "@/lib/constants";
import { getFoodItems, saveFoodItems, getAppSettings, getChildInfo, saveNutritionReport, getNutritionReport } from "@/lib/localStorage";
import { Button } from "@/components/ui/button";
import { ChartPie } from "lucide-react";
import { generateNutritionReport } from "@/lib/ai";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [view, setView] = useState<"food" | "report">("food");
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<NutritionReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved food items
    const savedItems = getFoodItems();
    setFoodItems(savedItems);

    // Load saved report (if any)
    const savedReport = getNutritionReport();
    setReport(savedReport);
  }, []);

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

      const newReport = await generateNutritionReport({
        foodItems,
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
        {view === "food" ? (
          <div id="foodEntryView" className="animate-in fade-in">
            <div className="mb-6">
              <h2 className="font-inter font-bold text-xl mb-2">Today's Food Tracker</h2>
              <p className="text-gray-600">Add the food items your child has eaten today</p>
            </div>

            <FoodEntryForm onAddFood={handleAddFood} />

            <div id="foodListContainer" className="mb-6">
              <h3 className="font-inter font-semibold text-lg mb-2">Today's Food Items</h3>
              <FoodItemList 
                items={foodItems} 
                onDelete={handleDeleteFood} 
                onUpdate={handleUpdateFood} 
              />
            </div>

            {foodItems.length > 0 && (
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
            onBack={() => setView("food")}
            error={reportError}
          />
        )}
      </main>
    </div>
  );
}
