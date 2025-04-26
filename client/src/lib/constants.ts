// API Models
export const GEMINI_MODELS = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash-Lite" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
  { id: "gemini-1.5-flash-8b", name: "Gemini 1.5 Flash-8B" },
];

// Food Units
export const FOOD_UNITS = [
  { value: "piece", label: "piece(s)" },
  { value: "cup", label: "cup(s)" },
  { value: "tbsp", label: "tablespoon(s)" },
  { value: "tsp", label: "teaspoon(s)" },
  { value: "oz", label: "ounce(s)" },
  { value: "g", label: "gram(s)" },
  { value: "ml", label: "milliliter(s)" },
  { value: "serving", label: "serving(s)" },
];

// Meal Types
export const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

// Dietary Restrictions
export const DIETARY_RESTRICTIONS = [
  { value: "none", label: "None" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten-free", label: "Gluten-Free" },
  { value: "dairy-free", label: "Dairy-Free" },
  { value: "nut-free", label: "Nut-Free" },
];

// Local Storage Keys
export const STORAGE_KEYS = {
  FOOD_ITEMS: "nutrikids-food-items",
  CHILD_INFO: "nutrikids-child-info",
  APP_SETTINGS: "nutrikids-app-settings",
  NUTRITION_REPORT: "nutrikids-nutrition-report",
};

// Default Values
export const DEFAULT_CHILD_INFO = {
  age: null,
  gender: "",
  weight: null,
  height: null,
  restrictions: [],
};

export const DEFAULT_APP_SETTINGS = {
  apiKey: "",
  selectedModel: "gemini-2.0-flash",
  darkMode: false,
  notifications: false,
};

// Images for visual appeal
export const APP_IMAGES = {
  fruits: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=200&h=200&fit=crop&auto=format",
  vegetables: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop&auto=format",
  childEating: "https://images.unsplash.com/photo-1478144592103-25e218a04891?w=200&h=200&fit=crop&auto=format",
  logo: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=48&h=48&fit=crop&auto=format",
};
