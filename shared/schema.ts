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
  createdAt: z.number(),
  date: z.string().default(() => new Date().toISOString().split('T')[0]), // Store as YYYY-MM-DD
});

export type FoodItem = z.infer<typeof foodItemSchema>;

// Child Information Schema
export const childInfoSchema = z.object({
  age: z.number().nullable(),
  gender: z.string(),
  weight: z.number().nullable(),
  height: z.number().nullable(),
  weightUnit: z.enum(["lb", "kg"]).default("lb"),
  heightUnit: z.enum(["in", "cm"]).default("in"),
  restrictions: z.array(z.string()),
});

export type ChildInfo = z.infer<typeof childInfoSchema>;

// App Settings Schema
export const appSettingsSchema = z.object({
  apiKey: z.string().optional().default(""),
  selectedModel: z.string().optional().default("gemini-2.5-flash"),
  darkMode: z.boolean().optional().default(false),
  notifications: z.boolean().optional().default(false),
  encryptedApiKey: z.string().optional(),
  apiKeyTimestamp: z.number().optional(),
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
});

export type NutritionReport = z.infer<typeof nutritionReportSchema>;
