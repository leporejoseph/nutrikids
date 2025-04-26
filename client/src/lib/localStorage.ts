import { FoodItem, ChildInfo, AppSettings, NutritionReport, FoodPlan, ReportHistoryItem, MultiChildReport } from "@shared/schema";
import { DEFAULT_APP_SETTINGS, DEFAULT_CHILD_INFO, DEFAULT_CHILD, STORAGE_KEYS } from "./constants";

// Simple encryption function for API keys
function encryptApiKey(key: string): string {
  // Basic encryption using Base64 and reversing the string for session storage
  if (!key) return '';
  const reversed = key.split('').reverse().join('');
  return window.btoa(reversed);
}

// Decryption function for API keys
function decryptApiKey(encryptedKey: string): string {
  if (!encryptedKey) return '';
  try {
    const decoded = window.atob(encryptedKey);
    return decoded.split('').reverse().join('');
  } catch (error) {
    console.error("Error decrypting API key:", error);
    return '';
  }
}

// Food items management
export function getFoodItems(): FoodItem[] {
  try {
    const items = localStorage.getItem(STORAGE_KEYS.FOOD_ITEMS);
    return items ? JSON.parse(items) : [];
  } catch (error) {
    console.error("Error retrieving food items from localStorage:", error);
    return [];
  }
}

export function saveFoodItems(items: FoodItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FOOD_ITEMS, JSON.stringify(items));
  } catch (error) {
    console.error("Error saving food items to localStorage:", error);
  }
}

export function clearFoodItems(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.FOOD_ITEMS);
  } catch (error) {
    console.error("Error clearing food items from localStorage:", error);
  }
}

// Child information management
export function getChildInfo(): ChildInfo {
  try {
    const info = localStorage.getItem(STORAGE_KEYS.CHILD_INFO);
    
    if (info) {
      const parsedInfo = JSON.parse(info);
      
      // Handle migration of data from older versions that don't have units
      if (parsedInfo.children?.length > 0) {
        parsedInfo.children.forEach((child: any) => {
          if (!child.weightUnit) {
            child.weightUnit = DEFAULT_CHILD.weightUnit;
          }
          if (!child.heightUnit) {
            child.heightUnit = DEFAULT_CHILD.heightUnit;
          }
        });
      }
      
      return parsedInfo as ChildInfo;
    }
    
    return DEFAULT_CHILD_INFO;
  } catch (error) {
    console.error("Error retrieving child info from localStorage:", error);
    return DEFAULT_CHILD_INFO;
  }
}

export function saveChildInfo(info: ChildInfo): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHILD_INFO, JSON.stringify(info));
  } catch (error) {
    console.error("Error saving child info to localStorage:", error);
  }
}

// App settings management
export function getAppSettings(): AppSettings {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    const parsedSettings = settings ? JSON.parse(settings) : DEFAULT_APP_SETTINGS;
    
    // Ensure all required fields have defaults
    const fullSettings = {
      ...DEFAULT_APP_SETTINGS,
      ...parsedSettings
    };
    
    // If encrypted API key exists, decrypt it
    if (fullSettings.encryptedApiKey && fullSettings.apiKeyTimestamp) {
      const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
      const currentTime = new Date().getTime();
      
      if (currentTime - fullSettings.apiKeyTimestamp > oneYearInMs) {
        // API key has expired, clear it
        fullSettings.apiKey = "";
        delete (fullSettings as any).encryptedApiKey;
        saveAppSettings(fullSettings);
      } else {
        // Decrypt API key
        fullSettings.apiKey = decryptApiKey(fullSettings.encryptedApiKey);
      }
    }
    
    return fullSettings;
  } catch (error) {
    console.error("Error retrieving app settings from localStorage:", error);
    return DEFAULT_APP_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    // Create a copy of settings that we can modify
    const settingsToSave = { ...settings } as any;
    
    // If the API key is being updated, encrypt it and add a timestamp
    if (settings.apiKey) {
      settingsToSave.encryptedApiKey = encryptApiKey(settings.apiKey);
      settingsToSave.apiKeyTimestamp = new Date().getTime();
      
      // Create a new object without the API key property for storage
      const safeSettings = { ...settingsToSave };
      delete safeSettings.apiKey; // Safe delete on any type
      
      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(safeSettings));
    } else {
      // Make sure apiKey is not undefined
      settingsToSave.apiKey = settingsToSave.apiKey || "";
      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settingsToSave));
    }
    
    // Dark mode functionality removed
  } catch (error) {
    console.error("Error saving app settings to localStorage:", error);
  }
}

// Nutrition report management
export function getNutritionReport(): NutritionReport | null {
  try {
    const report = localStorage.getItem(STORAGE_KEYS.NUTRITION_REPORT);
    return report ? JSON.parse(report) : null;
  } catch (error) {
    console.error("Error retrieving nutrition report from localStorage:", error);
    return null;
  }
}

export function saveNutritionReport(report: NutritionReport): void {
  try {
    // Ensure the report has the required fields for history
    if (!report.id) {
      report.id = crypto.randomUUID();
    }
    if (!report.analysisDate) {
      report.analysisDate = Date.now();
    }
    if (!report.reportDate) {
      report.reportDate = new Date().toISOString().split('T')[0];
    }
    
    // Save the current report
    localStorage.setItem(STORAGE_KEYS.NUTRITION_REPORT, JSON.stringify(report));
    
    // Also save to history
    saveReportToHistory(report);
  } catch (error) {
    console.error("Error saving nutrition report to localStorage:", error);
  }
}

export function clearNutritionReport(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.NUTRITION_REPORT);
  } catch (error) {
    console.error("Error clearing nutrition report from localStorage:", error);
  }
}

// Report history management
export function getReportHistory(): ReportHistoryItem[] {
  try {
    const history = localStorage.getItem(STORAGE_KEYS.REPORT_HISTORY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Error retrieving report history from localStorage:", error);
    return [];
  }
}

export function saveReportToHistory(report: NutritionReport): void {
  try {
    const history = getReportHistory();
    
    // Create a history item from the report
    const historyItem: ReportHistoryItem = {
      id: report.id || crypto.randomUUID(),
      reportDate: report.reportDate || new Date().toISOString().split('T')[0],
      analysisDate: report.analysisDate || Date.now(),
      nutritionScore: report.nutritionScore,
      report: report
    };
    
    // Check if this report already exists in history (by ID)
    const existingIndex = history.findIndex(item => item.id === historyItem.id);
    
    if (existingIndex >= 0) {
      // Update existing report
      history[existingIndex] = historyItem;
    } else {
      // Add new report to history
      history.push(historyItem);
    }
    
    // Sort history by report date (newest first)
    history.sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
    
    // Remove old reports (older than 1 year)
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const filteredHistory = history.filter(item => item.analysisDate > oneYearAgo);
    
    // Save updated history
    localStorage.setItem(STORAGE_KEYS.REPORT_HISTORY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error("Error saving report to history in localStorage:", error);
  }
}

export function deleteReportFromHistory(reportId: string): void {
  try {
    const history = getReportHistory();
    const updatedHistory = history.filter(item => item.id !== reportId);
    localStorage.setItem(STORAGE_KEYS.REPORT_HISTORY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Error deleting report from history in localStorage:", error);
  }
}

export function clearReportHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.REPORT_HISTORY);
  } catch (error) {
    console.error("Error clearing report history from localStorage:", error);
  }
}

// Food plans management
export function getFoodPlans(): FoodPlan[] {
  try {
    const plans = localStorage.getItem(STORAGE_KEYS.FOOD_PLANS);
    return plans ? JSON.parse(plans) : [];
  } catch (error) {
    console.error("Error retrieving food plans from localStorage:", error);
    return [];
  }
}

export function saveFoodPlan(plan: FoodPlan): void {
  try {
    const plans = getFoodPlans();
    
    // Check if plan with this ID already exists
    const existingPlanIndex = plans.findIndex(p => p.id === plan.id);
    
    if (existingPlanIndex >= 0) {
      // Update existing plan
      plans[existingPlanIndex] = plan;
    } else {
      // Add new plan
      plans.push(plan);
    }
    
    // If this is the default plan, make sure no others are marked as default
    if (plan.isDefault) {
      plans.forEach(p => {
        if (p.id !== plan.id) {
          p.isDefault = false;
        }
      });
    }
    
    localStorage.setItem(STORAGE_KEYS.FOOD_PLANS, JSON.stringify(plans));
  } catch (error) {
    console.error("Error saving food plan to localStorage:", error);
  }
}

export function deleteFoodPlan(planId: string): void {
  try {
    const plans = getFoodPlans();
    const deletedPlan = plans.find(plan => plan.id === planId);
    const updatedPlans = plans.filter(plan => plan.id !== planId);
    localStorage.setItem(STORAGE_KEYS.FOOD_PLANS, JSON.stringify(updatedPlans));
    
    // If we deleted the default plan, we need to clear that reference
    if (deletedPlan?.isDefault) {
      // No default plan anymore - this is just an example, we don't actually
      // store the default plan ID separately in this implementation
    }
  } catch (error) {
    console.error("Error deleting food plan from localStorage:", error);
  }
}

export function getDefaultFoodPlan(): FoodPlan | null {
  try {
    const plans = getFoodPlans();
    return plans.find(plan => plan.isDefault) || null;
  } catch (error) {
    console.error("Error getting default food plan from localStorage:", error);
    return null;
  }
}

// Multi-child report management
export function getMultiChildReport(): MultiChildReport | null {
  try {
    const report = localStorage.getItem(STORAGE_KEYS.MULTI_CHILD_REPORT);
    return report ? JSON.parse(report) : null;
  } catch (error) {
    console.error("Error retrieving multi-child report from localStorage:", error);
    return null;
  }
}

export function saveMultiChildReport(report: MultiChildReport): void {
  try {
    // Ensure the report has the required fields
    if (!report.id) {
      report.id = crypto.randomUUID();
    }
    if (!report.analysisDate) {
      report.analysisDate = Date.now();
    }
    if (!report.reportDate) {
      report.reportDate = new Date().toISOString().split('T')[0];
    }
    
    // Save the multi-child report
    localStorage.setItem(STORAGE_KEYS.MULTI_CHILD_REPORT, JSON.stringify(report));
    
    // Also save individual reports to history
    Object.entries(report.childReports).forEach(([childId, childReport]) => {
      saveReportToHistory(childReport);
    });
  } catch (error) {
    console.error("Error saving multi-child report to localStorage:", error);
  }
}

export function clearMultiChildReport(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.MULTI_CHILD_REPORT);
  } catch (error) {
    console.error("Error clearing multi-child report from localStorage:", error);
  }
}
