import { GoogleGenAI } from "@google/genai";
import type { NutritionReport, FoodItem, ChildInfo } from "@shared/schema";

// Define model interface
export interface GeminiModel {
  id: string;
  name: string;
  version?: string;
}

interface GenerateReportParams {
  foodItems: FoodItem[];      // Current day's food items 
  historyItems?: FoodItem[];  // All food items for historical analysis
  childInfo: ChildInfo;
  apiKey: string;
  model: string;
}

export async function generateNutritionReport({
  foodItems,
  historyItems,
  childInfo,
  apiKey,
  model,
}: GenerateReportParams): Promise<NutritionReport> {
  try {
    // Validate inputs
    if (!foodItems || foodItems.length === 0) {
      throw new Error("No food items to analyze. Please add at least one food item.");
    }
    
    if (!apiKey) {
      throw new Error("Google Gemini API key is required. Please add it in the settings.");
    }
    
    if (!model) {
      throw new Error("No AI model selected. Please select a model in the settings.");
    }

    // For testing and development purposes
    // Return mock data for local development or when a test key is used
    if (apiKey === 'test123' || apiKey === 'test' || apiKey === 'development') {
      console.log("Using test key - returning placeholder report");
      return getMockNutritionReport(foodItems, childInfo);
    }

    try {
      // Create a detailed prompt
      const prompt = createAnalysisPrompt(foodItems, childInfo, historyItems);
      console.log("Using model:", model);
      
      // Create a safer way to access the API
      // We'll use fetch directly since the Google Generative AI SDK TypeScript support is problematic
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
            // Removed responseFormat which was causing errors
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        
        if (response.status === 400) {
          throw new Error("Invalid request to Gemini API. Please check your API key and try again.");
        } else if (response.status === 401) {
          throw new Error("Authentication failed. Please check your Gemini API key and try again.");
        } else if (response.status === 403) {
          throw new Error("API key doesn't have access to the Gemini model. Please check your permissions.");
        } else if (response.status === 404) {
          throw new Error(`Model '${model}' not found. Please select a different model.`);
        } else if (response.status === 429) {
          throw new Error("Quota exceeded. Please try again later or check your API usage limits.");
        } else {
          throw new Error(`API Error: ${response.status} - ${errorData.error?.message || "Unknown error"}`);
        }
      }
      
      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
        throw new Error("No response generated from the API. Please try again.");
      }
      
      const content = data.candidates[0].content;
      const parts = content.parts || [];
      const textResponse = parts[0]?.text;
      
      if (!textResponse) {
        throw new Error("Empty response from Gemini API. Please try again.");
      }
      
      try {
        // First, try to clean up the response if it contains markdown code blocks
        let jsonText = textResponse;
        
        // Extract JSON content from any markdown code blocks
        const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/;
        const match = jsonText.match(jsonRegex);
        
        if (match && match[1]) {
          // If we found JSON in code blocks, use that content
          jsonText = match[1].trim();
        } else {
          // Otherwise, try to clean up the text by removing markdown markers
          jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        }
        
        console.log("Cleaned JSON text:", jsonText.substring(0, 100) + "...");
        
        // Attempt to parse the cleaned JSON
        const parsedReport = JSON.parse(jsonText);
        return parsedReport as NutritionReport;
      } catch (jsonError) {
        console.error("Failed to parse Gemini response as JSON:", jsonError);
        console.log("Raw response:", textResponse);
        
        // Since this is a detailed error, provide more helpful guidance
        const errorMsg = "There was a problem with the AI response format. Please try again or try a different model.";
        throw new Error(errorMsg);
      }
    } catch (apiError: any) {
      // Specific error handling for API issues
      if (apiError.message.includes("API key")) {
        throw new Error("Invalid or expired API key. Please check your API key in settings.");
      } else if (apiError.message.includes("model")) {
        throw new Error(`Model issue: ${apiError.message}. Try selecting a different model in settings.`);
      } else {
        throw apiError; // Re-throw other errors
      }
    }
  } catch (error: any) {
    console.error("Error generating nutrition report:", error);
    throw error;
  }
}

// Mock report function for testing - only used when test API keys are provided
function getMockNutritionReport(foodItems: FoodItem[], childInfo: ChildInfo): NutritionReport {
  return {
    calories: 1200,
    caloriesTarget: 1800,
    nutritionScore: 65,
    macronutrients: [
      {
        name: "Protein",
        value: "35",
        unit: "g",
        percentOfDaily: 70,
        recommendedRange: "40-50g"
      },
      {
        name: "Carbohydrates",
        value: "150",
        unit: "g",
        percentOfDaily: 60,
        recommendedRange: "225-325g"
      },
      {
        name: "Fat",
        value: "45",
        unit: "g",
        percentOfDaily: 65,
        recommendedRange: "60-70g"
      },
      {
        name: "Fiber",
        value: "15",
        unit: "g",
        percentOfDaily: 50,
        recommendedRange: "25-30g"
      }
    ],
    vitamins: [
      {
        name: "Vitamin A",
        value: "450",
        unit: "mcg",
        percentOfDaily: 75,
        recommendedRange: "600mcg"
      },
      {
        name: "Vitamin C",
        value: "30",
        unit: "mg",
        percentOfDaily: 40,
        recommendedRange: "75mg"
      },
      {
        name: "Vitamin D",
        value: "5",
        unit: "mcg",
        percentOfDaily: 33,
        recommendedRange: "15mcg"
      },
      {
        name: "Vitamin E",
        value: "4",
        unit: "mg",
        percentOfDaily: 40,
        recommendedRange: "10mg"
      }
    ],
    minerals: [
      {
        name: "Calcium",
        value: "500",
        unit: "mg",
        percentOfDaily: 38,
        recommendedRange: "1300mg"
      },
      {
        name: "Iron",
        value: "7",
        unit: "mg",
        percentOfDaily: 70,
        recommendedRange: "10mg"
      },
      {
        name: "Zinc",
        value: "6",
        unit: "mg",
        percentOfDaily: 75,
        recommendedRange: "8mg"
      },
      {
        name: "Potassium",
        value: "1800",
        unit: "mg",
        percentOfDaily: 60,
        recommendedRange: "3000mg"
      }
    ],
    recommendations: [
      "Add more fruits and vegetables to increase vitamin and fiber intake",
      "Include more calcium-rich foods like yogurt and cheese",
      "Consider a vitamin D supplement, especially during winter months",
      "Add more whole grains to increase fiber intake"
    ],
    foodSuggestions: [
      "Greek yogurt with berries",
      "Carrot sticks with hummus",
      "Whole grain crackers with cheese",
      "Orange slices",
      "Salmon"
    ],
    supplementRecommendations: [
      "A children's multivitamin may help fill nutritional gaps",
      "Consider vitamin D supplementation during winter months",
      "Omega-3 supplements could benefit cognitive development"
    ],
    supplementCautions: [
      "Don't exceed recommended dosages for any supplement",
      "Consult with a healthcare provider before starting new supplements",
      "Avoid supplements with added sugars or artificial colors"
    ]
  };
}

function createAnalysisPrompt(foodItems: FoodItem[], childInfo: ChildInfo, historyItems?: FoodItem[]): string {
  // Age-specific recommendations
  const ageGroup = getAgeGroup(childInfo.age);

  // Items to use for history analysis
  const itemsForHistory = historyItems || foodItems;
  
  // Group food items by date
  const foodItemsByDate = itemsForHistory.reduce((acc: {[key: string]: FoodItem[]}, item) => {
    const date = item.date || new Date(item.createdAt).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  // Create current day food items list, separating food and supplements
  const selectedDate = foodItems[0]?.date || new Date().toISOString().split('T')[0];
  
  const regularFoodItems = foodItems.filter(item => item.type === 'food' || !item.type);
  const supplementItems = foodItems.filter(item => item.type === 'supplement');
  
  const foodItemsList = regularFoodItems
    .map((item) => `${item.quantity} ${item.unit} of ${item.name} (${item.mealType})`)
    .join("\n");
    
  const supplementsList = supplementItems.length > 0 
    ? supplementItems.map((item) => {
        const dosageInfo = item.supplementInfo?.dosage ? ` - Dosage: ${item.supplementInfo.dosage}` : '';
        const frequencyInfo = item.supplementInfo?.frequency ? ` - Frequency: ${item.supplementInfo.frequency}` : '';
        const purposeInfo = item.supplementInfo?.purpose ? ` - Purpose: ${item.supplementInfo.purpose}` : '';
        return `${item.quantity} ${item.unit} of ${item.name}${dosageInfo}${frequencyInfo}${purposeInfo}`;
      }).join("\n")
    : "None recorded";

  // Create historical food data as JSON
  const historyJson = JSON.stringify(foodItemsByDate, null, 2);

  const restrictionsText = childInfo.restrictions?.length > 0 && !childInfo.restrictions.includes("none")
    ? `The child has the following dietary restrictions: ${childInfo.restrictions.join(", ")}.`
    : "The child has no specific dietary restrictions.";
    
  // Format weight with appropriate unit
  const weightText = childInfo.weight !== null 
    ? `Weight: ${childInfo.weight} ${childInfo.weightUnit || 'lb'}${childInfo.weightUnit === 'lb' ? ' (convert to kg for analysis)' : ''}`
    : "Weight: Not provided";
    
  // Format height with appropriate unit
  const heightText = childInfo.height !== null
    ? `Height: ${childInfo.height} ${childInfo.heightUnit || 'in'}${childInfo.heightUnit === 'in' ? ' (convert to cm for analysis)' : ''}`
    : "Height: Not provided";

  const prompt = `
You are a pediatric nutritionist with expertise in child nutrition. Your task is to analyze the following food intake for a child and provide a comprehensive nutritional analysis.

CHILD INFORMATION:
${childInfo.age !== null ? `Age: ${childInfo.age} years` : "Age: Not provided"}
${childInfo.gender ? `Gender: ${childInfo.gender}` : "Gender: Not provided"}
${weightText}
${heightText}
${restrictionsText}

CURRENT DAY FOOD INTAKE (${selectedDate}):
${foodItemsList}

CURRENT SUPPLEMENTS:
${supplementsList}

HISTORICAL FOOD DATA BY DATE:
${historyJson}

ANALYSIS INSTRUCTIONS:
1. Focus primarily on analyzing the CURRENT DAY's food intake.
2. Determine the approximate caloric content and macronutrient breakdown (proteins, carbohydrates, fats, fiber) based on standard nutritional databases.
3. Estimate the vitamin content (focusing on vitamins A, C, D, E, B vitamins).
4. Estimate the mineral content (focusing on calcium, iron, zinc, potassium, sodium, magnesium).
5. Compare the intake to age-appropriate recommended daily allowances for ${ageGroup}.
6. Calculate a "nutrition score" as a percentage representing how well the diet meets the child's nutritional needs.
7. Review any historical data provided to identify patterns or nutritional gaps over time.
8. Consider seasonal eating patterns or recurring food preferences if evident in the historical data.
9. Provide specific improvement recommendations based on both current and historical intake.
10. Suggest 4-5 specific foods that would complement the current intake to improve nutritional balance.
11. Provide 2-3 specific supplement recommendations if appropriate based on nutritional gaps.
12. Include 2-3 cautions about supplement usage, potential interactions, or considerations.

IMPORTANT: Format your response as a valid JSON object using the schema below. Do not include any explanations, markdown formatting, or text outside the JSON object. The response must be directly parseable as JSON:

{
  "calories": number,
  "caloriesTarget": number,
  "nutritionScore": number,
  "macronutrients": [
    {
      "name": string,
      "value": string,
      "unit": string,
      "percentOfDaily": number,
      "recommendedRange": string
    }
  ],
  "vitamins": [
    {
      "name": string,
      "value": string,
      "unit": string, 
      "percentOfDaily": number,
      "recommendedRange": string
    }
  ],
  "minerals": [
    {
      "name": string,
      "value": string,
      "unit": string,
      "percentOfDaily": number,
      "recommendedRange": string
    }
  ],
  "recommendations": [
    string
  ],
  "foodSuggestions": [
    string
  ],
  "supplementRecommendations": [
    string
  ],
  "supplementCautions": [
    string
  ]
}

Ensure the percentOfDaily values are between 0 and 100, representing the percentage of the daily recommended intake. The nutritionScore should be a number between 0 and 100.
`;

  return prompt;
}

function getAgeGroup(age: number | null): string {
  if (age === null) {
    return "children";
  }
  
  if (age <= 1) {
    return "infants (0-1 years)";
  } else if (age <= 3) {
    return "toddlers (1-3 years)";
  } else if (age <= 8) {
    return "young children (4-8 years)";
  } else if (age <= 13) {
    return "older children (9-13 years)";
  } else {
    return "adolescents (14-18 years)";
  }
}

/**
 * Returns the current list of Gemini models available for the nutrition analysis
 * This is a simplification since the API doesn't have a built-in way to list models
 */
export async function fetchAvailableGeminiModels(apiKey: string): Promise<GeminiModel[]> {
  try {
    if (!apiKey) {
      throw new Error("API key is required to fetch available models");
    }
    
    // These are the current available Gemini models as of April 2025
    // We're listing the most recent ones first based on official documentation
    const currentModels: GeminiModel[] = [
      { id: "gemini-2.5-pro-preview-03-25", name: "Gemini 2.5 Pro Preview" },
      { id: "gemini-2.5-flash-preview-04-17", name: "Gemini 2.5 Flash Preview" },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash-Lite" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
      { id: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash-8B" }
    ];
    
    // Simulate a delay as if we're fetching from the API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return currentModels;
  } catch (error) {
    console.error("Error preparing model list:", error);
    
    // Return a default list of recent Gemini models
    return [
      { id: "gemini-1.0-pro", name: "Gemini 1.0 Pro" },
      { id: "gemini-pro", name: "Gemini Pro" }
    ];
  }
}
