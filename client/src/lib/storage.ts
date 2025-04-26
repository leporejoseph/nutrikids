import { FoodItem, ChildInfo, AppSettings, NutritionReport, FoodPlan, ReportHistoryItem, MultiChildReport } from '@shared/schema';
import { useLocalStorageFallback } from './env';

// Import storage implementations
import * as localStorageImpl from './localStorage';
import * as supabaseStorageImpl from './supabaseStorage';

// Helper to determine which storage implementation to use
function getStorage() {
  return useLocalStorageFallback() ? localStorageImpl : supabaseStorageImpl;
}

// Food Items
export async function getFoodItems(): Promise<FoodItem[]> {
  const storage = getStorage();
  return storage.getFoodItems();
}

export async function saveFoodItems(items: FoodItem[]): Promise<void> {
  const storage = getStorage();
  return storage.saveFoodItems(items);
}

export async function clearFoodItems(): Promise<void> {
  const storage = getStorage();
  return storage.clearFoodItems();
}

// Child Info
export async function getChildInfo(): Promise<ChildInfo> {
  const storage = getStorage();
  return storage.getChildInfo();
}

export async function saveChildInfo(info: ChildInfo): Promise<void> {
  const storage = getStorage();
  return storage.saveChildInfo(info);
}

// App Settings
export async function getAppSettings(): Promise<AppSettings> {
  const storage = getStorage();
  return storage.getAppSettings();
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  const storage = getStorage();
  return storage.saveAppSettings(settings);
}

// Nutrition Report
export async function getNutritionReport(): Promise<NutritionReport | null> {
  const storage = getStorage();
  return storage.getNutritionReport();
}

export async function saveNutritionReport(report: NutritionReport): Promise<void> {
  const storage = getStorage();
  return storage.saveNutritionReport(report);
}

export async function clearNutritionReport(): Promise<void> {
  const storage = getStorage();
  return storage.clearNutritionReport();
}

// Report History
export async function getReportHistory(): Promise<ReportHistoryItem[]> {
  const storage = getStorage();
  return storage.getReportHistory();
}

export async function saveReportToHistory(report: NutritionReport): Promise<void> {
  const storage = getStorage();
  return storage.saveReportToHistory(report);
}

export async function deleteReportFromHistory(reportId: string): Promise<void> {
  const storage = getStorage();
  return storage.deleteReportFromHistory(reportId);
}

export async function clearReportHistory(): Promise<void> {
  const storage = getStorage();
  return storage.clearReportHistory();
}

// Food Plans
export async function getFoodPlans(): Promise<FoodPlan[]> {
  const storage = getStorage();
  return storage.getFoodPlans();
}

export async function saveFoodPlan(plan: FoodPlan): Promise<void> {
  const storage = getStorage();
  return storage.saveFoodPlan(plan);
}

export async function deleteFoodPlan(planId: string): Promise<void> {
  const storage = getStorage();
  return storage.deleteFoodPlan(planId);
}

export async function getDefaultFoodPlan(): Promise<FoodPlan | null> {
  const storage = getStorage();
  return storage.getDefaultFoodPlan();
}

// Multi-Child Reports
export async function getMultiChildReport(): Promise<MultiChildReport | null> {
  const storage = getStorage();
  try {
    // @ts-ignore: The implementation will be added to the storage providers
    return await storage.getMultiChildReport();
  } catch (error) {
    console.error("Error getting multi-child report:", error);
    return null;
  }
}

export async function saveMultiChildReport(report: MultiChildReport): Promise<void> {
  const storage = getStorage();
  try {
    // @ts-ignore: The implementation will be added to the storage providers
    return await storage.saveMultiChildReport(report);
  } catch (error) {
    console.error("Error saving multi-child report:", error);
  }
}

export async function clearMultiChildReport(): Promise<void> {
  const storage = getStorage();
  try {
    // @ts-ignore: The implementation will be added to the storage providers
    return await storage.clearMultiChildReport();
  } catch (error) {
    console.error("Error clearing multi-child report:", error);
  }
}