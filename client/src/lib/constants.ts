// API Models - Using only Gemini 2.5 models as requested
export const GEMINI_MODELS = [
  { id: "gemini-2.5-pro-preview-03-25", name: "Gemini 2.5 Pro Preview" },
  { id: "gemini-2.5-flash-preview-04-17", name: "Gemini 2.5 Flash Preview" },
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
  { value: "morning_snack", label: "Morning Snack" },
  { value: "lunch", label: "Lunch" },
  { value: "afternoon_snack", label: "Afternoon Snack" },
  { value: "dinner", label: "Dinner" },
  { value: "dessert", label: "Dessert" },
  { value: "evening_snack", label: "Evening Snack" },
  { value: "snack", label: "Snack (Other)" },
  { value: "beverage", label: "Beverage" },
];

// Drink Units
export const DRINK_UNITS = [
  { value: "ml", label: "milliliter(s)" },
  { value: "oz", label: "ounce(s)" },
  { value: "cup", label: "cup(s)" },
  { value: "bottle", label: "bottle(s)" },
  { value: "can", label: "can(s)" },
  { value: "glass", label: "glass(es)" },
  { value: "serving", label: "serving(s)" },
  { value: "tbsp", label: "tablespoon(s)" },
  { value: "tsp", label: "teaspoon(s)" },
];

// Supplement Units
export const SUPPLEMENT_UNITS = [
  { value: "pill", label: "pill(s)" },
  { value: "capsule", label: "capsule(s)" },
  { value: "tablet", label: "tablet(s)" },
  { value: "drop", label: "drop(s)" },
  { value: "ml", label: "ml" },
  { value: "mcg", label: "mcg" },
  { value: "mg", label: "mg" },
  { value: "gummy", label: "gummy(s)" },
  { value: "packet", label: "packet(s)" },
];

// Supplement Frequencies
export const SUPPLEMENT_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "twice_daily", label: "Twice daily" },
  { value: "three_times_daily", label: "Three times daily" },
  { value: "weekly", label: "Weekly" },
  { value: "as_needed", label: "As needed" },
  { value: "with_food", label: "With food" },
  { value: "before_food", label: "Before food" },
  { value: "after_food", label: "After food" },
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
  MULTI_CHILD_REPORT: "nutrikids-multi-child-report",
  FOOD_PLANS: "nutrikids-food-plans",
  REPORT_HISTORY: "nutrikids-report-history",
};

// Default Values
export const DEFAULT_CHILD = {
  id: crypto.randomUUID(),
  name: "",
  dateOfBirth: null,
  gender: "",
  weight: null,
  height: null,
  weightUnit: "lb" as const,
  heightUnit: "in" as const,
  restrictions: [],
  isSelected: true,
  createdAt: Date.now(),
};

export const DEFAULT_CHILD_INFO = {
  children: [DEFAULT_CHILD],
  selectedChildId: DEFAULT_CHILD.id,
};

export const DEFAULT_APP_SETTINGS = {
  apiKey: "",
  selectedModel: "gemini-2.5-flash-preview-04-17",
  darkMode: false,
};

// Images for visual appeal
export const APP_IMAGES = {
  fruits: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=200&h=200&fit=crop&auto=format",
  vegetables: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop&auto=format",
  childEating: "https://images.unsplash.com/photo-1478144592103-25e218a04891?w=200&h=200&fit=crop&auto=format",
  logo: "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=48&h=48&fit=crop&auto=format",
};
