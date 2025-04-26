import { Check, Carrot, Apple, Egg, Fish, Pill, AlertCircle } from "lucide-react";

interface RecommendationsTabProps {
  recommendations: string[];
  foodSuggestions: string[];
  supplementRecommendations?: string[];
  supplementCautions?: string[];
}

export default function RecommendationsTab({ recommendations, foodSuggestions, supplementRecommendations = [], supplementCautions = [] }: RecommendationsTabProps) {
  // Icons for the food suggestions
  const foodIcons = [
    <Carrot className="h-5 w-5" />,
    <Apple className="h-5 w-5" />,
    <Egg className="h-5 w-5" />,
    <Fish className="h-5 w-5" />,
  ];

  return (
    <div className="tab-content animate-in fade-in">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
        <h3 className="font-inter font-bold text-lg mb-2">Nutrition Improvement Tips</h3>
        <p className="text-gray-600 mb-4">Based on today's intake, here are some suggestions:</p>
        
        <ul className="space-y-3 text-gray-700">
          {recommendations.map((recommendation, index) => (
            <li key={index} className="flex space-x-3">
              <div className="flex-shrink-0 text-secondary">
                <Check className="h-5 w-5 mt-0.5" />
              </div>
              <div>{recommendation}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
        <h3 className="font-inter font-bold text-lg mb-2">Food Suggestions</h3>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {foodSuggestions.map((suggestion, index) => (
            <div key={index} className="bg-white p-3 rounded-lg shadow-sm flex items-center space-x-2">
              <div className="text-primary text-xl">
                {foodIcons[index % foodIcons.length]}
              </div>
              <div>{suggestion}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Supplement Recommendations */}
      {supplementRecommendations.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
          <h3 className="font-inter font-bold text-lg mb-2 flex items-center">
            <Pill className="h-5 w-5 mr-2 text-blue-500" />
            Supplement Recommendations
          </h3>
          <p className="text-gray-600 mb-4">Based on your child's nutritional needs:</p>
          
          <ul className="space-y-3 text-gray-700">
            {supplementRecommendations.map((recommendation, index) => (
              <li key={index} className="flex space-x-3 bg-white p-3 rounded-lg">
                <div className="flex-shrink-0 text-blue-500">
                  <Check className="h-5 w-5 mt-0.5" />
                </div>
                <div>{recommendation}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Supplement Cautions */}
      {supplementCautions.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-inter font-bold text-lg mb-2 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-amber-500" />
            Supplement Cautions
          </h3>
          <p className="text-gray-600 mb-4">Important considerations regarding supplements:</p>
          
          <ul className="space-y-3 text-gray-700">
            {supplementCautions.map((caution, index) => (
              <li key={index} className="flex space-x-3 bg-white p-3 rounded-lg">
                <div className="flex-shrink-0 text-amber-500">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                </div>
                <div>{caution}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
