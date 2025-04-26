import { useEffect, useState } from "react";
import { AppSettings, ChildInfo, Child, childInfoSchema, appSettingsSchema, childSchema } from "@shared/schema";
import { DEFAULT_APP_SETTINGS, DEFAULT_CHILD_INFO, DEFAULT_CHILD, GEMINI_MODELS, DIETARY_RESTRICTIONS } from "@/lib/constants";
import { getAppSettings, saveAppSettings, getChildInfo, saveChildInfo } from "@/lib/storage";
import { X, Check, Shield, Save, Loader2, Calendar as CalendarIcon, Plus, Trash } from "lucide-react";
import { fetchAvailableGeminiModels, GeminiModel } from "@/lib/ai";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { DayPicker } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
      const loadSettings = async () => {
        try {
          const storedSettings = await getAppSettings();
          const storedChildInfo = await getChildInfo();
          
          // Now we have the actual objects
          setSettings(storedSettings);
          setChildInfo(storedChildInfo);
          
          settingsForm.reset(storedSettings);
          childInfoForm.reset(storedChildInfo);
          
          // If API key is present, fetch available models
          if (storedSettings.apiKey) {
            fetchModels(storedSettings.apiKey);
          }
        } catch (error) {
          console.error("Error loading settings:", error);
          toast({
            title: "Error Loading Settings",
            description: "There was a problem loading your settings. Default values will be used.",
            variant: "destructive",
          });
        }
      };
      
      loadSettings();
    }
  }, [isOpen, settingsForm, childInfoForm, toast]);
  
  // Function to fetch available models when API key is provided
  const fetchModels = async (apiKey: string) => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter a Google Gemini API key to fetch available models.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoadingModels(true);
    try {
      const models = await fetchAvailableGeminiModels(apiKey);
      if (models && models.length > 0) {
        setAvailableModels(models);
        
        // Reset the selected model if it's not in the list
        const currentModel = settingsForm.getValues().selectedModel;
        const modelExists = models.some(model => model.id === currentModel);
        
        if (!modelExists && models.length > 0) {
          settingsForm.setValue("selectedModel", models[0].id);
          
          // Save this change immediately
          const updatedSettings = {
            ...settingsForm.getValues(),
            selectedModel: models[0].id,
            darkMode: settings.darkMode // Keep the darkMode setting
          };
          await saveAppSettings(updatedSettings);
        }
        
        // Don't show a toast for successful model updates - it's too frequent
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

  const handleSaveSettings = async (data: AppSettings) => {
    // Make sure we're saving the latest model ID
    const currentModel = data.selectedModel;
    
    // Validate model selection if we have available models loaded
    if (availableModels.length > 0) {
      const modelExists = availableModels.some(model => model.id === currentModel);
      
      // If model doesn't exist in our list, use the first available one
      if (!modelExists) {
        data.selectedModel = availableModels[0].id;
      }
    }
    
    try {
      // Save settings to cloud storage
      await saveAppSettings(data);
      
      // Update app state
      setSettings(data);
      
      // Apply dark mode setting immediately if it changed
      if (data.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully.",
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error Saving Settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveChildInfo = async (data: ChildInfo) => {
    try {
      await saveChildInfo(data);
      setChildInfo(data);
      
      toast({
        title: "Child Information Saved",
        description: "Your child's information has been saved successfully.",
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving child information:", error);
      toast({
        title: "Error Saving Information",
        description: "There was a problem saving your child's information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Always save regardless of validation state since all fields are optional
    const settingsData = settingsForm.getValues();
    const childInfoData = childInfoForm.getValues();
    
    try {
      // Save settings
      await handleSaveSettings(settingsData);
      
      // Save child info
      await handleSaveChildInfo(childInfoData);
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-20 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative min-h-screen max-w-md mx-auto bg-background shadow-lg animate-in slide-in-from-right">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="font-inter font-bold text-xl">Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 text-foreground"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 pb-24 overflow-y-auto max-h-[calc(100vh-60px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Key Section */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-4">
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
                  
                  {/* Dark Mode Toggle */}
                  <FormField
                    control={settingsForm.control}
                    name="darkMode"
                    render={({ field }) => (
                      <FormItem className="mt-4 flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="font-medium">Dark Mode</FormLabel>
                          <p className="text-xs text-gray-500">
                            Toggle dark mode for the application
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </Form>
              </div>
            </div>

            {/* Children Information */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">Children</h3>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() => {
                    const newChild: Child = {
                      ...DEFAULT_CHILD,
                      id: crypto.randomUUID(),
                      isSelected: false,
                      createdAt: Date.now()
                    };
                    
                    const currentChildren = childInfoForm.getValues().children || [];
                    childInfoForm.setValue('children', [...currentChildren, newChild]);
                  }}
                >
                  <Plus className="h-4 w-4" /> Add Child
                </Button>
              </div>
              
              <div className="space-y-6">
                <Form {...childInfoForm}>
                  <FormField
                    control={childInfoForm.control}
                    name="children"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <>
                            {/* Child Selector Tabs */}
                            {field.value && field.value.length > 0 ? (
                              <div className="space-y-6">
                                <div className="flex gap-2 flex-wrap mb-4">
                                  {field.value.map((child, index) => (
                                    <Button
                                      key={child.id}
                                      type="button"
                                      variant={childInfoForm.watch('selectedChildId') === child.id ? "default" : "outline"}
                                      className="px-3 py-1 h-auto flex items-center gap-1"
                                      onClick={() => {
                                        childInfoForm.setValue('selectedChildId', child.id);
                                      }}
                                    >
                                      {child.name || `Child ${index + 1}`}
                                      {field.value.length > 1 && (
                                        <button
                                          type="button"
                                          className="text-red-500 hover:bg-red-100 rounded-full p-1 ml-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newChildren = field.value.filter(c => c.id !== child.id);
                                            childInfoForm.setValue('children', newChildren);
                                            if (childInfoForm.watch('selectedChildId') === child.id) {
                                              childInfoForm.setValue('selectedChildId', newChildren[0]?.id || null);
                                            }
                                          }}
                                        >
                                          <Trash className="h-3 w-3" />
                                        </button>
                                      )}
                                    </Button>
                                  ))}
                                </div>
                                
                                {/* Selected Child Form */}
                                {field.value.map((child, index) => {
                                  const isSelected = childInfoForm.watch('selectedChildId') === child.id;
                                  if (!isSelected) return null;
                                  
                                  return (
                                    <div key={child.id} className="border border-border rounded-lg p-4">
                                      <div className="mb-4">
                                        <FormLabel className="font-medium block mb-2">Child's Name</FormLabel>
                                        <Input 
                                          placeholder="Enter child's name (optional)"
                                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent"
                                          value={child.name || ''}
                                          onChange={(e) => {
                                            const newChildren = [...field.value];
                                            newChildren[index] = {
                                              ...newChildren[index],
                                              name: e.target.value
                                            };
                                            childInfoForm.setValue('children', newChildren);
                                          }}
                                        />
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-4 mb-4">
                                        {/* Date of Birth Field */}
                                        <div>
                                          <FormLabel className="font-medium block mb-2">Date of Birth</FormLabel>
                                          <div className="relative">
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <Button
                                                  variant={"outline"}
                                                  className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !child.dateOfBirth && "text-muted-foreground"
                                                  )}
                                                >
                                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                                  {child.dateOfBirth ? format(parseISO(child.dateOfBirth), 'PPP') : <span>Pick a date</span>}
                                                </Button>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-auto p-0">
                                                <DayPicker
                                                  mode="single"
                                                  selected={child.dateOfBirth ? parseISO(child.dateOfBirth) : undefined}
                                                  onSelect={(date) => {
                                                    const newChildren = [...field.value];
                                                    newChildren[index] = {
                                                      ...newChildren[index],
                                                      dateOfBirth: date ? format(date, 'yyyy-MM-dd') : null
                                                    };
                                                    childInfoForm.setValue('children', newChildren);
                                                  }}
                                                  captionLayout="dropdown-buttons"
                                                  fromYear={1990}
                                                  toYear={new Date().getFullYear()}
                                                  disabled={{ after: new Date() }}
                                                />
                                              </PopoverContent>
                                            </Popover>
                                          </div>
                                        </div>
                                        
                                        {/* Gender Field */}
                                        <div>
                                          <FormLabel className="font-medium block mb-2">Gender</FormLabel>
                                          <Select 
                                            value={child.gender}
                                            onValueChange={(value) => {
                                              const newChildren = [...field.value];
                                              newChildren[index] = {
                                                ...newChildren[index],
                                                gender: value
                                              };
                                              childInfoForm.setValue('children', newChildren);
                                            }}
                                          >
                                            <SelectTrigger className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent">
                                              <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="not-specified">Select</SelectItem>
                                              <SelectItem value="male">Male</SelectItem>
                                              <SelectItem value="female">Female</SelectItem>
                                              <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      
                                      {/* Weight with unit selection */}
                                      <div className="mt-4 space-y-3">
                                        <div className="flex justify-between mb-2">
                                          <FormLabel className="font-medium">Weight Unit</FormLabel>
                                          <Select 
                                            value={child.weightUnit}
                                            onValueChange={(value: "lb" | "kg") => {
                                              const newChildren = [...field.value];
                                              newChildren[index] = {
                                                ...newChildren[index],
                                                weightUnit: value
                                              };
                                              childInfoForm.setValue('children', newChildren);
                                            }}
                                          >
                                            <SelectTrigger className="w-32 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="lb">Pounds (lb)</SelectItem>
                                              <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        <Input 
                                          type="number" 
                                          min="1" 
                                          step="0.1" 
                                          placeholder={`Weight in ${child.weightUnit === 'kg' ? 'kilograms' : 'pounds'}`}
                                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent"
                                          value={child.weight === null ? '' : child.weight.toString()}
                                          onChange={(e) => {
                                            const value = e.target.value ? parseFloat(e.target.value) : null;
                                            const newChildren = [...field.value];
                                            newChildren[index] = {
                                              ...newChildren[index],
                                              weight: value
                                            };
                                            childInfoForm.setValue('children', newChildren);
                                          }}
                                        />
                                      </div>
                                      
                                      {/* Height with unit selection */}
                                      <div className="mt-4 space-y-3">
                                        <div className="flex justify-between mb-2">
                                          <FormLabel className="font-medium">Height Unit</FormLabel>
                                          <Select 
                                            value={child.heightUnit}
                                            onValueChange={(value: "in" | "cm") => {
                                              const newChildren = [...field.value];
                                              newChildren[index] = {
                                                ...newChildren[index],
                                                heightUnit: value
                                              };
                                              childInfoForm.setValue('children', newChildren);
                                            }}
                                          >
                                            <SelectTrigger className="w-32 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="in">Inches (in)</SelectItem>
                                              <SelectItem value="cm">Centimeters (cm)</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        <Input 
                                          type="number" 
                                          min={child.heightUnit === 'cm' ? "30" : "12"}
                                          placeholder={`Height in ${child.heightUnit === 'cm' ? 'centimeters' : 'inches'}`}
                                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent"
                                          value={child.height === null ? '' : child.height.toString()}
                                          onChange={(e) => {
                                            const value = e.target.value ? parseFloat(e.target.value) : null;
                                            const newChildren = [...field.value];
                                            newChildren[index] = {
                                              ...newChildren[index],
                                              height: value
                                            };
                                            childInfoForm.setValue('children', newChildren);
                                          }}
                                        />
                                      </div>
                                      
                                      {/* Dietary Restrictions */}
                                      <div className="mt-4">
                                        <FormLabel className="font-medium block mb-2">Dietary Restrictions</FormLabel>
                                        <div className="grid grid-cols-2 gap-2">
                                          {DIETARY_RESTRICTIONS.map((restriction) => (
                                            <div key={restriction.value} className="flex items-center space-x-2">
                                              <input
                                                type="checkbox"
                                                id={`restriction-${child.id}-${restriction.value}`}
                                                checked={child.restrictions.includes(restriction.value)}
                                                onChange={(e) => {
                                                  const newRestrictions = e.target.checked
                                                    ? [...child.restrictions, restriction.value]
                                                    : child.restrictions.filter(r => r !== restriction.value);
                                                    
                                                  const newChildren = [...field.value];
                                                  newChildren[index] = {
                                                    ...newChildren[index],
                                                    restrictions: newRestrictions
                                                  };
                                                  childInfoForm.setValue('children', newChildren);
                                                }}
                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                              />
                                              <label htmlFor={`restriction-${child.id}-${restriction.value}`}>
                                                {restriction.label}
                                              </label>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-lg">
                                <p className="text-muted-foreground mb-4">No children added yet</p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    const newChild = { ...DEFAULT_CHILD, id: crypto.randomUUID(), createdAt: Date.now() };
                                    childInfoForm.setValue('children', [newChild]);
                                    childInfoForm.setValue('selectedChildId', newChild.id);
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" /> Add Your First Child
                                </Button>
                              </div>
                            )}
                          </>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </Form>
              </div>
            </div>

            {/* App Settings section removed as requested */}
          </form>
          
          {/* Floating Save Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border shadow-md max-w-md mx-auto">
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
