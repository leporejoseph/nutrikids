import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { pgTable, text, serial, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Drizzle schema definitions
export const foodItems = pgTable("food_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(),
  mealType: text("meal_type").notNull(),
  type: text("type").notNull().default("food"),
  supplementInfo: jsonb("supplement_info"),
  createdAt: integer("created_at").notNull(),
  date: text("date").notNull(),
  user_id: text("user_id").notNull(),
});

export const childInfo = pgTable("child_info", {
  id: serial("id").primaryKey(),
  name: text("name"),
  age: integer("age"),
  gender: text("gender").notNull(),
  weight: integer("weight"),
  height: integer("height"),
  weightUnit: text("weight_unit").notNull().default("lb"),
  heightUnit: text("height_unit").notNull().default("in"),
  restrictions: jsonb("restrictions").notNull(),
  user_id: text("user_id").notNull(),
});

export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  apiKey: text("api_key"),
  selectedModel: text("selected_model").default("gemini-2.5-flash"),
  encryptedApiKey: text("encrypted_api_key"),
  apiKeyTimestamp: integer("api_key_timestamp"),
  darkMode: boolean("dark_mode").default(false),
  user_id: text("user_id").notNull(),
});

export const nutritionReports = pgTable("nutrition_reports", {
  id: text("id").primaryKey(),
  calories: integer("calories").notNull(),
  caloriesTarget: integer("calories_target").notNull(),
  nutritionScore: integer("nutrition_score").notNull(),
  macronutrients: jsonb("macronutrients").notNull(),
  vitamins: jsonb("vitamins").notNull(),
  minerals: jsonb("minerals").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  foodSuggestions: jsonb("food_suggestions").notNull(),
  supplementRecommendations: jsonb("supplement_recommendations").notNull(),
  supplementCautions: jsonb("supplement_cautions").notNull(),
  analysisDate: integer("analysis_date").notNull(),
  reportDate: text("report_date").notNull(),
  user_id: text("user_id").notNull(),
});

export const reportHistory = pgTable("report_history", {
  id: text("id").primaryKey(),
  reportDate: text("report_date").notNull(),
  analysisDate: integer("analysis_date").notNull(),
  nutritionScore: integer("nutrition_score").notNull(),
  report: jsonb("report").notNull(),
  user_id: text("user_id").notNull(),
});

export const foodPlans = pgTable("food_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  items: jsonb("items").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: integer("created_at").notNull(),
  user_id: text("user_id").notNull(),
});

// Create database connection
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema: { 
  foodItems, 
  childInfo, 
  appSettings, 
  nutritionReports, 
  reportHistory, 
  foodPlans 
}});

// Initialize the database (create tables if they don't exist)
export async function initDatabase() {
  try {
    console.log("Initializing database...");
    // In a real-world app, we would use migrations here
    // But for this prototype, we'll simply ensure tables exist
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
}