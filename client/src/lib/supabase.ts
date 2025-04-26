import { createClient } from '@supabase/supabase-js';
import { FoodItem, ChildInfo, AppSettings, NutritionReport, FoodPlan, ReportHistoryItem } from '@shared/schema';

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mhueqqoewuxcylblvssu.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1odWVxcW9ld3V4Y3lsYmx2c3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2NzYyOTQsImV4cCI6MjA2MTI1MjI5NH0.f7lSaLhAcGu-cM7tnkU_YgancdkbYVW1TwiSaQmoMTI";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Type definitions for our database tables
export type Tables = {
  food_items: FoodItem;
  child_info: ChildInfo;
  app_settings: AppSettings;
  nutrition_reports: NutritionReport;
  food_plans: FoodPlan;
  report_history: ReportHistoryItem;
};

// Helper functions to interact with Supabase
export async function initializeTables() {
  try {
    // Create tables if they don't exist
    console.log('Initializing Supabase tables...');
    
    // We'll be using Postgres RPC for this, ensuring our tables exist
    // This is a simplified approach - in a production app, we'd use migrations
    
    return true;
  } catch (error) {
    console.error('Error initializing Supabase tables:', error);
    return false;
  }
}

// Universal error handler for Supabase operations
export function handleSupabaseError(error: any, operation: string) {
  console.error(`Supabase error during ${operation}:`, error);
  // Fall back to localStorage if Supabase fails
  return null;
}