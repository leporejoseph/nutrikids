import { GoogleGenAI } from "@google/genai";
import type { NutritionReport, FoodItem, ChildInfo } from "@shared/schema";

interface GenerateReportParams {
  foodItems: FoodItem[];
  childInfo: ChildInfo;
  apiKey: string;
  model: string;
}

export async function generateNutritionReport({
  foodItems,
  childInfo,
  apiKey,
  model,
}: GenerateReportParams): Promise<NutritionReport> {
  try {
    if (!apiKey) {
      throw new Error("API key is required. Please add it in the settings.");
    }

    const genAI = new GoogleGenAI({ apiKey });
    
    // Create a detailed prompt
    const prompt = createAnalysisPrompt(foodItems, childInfo);

    // Make the API call
    const result = await genAI.models.generateContent({
      model: model,
      contents: prompt
    });

    // Get the response text from the API response
    if (!result.text) {
      throw new Error("No response received from the API.");
    }
    
    try {
      const parsedReport = JSON.parse(result.text);
      return parsedReport as NutritionReport;
    } catch (jsonError) {
      console.error("Failed to parse Gemini response as JSON:", jsonError);
      console.log("Raw response:", result.text);
      throw new Error("Failed to parse nutrition data. Please try again.");
    }
  } catch (error) {
    console.error("Error generating nutrition report:", error);
    throw error;
  }
}

function createAnalysisPrompt(foodItems: FoodItem[], childInfo: ChildInfo): string {
  // Age-specific recommendations
  const ageGroup = getAgeGroup(childInfo.age);

  const foodItemsList = foodItems
    .map((item) => `${item.quantity} ${item.unit} of ${item.name} (${item.mealType})`)
    .join("\n");

  const restrictionsText = childInfo.restrictions?.length > 0 && !childInfo.restrictions.includes("none")
    ? `The child has the following dietary restrictions: ${childInfo.restrictions.join(", ")}.`
    : "The child has no specific dietary restrictions.";

  const prompt = `
You are a pediatric nutritionist with expertise in child nutrition. Your task is to analyze the following food intake for a child and provide a comprehensive nutritional analysis.

CHILD INFORMATION:
${childInfo.age !== null ? `Age: ${childInfo.age} years` : "Age: Not provided"}
${childInfo.gender ? `Gender: ${childInfo.gender}` : "Gender: Not provided"}
${childInfo.weight !== null ? `Weight: ${childInfo.weight} kg` : "Weight: Not provided"}
${childInfo.height !== null ? `Height: ${childInfo.height} cm` : "Height: Not provided"}
${restrictionsText}

FOOD INTAKE:
${foodItemsList}

ANALYSIS INSTRUCTIONS:
1. Determine the approximate caloric content and macronutrient breakdown (proteins, carbohydrates, fats, fiber) based on standard nutritional databases.
2. Estimate the vitamin content (focusing on vitamins A, C, D, E, B vitamins).
3. Estimate the mineral content (focusing on calcium, iron, zinc, potassium, sodium, magnesium).
4. Compare the intake to age-appropriate recommended daily allowances for ${ageGroup}.
5. Calculate a "nutrition score" as a percentage representing how well the diet meets the child's nutritional needs.
6. Provide specific improvement recommendations.
7. Suggest 4-5 specific foods that would complement the current intake to improve nutritional balance.

Format your response as a JSON object with the following structure and nothing else:
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
