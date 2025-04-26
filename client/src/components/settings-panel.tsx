import { useEffect, useState } from "react";
import { AppSettings, ChildInfo, childInfoSchema, appSettingsSchema } from "@shared/schema";
import { DEFAULT_APP_SETTINGS, DEFAULT_CHILD_INFO, GEMINI_MODELS, DIETARY_RESTRICTIONS } from "@/lib/constants";
import { getAppSettings, saveAppSettings, getChildInfo, saveChildInfo } from "@/lib/localStorage";
import { X, Check, Shield, Save, Loader2 } from "lucide-react";
import { fetchAvailableGeminiModels, GeminiModel } from "@/lib/ai";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [childInfo, setChildInfo] = useState<ChildInfo>(DEFAULT_CHILD_INFO);
  const [availableModels, setAvailableModels] = useState<GeminiModel[]>(GEMINI_MODELS);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const { toast } = useToast();

  const settingsForm = useForm<AppSettings>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: settings,
  });

  const childInfoForm = useForm<ChildInfo>({
    resolver: zodResolver(childInfoSchema),
    defaultValues: childInfo,
  });

  useEffect(() => {
    if (isOpen) {
      const storedSettings = getAppSettings();
      const storedChildInfo = getChildInfo();
      
      setSettings(storedSettings);
      setChildInfo(storedChildInfo);
      
      settingsForm.reset(storedSettings);
      childInfoForm.reset(storedChildInfo);
      
      // If API key is present, fetch available models
      if (storedSettings.apiKey) {
        fetchModels(storedSettings.apiKey);
      }
    }
  }, [isOpen, settingsForm, childInfoForm]);
  
  // Function to fetch available models when API key is provided
  const fetchModels = async (apiKey: string) => {
    if (!apiKey) return;
    
    setIsLoadingModels(true);
    try {
      const models = await fetchAvailableGeminiModels(apiKey);
      if (models && models.length > 0) {
        setAvailableModels(models);
        toast({
          title: "Models Updated",
          description: `Retrieved ${models.length} available Gemini models.`,
        });
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      toast({
        title: "Error Fetching Models",
        description: "Could not retrieve available models. Using default list.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSaveSettings = (data: AppSettings) => {
    saveAppSettings(data);
    setSettings(data);
    
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
    
    onClose();
  };

  const handleSaveChildInfo = (data: ChildInfo) => {
    saveChildInfo(data);
    setChildInfo(data);
    
    toast({
      title: "Child Information Saved",
      description: "Your child's information has been saved successfully.",
    });
    
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Always save regardless of validation state since all fields are optional
    const settingsData = settingsForm.getValues();
    const childInfoData = childInfoForm.getValues();
    
    // Save settings
    handleSaveSettings(settingsData);
    
    // Save child info
    handleSaveChildInfo(childInfoData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative min-h-screen max-w-md mx-auto bg-white shadow-lg animate-in slide-in-from-right">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="font-inter font-bold text-xl">Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 pb-24 overflow-y-auto max-h-[calc(100vh-60px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Key Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-lg mb-3">Google Gemini API Settings</h3>
              <div className="space-y-4">
                <Form {...settingsForm}>
                  <FormField
                    control={settingsForm.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel className="font-medium">API Key</FormLabel>
                          {field.value ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Active
                            </Badge>
                          ) : null}
                        </div>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your Gemini API key"
                              className="w-full p-3 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent"
                              {...field} 
                            />
                          </FormControl>
                          <Shield className="h-4 w-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Your API key is encrypted and stored securely in your local session</p>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={settingsForm.control}
                    name="selectedModel"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <div className="flex justify-between items-center">
                          <FormLabel className="font-medium">Model</FormLabel>
                          {isLoadingModels && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" /> Loading models...
                            </Badge>
                          )}
                        </div>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent">
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableModels.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-gray-500">Select the model to use for nutrition analysis</p>
                          {settingsForm.getValues().apiKey && (
                            <button 
                              type="button" 
                              onClick={() => fetchModels(settingsForm.getValues().apiKey || "")}
                              className="text-xs text-primary hover:text-primary/80 flex items-center"
                              disabled={isLoadingModels}
                            >
                              {isLoadingModels ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20 12a8 8 0 1 0-8 8h.5a7.5 7.5 0 0 0 7.5-7.5v-.5" />
                                  <path d="M16 8V4H12" />
                                  <path d="M3 16h4v4" />
                                </svg>
                              )}
                              Refresh Models
                            </button>
                          )}
                        </div>
                      </FormItem>
                    )}
                  />
                </Form>
              </div>
            </div>

            {/* Child Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-lg mb-3">Child Information</h3>
              <div className="space-y-4">
                <Form {...childInfoForm}>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={childInfoForm.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Age</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              max="18" 
                              placeholder="Age"
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent"
                              value={field.value === null ? '' : field.value.toString()}
                              onChange={(e) => {
                                const value = e.target.value ? parseInt(e.target.value) : null;
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={childInfoForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="not-specified">Select</SelectItem>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={childInfoForm.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Weight (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              step="0.1" 
                              placeholder="Weight"
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent"
                              value={field.value === null ? '' : field.value.toString()}
                              onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : null;
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={childInfoForm.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Height (cm)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="30" 
                              placeholder="Height"
                              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent"
                              value={field.value === null ? '' : field.value.toString()}
                              onChange={(e) => {
                                const value = e.target.value ? parseFloat(e.target.value) : null;
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={childInfoForm.control}
                    name="restrictions"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel className="font-medium">Dietary Restrictions</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {DIETARY_RESTRICTIONS.map((restriction) => (
                              <div key={restriction.value} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`restriction-${restriction.value}`}
                                  value={restriction.value}
                                  checked={field.value.includes(restriction.value)}
                                  onChange={(e) => {
                                    const newRestrictions = e.target.checked
                                      ? [...field.value, restriction.value]
                                      : field.value.filter(r => r !== restriction.value);
                                    
                                    field.onChange(newRestrictions);
                                  }}
                                  className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor={`restriction-${restriction.value}`}>
                                  {restriction.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </Form>
              </div>
            </div>

            {/* App Preferences */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-lg mb-3">App Preferences</h3>
              <div className="space-y-4">
                <Form {...settingsForm}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Dark Mode</span>
                    <FormField
                      control={settingsForm.control}
                      name="darkMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="font-medium">Notification Reminders</span>
                    <FormField
                      control={settingsForm.control}
                      name="notifications"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </div>
            </div>
          </form>
          
          {/* Floating Save Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-md max-w-md mx-auto">
            <Button 
              type="button"
              onClick={handleSubmit}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-md transition flex items-center justify-center"
            >
              <Save className="w-4 h-4 mr-2" /> Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
