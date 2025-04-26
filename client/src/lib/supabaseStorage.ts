import { supabase, handleSupabaseError } from './supabase';
import { FoodItem, ChildInfo, AppSettings, NutritionReport, FoodPlan, ReportHistoryItem } from '@shared/schema';
import { STORAGE_KEYS, DEFAULT_CHILD_INFO, DEFAULT_APP_SETTINGS } from './constants';
import { getFoodItems as getLocalFoodItems, 
  getChildInfo as getLocalChildInfo, 
  getAppSettings as getLocalAppSettings,
  getNutritionReport as getLocalNutritionReport,
  getFoodPlans as getLocalFoodPlans,
  getReportHistory as getLocalReportHistory,
  saveFoodItems as saveLocalFoodItems,
  saveChildInfo as saveLocalChildInfo,
  saveAppSettings as saveLocalAppSettings,
  saveNutritionReport as saveLocalNutritionReport,
  saveFoodPlan as saveLocalFoodPlan,
  deleteFoodPlan as deleteLocalFoodPlan,
  saveReportToHistory as saveLocalReportToHistory,
  deleteReportFromHistory as deleteLocalReportFromHistory,
  clearFoodItems as clearLocalFoodItems,
  clearNutritionReport as clearLocalNutritionReport,
  clearReportHistory as clearLocalReportHistory
} from './localStorage';

// User ID for the current session - in a real app, this would come from authentication
const USER_ID = 'default-user';

// FOOD ITEMS
export async function getFoodItems(): Promise<FoodItem[]> {
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('user_id', USER_ID);
      
    if (error) throw error;
    
    return data as FoodItem[] || [];
  } catch (error) {
    handleSupabaseError(error, 'getFoodItems');
    // Fall back to localStorage
    return getLocalFoodItems();
  }
}

export async function saveFoodItems(items: FoodItem[]): Promise<void> {
  try {
    // First, delete all existing items for this user
    const { error: deleteError } = await supabase
      .from('food_items')
      .delete()
      .eq('user_id', USER_ID);
      
    if (deleteError) throw deleteError;
    
    // Then insert the new items
    if (items.length > 0) {
      const itemsWithUserId = items.map(item => ({
        ...item,
        user_id: USER_ID
      }));
      
      const { error: insertError } = await supabase
        .from('food_items')
        .insert(itemsWithUserId);
        
      if (insertError) throw insertError;
    }
  } catch (error) {
    handleSupabaseError(error, 'saveFoodItems');
    // Fall back to localStorage
    saveLocalFoodItems(items);
  }
}

export async function clearFoodItems(): Promise<void> {
  try {
    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('user_id', USER_ID);
      
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error, 'clearFoodItems');
    // Fall back to localStorage
    clearLocalFoodItems();
  }
}

// CHILD INFO
export async function getChildInfo(): Promise<ChildInfo> {
  try {
    const { data, error } = await supabase
      .from('child_info')
      .select('*')
      .eq('user_id', USER_ID)
      .maybeSingle();
      
    if (error) throw error;
    
    return data as ChildInfo || DEFAULT_CHILD_INFO;
  } catch (error) {
    handleSupabaseError(error, 'getChildInfo');
    // Fall back to localStorage
    return getLocalChildInfo();
  }
}

export async function saveChildInfo(info: ChildInfo): Promise<void> {
  try {
    const { data, error: checkError } = await supabase
      .from('child_info')
      .select('id')
      .eq('user_id', USER_ID)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    const infoWithUserId = {
      ...info,
      user_id: USER_ID
    };
    
    if (data) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('child_info')
        .update(infoWithUserId)
        .eq('user_id', USER_ID);
        
      if (updateError) throw updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('child_info')
        .insert(infoWithUserId);
        
      if (insertError) throw insertError;
    }
  } catch (error) {
    handleSupabaseError(error, 'saveChildInfo');
    // Fall back to localStorage
    saveLocalChildInfo(info);
  }
}

// APP SETTINGS
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('user_id', USER_ID)
      .maybeSingle();
      
    if (error) throw error;
    
    return data as AppSettings || DEFAULT_APP_SETTINGS;
  } catch (error) {
    handleSupabaseError(error, 'getAppSettings');
    // Fall back to localStorage
    return getLocalAppSettings();
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  try {
    const { data, error: checkError } = await supabase
      .from('app_settings')
      .select('id')
      .eq('user_id', USER_ID)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    const settingsWithUserId = {
      ...settings,
      user_id: USER_ID
    };
    
    if (data) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('app_settings')
        .update(settingsWithUserId)
        .eq('user_id', USER_ID);
        
      if (updateError) throw updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('app_settings')
        .insert(settingsWithUserId);
        
      if (insertError) throw insertError;
    }
  } catch (error) {
    handleSupabaseError(error, 'saveAppSettings');
    // Fall back to localStorage
    saveLocalAppSettings(settings);
  }
}

// NUTRITION REPORT
export async function getNutritionReport(): Promise<NutritionReport | null> {
  try {
    const { data, error } = await supabase
      .from('nutrition_reports')
      .select('*')
      .eq('user_id', USER_ID)
      .order('analysisDate', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) throw error;
    
    return data as NutritionReport || null;
  } catch (error) {
    handleSupabaseError(error, 'getNutritionReport');
    // Fall back to localStorage
    return getLocalNutritionReport();
  }
}

export async function saveNutritionReport(report: NutritionReport): Promise<void> {
  try {
    const reportWithUserId = {
      ...report,
      user_id: USER_ID
    };
    
    const { error } = await supabase
      .from('nutrition_reports')
      .insert(reportWithUserId);
      
    if (error) throw error;
    
    // Also save to report history
    await saveReportToHistory(report);
  } catch (error) {
    handleSupabaseError(error, 'saveNutritionReport');
    // Fall back to localStorage
    saveLocalNutritionReport(report);
  }
}

export async function clearNutritionReport(): Promise<void> {
  try {
    const { error } = await supabase
      .from('nutrition_reports')
      .delete()
      .eq('user_id', USER_ID);
      
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error, 'clearNutritionReport');
    // Fall back to localStorage
    clearLocalNutritionReport();
  }
}

// REPORT HISTORY
export async function getReportHistory(): Promise<ReportHistoryItem[]> {
  try {
    const { data, error } = await supabase
      .from('report_history')
      .select('*')
      .eq('user_id', USER_ID)
      .order('analysisDate', { ascending: false });
      
    if (error) throw error;
    
    return data as ReportHistoryItem[] || [];
  } catch (error) {
    handleSupabaseError(error, 'getReportHistory');
    // Fall back to localStorage
    return getLocalReportHistory();
  }
}

export async function saveReportToHistory(report: NutritionReport): Promise<void> {
  try {
    // Create the history item with required fields
    const historyItem = {
      id: report.id || crypto.randomUUID(),
      reportDate: report.reportDate || new Date().toISOString().split('T')[0],
      analysisDate: report.analysisDate || Date.now(),
      nutritionScore: report.nutritionScore,
      report: report,
      user_id: USER_ID
    };
    
    const { error } = await supabase
      .from('report_history')
      .insert(historyItem);
      
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error, 'saveReportToHistory');
    // Fall back to localStorage
    saveLocalReportToHistory(report);
  }
}

export async function deleteReportFromHistory(reportId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('report_history')
      .delete()
      .eq('id', reportId)
      .eq('user_id', USER_ID);
      
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error, 'deleteReportFromHistory');
    // Fall back to localStorage
    deleteLocalReportFromHistory(reportId);
  }
}

export async function clearReportHistory(): Promise<void> {
  try {
    const { error } = await supabase
      .from('report_history')
      .delete()
      .eq('user_id', USER_ID);
      
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error, 'clearReportHistory');
    // Fall back to localStorage
    clearLocalReportHistory();
  }
}

// FOOD PLANS
export async function getFoodPlans(): Promise<FoodPlan[]> {
  try {
    const { data, error } = await supabase
      .from('food_plans')
      .select('*')
      .eq('user_id', USER_ID);
      
    if (error) throw error;
    
    return data as FoodPlan[] || [];
  } catch (error) {
    handleSupabaseError(error, 'getFoodPlans');
    // Fall back to localStorage
    return getLocalFoodPlans();
  }
}

export async function saveFoodPlan(plan: FoodPlan): Promise<void> {
  try {
    const planWithUserId = {
      ...plan,
      user_id: USER_ID
    };
    
    const { error } = await supabase
      .from('food_plans')
      .insert(planWithUserId);
      
    if (error) throw error;
    
    // If this is a default plan, update all other plans to not be default
    if (plan.isDefault) {
      const { error: updateError } = await supabase
        .from('food_plans')
        .update({ isDefault: false })
        .neq('id', plan.id)
        .eq('user_id', USER_ID);
        
      if (updateError) throw updateError;
    }
  } catch (error) {
    handleSupabaseError(error, 'saveFoodPlan');
    // Fall back to localStorage
    saveLocalFoodPlan(plan);
  }
}

export async function deleteFoodPlan(planId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('food_plans')
      .delete()
      .eq('id', planId)
      .eq('user_id', USER_ID);
      
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error, 'deleteFoodPlan');
    // Fall back to localStorage
    deleteLocalFoodPlan(planId);
  }
}

export async function getDefaultFoodPlan(): Promise<FoodPlan | null> {
  try {
    const { data, error } = await supabase
      .from('food_plans')
      .select('*')
      .eq('isDefault', true)
      .eq('user_id', USER_ID)
      .maybeSingle();
      
    if (error) throw error;
    
    return data as FoodPlan || null;
  } catch (error) {
    handleSupabaseError(error, 'getDefaultFoodPlan');
    // Fall back to localStorage
    const plans = getLocalFoodPlans();
    return plans.find(plan => plan.isDefault) || null;
  }
}