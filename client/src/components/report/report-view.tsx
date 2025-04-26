import { useState, useEffect } from "react";
import { NutritionReport } from "@shared/schema";
import { ArrowLeft } from "lucide-react";
import MacronutrientsTab from "./macronutrients-tab";
import VitaminsTab from "./vitamins-tab";
import MineralsTab from "./minerals-tab";
import RecommendationsTab from "./recommendations-tab";

interface NutritionReportViewProps {
  report: NutritionReport | null;
  isLoading: boolean;
  onBack: () => void;
  error?: string | null;
}

export default function NutritionReportView({ report, isLoading, onBack, error }: NutritionReportViewProps) {
  const [activeTab, setActiveTab] = useState("macronutrients");
  const [errorMessage, setErrorMessage] = useState<string | null>(error || null);

  const tabs = [
    { id: "macronutrients", label: "Macronutrients" },
    { id: "vitamins", label: "Vitamins" },
    { id: "minerals", label: "Minerals" },
    { id: "recommendations", label: "Tips" },
  ];

  // Update error message when prop changes or from URL params
  useEffect(() => {
    // Update from error prop
    if (error) {
      setErrorMessage(error);
    } else {
      // Check for error in URL params
      const urlParams = new URLSearchParams(window.location.search);
      const urlError = urlParams.get('error');
      if (urlError) {
        setErrorMessage(decodeURIComponent(urlError));
      }
    }
  }, [error]);

  if (!report && !isLoading) {
    return (
      <div className="py-10 text-center">
        {errorMessage ? (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-600 font-semibold text-lg mb-2">Error Generating Report</h3>
            <p className="text-red-700">{errorMessage}</p>
            
            {errorMessage.includes("API key") && (
              <div className="mt-3 text-sm text-gray-700">
                <p className="font-semibold">To fix this issue:</p>
                <ol className="list-decimal list-inside mt-2 text-left">
                  <li>Open the Settings panel from the top right menu</li>
                  <li>Enter your Google Gemini API key</li>
                  <li>Select a compatible model from the dropdown</li>
                  <li>Save your settings</li>
                </ol>
              </div>
            )}
          </div>
        ) : (
          <p className="text-lg">No report data available.</p>
        )}
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Food Entry
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-inter font-bold text-xl">Nutrition Report</h2>
        <button 
          onClick={onBack}
          className="p-2 text-primary hover:text-accent"
          aria-label="Back to food entry"
        >
          <ArrowLeft className="h-4 w-4 mr-1 inline" /> Back
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div id="reportLoadingState" className="py-10 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mb-4"></div>
          <p className="text-lg">Analyzing nutritional content...</p>
          <p className="text-sm text-gray-500">This may take a moment</p>
        </div>
      )}

      {/* Report Content */}
      {report && !isLoading && (
        <div id="reportContent">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg p-4 shadow-sm">
              <h4 className="text-primary font-semibold">Total Calories</h4>
              <p className="text-2xl font-bold">{report.calories.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Target: {report.caloriesTarget.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-secondary/10 to-secondary/20 rounded-lg p-4 shadow-sm">
              <h4 className="text-secondary font-semibold">Overall Score</h4>
              <p className="text-2xl font-bold">{report.nutritionScore}%</p>
              <p className="text-sm text-gray-600">Based on daily needs</p>
            </div>
          </div>

          {/* Tabs for Different Visualizations */}
          <div className="mb-4 border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
              {tabs.map((tab) => (
                <li key={tab.id} className="mr-2" role="presentation">
                  <button
                    className={`inline-block p-4 border-b-2 ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent hover:border-gray-300 hover:text-gray-600"
                    }`}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Tab Contents */}
          <div id="reportTabContents">
            {activeTab === "macronutrients" && <MacronutrientsTab nutrients={report.macronutrients} />}
            {activeTab === "vitamins" && <VitaminsTab vitamins={report.vitamins} />}
            {activeTab === "minerals" && <MineralsTab minerals={report.minerals} />}
            {activeTab === "recommendations" && (
              <RecommendationsTab
                recommendations={report.recommendations}
                foodSuggestions={report.foodSuggestions}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
