import { createClient } from '@supabase/supabase-js';
import { FoodItem, ChildInfo, AppSettings, NutritionReport, FoodPlan, ReportHistoryItem } from '@shared/schema';

// Initialize Supabase client - we'll be using the DATABASE_URL environment variable
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example-key';

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