import { GoogleGenAI } from "@google/genai";
import type { NutritionReport, FoodItem, ChildInfo, MultiChildReport, Child } from "@shared/schema";

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
  // Find the selected child
  const selectedChild = childInfo.children?.find(child => child.id === childInfo.selectedChildId) 
    || childInfo.children?.[0];
  
  // Get the current date in YYYY-MM-DD format for the report
  const todayDate = new Date().toISOString().split('T')[0];
  
  return {
    id: crypto.randomUUID(),
    childId: selectedChild.id,
    childName: selectedChild.name,
    calories: 1200,
    caloriesTarget: 1800,
    nutritionScore: 65,
    analysisDate: Date.now(),
    reportDate: todayDate,
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
  // Find the selected child from the childInfo
  const selectedChild = childInfo.children?.find(child => child.id === childInfo.selectedChildId) 
    || childInfo.children?.[0] 
    || { 
      id: "",
      name: "", 
      dateOfBirth: null, 
      gender: "", 
      weight: null, 
      height: null,
      weightUnit: "lb",
      heightUnit: "in",
      restrictions: []
    };
  
  // Calculate age from date of birth if available
  let age: number | null = null;
  if (selectedChild.dateOfBirth) {
    const birthDate = new Date(selectedChild.dateOfBirth);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }
  
  // Determine the age group for nutritional guidance
  const ageGroup = getAgeGroup(age);
  
  // Items to use for history analysis
  const itemsForHistory = historyItems || foodItems;
  
  // Get current date
  const currentDate = foodItems[0]?.date || new Date().toISOString().split('T')[0];
  const currentDateObj = new Date(currentDate);
  
  // Calculate date 5 days ago for filtering history
  const fiveDaysAgo = new Date(currentDateObj);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];
  
  // Filter history items to only include those from the last 5 days and for the selected child
  const recentHistoryItems = itemsForHistory.filter(item => {
    const itemDate = item.date || new Date(item.createdAt).toISOString().split('T')[0];
    const matchesChild = !selectedChild.id || !item.childId || item.childId === selectedChild.id;
    // Include if date is between 5 days ago and current date, but not the current date itself
    // And only include items for the selected child if childId is present
    return itemDate >= fiveDaysAgoStr && itemDate < currentDate && matchesChild;
  });
  
  console.log(`Including ${recentHistoryItems.length} items from the previous 5 days in nutrition analysis for child: ${selectedChild.name || 'Unknown'}`);
  
  // Group food items by date
  const foodItemsByDate = recentHistoryItems.reduce((acc: {[key: string]: FoodItem[]}, item) => {
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
  // Format the history data in a more readable way for the AI
  const historyJson = Object.keys(foodItemsByDate).length > 0 
    ? JSON.stringify(foodItemsByDate, null, 2)
    : "No historical data available from previous 5 days";

  const restrictionsText = selectedChild.restrictions?.length > 0 && !selectedChild.restrictions.includes("none")
    ? `The child has the following dietary restrictions: ${selectedChild.restrictions.join(", ")}.`
    : "The child has no specific dietary restrictions.";
    
  // Format weight with appropriate unit
  const weightText = selectedChild.weight !== null 
    ? `Weight: ${selectedChild.weight} ${selectedChild.weightUnit || 'lb'}${selectedChild.weightUnit === 'lb' ? ' (convert to kg for analysis)' : ''}`
    : "Weight: Not provided";
    
  // Format height with appropriate unit
  const heightText = selectedChild.height !== null
    ? `Height: ${selectedChild.height} ${selectedChild.heightUnit || 'in'}${selectedChild.heightUnit === 'in' ? ' (convert to cm for analysis)' : ''}`
    : "Height: Not provided";

  // Format age or date of birth for display
  const ageText = selectedChild.dateOfBirth
    ? `Date of Birth: ${selectedChild.dateOfBirth} (Age: ${age} years)`
    : "Age: Not provided";

  const prompt = `
You are a pediatric nutritionist with expertise in child nutrition. Your task is to analyze the following food intake for a child and provide a comprehensive nutritional analysis.

CHILD INFORMATION:
${selectedChild.name ? `Name: ${selectedChild.name}` : ""}
${ageText}
${selectedChild.gender ? `Gender: ${selectedChild.gender}` : "Gender: Not provided"}
${weightText}
${heightText}
${restrictionsText}

CURRENT DAY FOOD INTAKE (${selectedDate}):
${foodItemsList}

CURRENT SUPPLEMENTS:
${supplementsList}

HISTORICAL FOOD DATA BY DATE (PREVIOUS 5 DAYS):
${historyJson}

ANALYSIS INSTRUCTIONS:
1. IMPORTANT: The nutrition analysis (calories, macros, vitamins, minerals, nutrition score) is ONLY based on the CURRENT DAY's food intake.
2. Determine the approximate caloric content and macronutrient breakdown (proteins, carbohydrates, fats, fiber) based on standard nutritional databases.
3. Estimate the vitamin content (focusing on vitamins A, C, D, E, B vitamins).
4. Estimate the mineral content (focusing on calcium, iron, zinc, potassium, sodium, magnesium).
5. Compare the intake to age-appropriate recommended daily allowances for ${ageGroup}.
6. Calculate a "nutrition score" as a percentage representing how well the current day's diet meets the child's nutritional needs.
7. While the nutrition analysis is for the current day only, use the historical data (previous 5 days) to inform your recommendations and tips.
8. Thoroughly review the historical data to identify patterns, trends, or recurring nutritional gaps across the 5-day history.
9. Your recommendations and tips should specifically reference patterns observed in the historical data.
10. Suggest 4-5 specific foods that would complement the current intake to improve nutritional balance, considering historical preferences.
11. Provide 2-3 specific supplement recommendations if appropriate based on consistent nutritional gaps observed over time.
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
 * Generates nutrition reports for multiple children in parallel
 * This function processes reports for multiple children at once
 */
export async function generateMultiChildReport({
  foodItems,
  historyItems,
  childInfo,
  apiKey,
  model,
}: GenerateReportParams): Promise<MultiChildReport> {
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

    // Get all children from childInfo
    if (!childInfo.children || childInfo.children.length === 0) {
      throw new Error("No children found. Please add at least one child in settings.");
    }
    
    // Use all children for the report
    const selectedChildren = childInfo.children;
    
    console.log(`Generating reports for ${selectedChildren.length} children in parallel...`);
    
    // For test/development key, return mock data
    if (apiKey === 'test123' || apiKey === 'test' || apiKey === 'development') {
      console.log("Using test key - returning placeholder multi-child report");
      const mockReports: Record<string, NutritionReport> = {};
      
      for (const child of selectedChildren) {
        // Create a modified childInfo with only this child selected
        const singleChildInfo: ChildInfo = {
          ...childInfo,
          selectedChildId: child.id
        };
        
        // Get mock report for this child
        const childReport = getMockNutritionReport(foodItems, singleChildInfo);
        mockReports[child.id] = childReport;
      }
      
      return {
        id: crypto.randomUUID(),
        analysisDate: Date.now(),
        reportDate: new Date().toISOString().split('T')[0],
        childReports: mockReports
      };
    }
    
    // Create individual reports for each child in parallel
    const reportPromises = selectedChildren.map(async (child) => {
      try {
        // Create a modified childInfo with only this child selected
        const singleChildInfo: ChildInfo = {
          ...childInfo,
          selectedChildId: child.id
        };
        
        // Get food items for this child from the current day
        const currentDate = foodItems[0]?.date || new Date().toISOString().split('T')[0];
        
        // Filter food items that are associated with this child
        const childFoodItems = foodItems.filter(item => {
          // Include item if:
          // 1. It has no childId (applies to all children)
          // 2. The item's childId matches this child's id 
          // 3. The item's childIds array includes this child's id
          return !item.childId || 
                 item.childId === child.id || 
                 (item.childIds && item.childIds.includes(child.id));
        });
        
        if (childFoodItems.length === 0) {
          console.log(`No food items found for child ${child.name || child.id}`);
          // Return a special "no data" report
          return [child.id, {
            id: crypto.randomUUID(),
            childId: child.id,
            childName: child.name,
            calories: 0,
            caloriesTarget: 0,
            nutritionScore: 0,
            analysisDate: Date.now(),
            reportDate: currentDate,
            macronutrients: [],
            vitamins: [],
            minerals: [],
            recommendations: ["No food data available for this child."],
            foodSuggestions: [],
            supplementRecommendations: [],
            supplementCautions: []
          }];
        }
        
        console.log(`Generating report for child ${child.name || child.id} with ${childFoodItems.length} food items`);
        
        // Generate report for this child
        const report = await generateNutritionReport({
          foodItems: childFoodItems,
          historyItems,
          childInfo: singleChildInfo,
          apiKey,
          model
        });
        
        return [child.id, report];
      } catch (error) {
        console.error(`Error generating report for child ${child.name || child.id}:`, error);
        // Return an error report
        return [child.id, {
          id: crypto.randomUUID(),
          childId: child.id,
          childName: child.name,
          calories: 0,
          caloriesTarget: 0,
          nutritionScore: 0,
          analysisDate: Date.now(),
          reportDate: new Date().toISOString().split('T')[0],
          macronutrients: [],
          vitamins: [],
          minerals: [],
          recommendations: [`Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`],
          foodSuggestions: [],
          supplementRecommendations: [],
          supplementCautions: []
        }];
      }
    });
    
    // Wait for all reports to complete
    const reports = await Promise.all(reportPromises);
    
    // Convert array of [childId, report] to a Record<childId, report>
    const childReports: Record<string, NutritionReport> = {};
    reports.forEach(([childId, report]) => {
      childReports[childId as string] = report as NutritionReport;
    });
    
    return {
      id: crypto.randomUUID(),
      analysisDate: Date.now(),
      reportDate: new Date().toISOString().split('T')[0],
      childReports
    };
  } catch (error: any) {
    console.error("Error generating multi-child nutrition report:", error);
    throw error;
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
    
    // Only using Gemini 2.5 models as requested
    const currentModels: GeminiModel[] = [
      { id: "gemini-2.5-pro-preview-03-25", name: "Gemini 2.5 Pro Preview" },
      { id: "gemini-2.5-flash-preview-04-17", name: "Gemini 2.5 Flash Preview" }
    ];
    
    // Simulate a delay as if we're fetching from the API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return currentModels;
  } catch (error) {
    console.error("Error preparing model list:", error);
    
    // Even in error case, only return Gemini 2.5 models
    return [
      { id: "gemini-2.5-flash-preview-04-17", name: "Gemini 2.5 Flash Preview" }
    ];
  }
}
