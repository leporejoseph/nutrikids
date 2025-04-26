import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (unused in this app but kept for compatibility)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Food Item Schema
export const foodItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  mealType: z.string(),
  type: z.enum(["food", "drink", "supplement"]).default("food"),
  supplementInfo: z.object({
    dosage: z.string().optional(),
    frequency: z.string().optional(),
    purpose: z.string().optional(),
    warnings: z.string().optional(),
  }).optional(),
  createdAt: z.number(),
  date: z.string().default(() => new Date().toISOString().split('T')[0]), // Store as YYYY-MM-DD
  user_id: z.string().optional(), // Added for Supabase integration
});

export type FoodItem = z.infer<typeof foodItemSchema>;

// Child Information Schema
export const childInfoSchema = z.object({
  name: z.string().optional(),
  age: z.number().nullable(),
  gender: z.string(),
  weight: z.number().nullable(),
  height: z.number().nullable(),
  weightUnit: z.enum(["lb", "kg"]).default("lb"),
  heightUnit: z.enum(["in", "cm"]).default("in"),
  restrictions: z.array(z.string()),
  user_id: z.string().optional(), // Added for Supabase integration
});

export type ChildInfo = z.infer<typeof childInfoSchema>;

// App Settings Schema
export const appSettingsSchema = z.object({
  apiKey: z.string().optional().default(""),
  selectedModel: z.string().optional().default("gemini-2.5-flash"),
  encryptedApiKey: z.string().optional(),
  apiKeyTimestamp: z.number().optional(),
  user_id: z.string().optional(), // Added for Supabase integration
});

export type AppSettings = z.infer<typeof appSettingsSchema>;

// Nutritional Analysis Result Schema
export const nutrientSchema = z.object({
  name: z.string(),
  value: z.string(),
  unit: z.string(),
  percentOfDaily: z.number(),
  recommendedRange: z.string(),
});

export type Nutrient = z.infer<typeof nutrientSchema>;

export const nutritionReportSchema = z.object({
  calories: z.number(),
  caloriesTarget: z.number(),
  nutritionScore: z.number(),
  macronutrients: z.array(nutrientSchema),
  vitamins: z.array(nutrientSchema),
  minerals: z.array(nutrientSchema),
  recommendations: z.array(z.string()),
  foodSuggestions: z.array(z.string()),
  supplementRecommendations: z.array(z.string()).optional().default([]),
  supplementCautions: z.array(z.string()).optional().default([]),
  analysisDate: z.number().default(() => Date.now()),
  reportDate: z.string().optional(), // The date for which the report was generated (YYYY-MM-DD)
  id: z.string().optional(), // Unique ID for each report
  user_id: z.string().optional(), // Added for Supabase integration
});

export type NutritionReport = z.infer<typeof nutritionReportSchema>;

// Schema for saved report history
export const reportHistoryItemSchema = z.object({
  id: z.string(),
  reportDate: z.string(), // YYYY-MM-DD format
  analysisDate: z.number(),
  nutritionScore: z.number(),
  report: nutritionReportSchema,
  user_id: z.string().optional(), // Added for Supabase integration
});

export type ReportHistoryItem = z.infer<typeof reportHistoryItemSchema>;

// Food Plan / Favorites Schema
export const foodPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  items: z.array(foodItemSchema),
  isDefault: z.boolean().default(false),
  createdAt: z.number(),
});

export type FoodPlan = z.infer<typeof foodPlanSchema>;
