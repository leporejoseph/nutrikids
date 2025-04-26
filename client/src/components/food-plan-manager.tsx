import { useState, useEffect } from "react";
import { FoodPlan, FoodItem, ChildInfo } from "@shared/schema";
import { getFoodPlans, saveFoodPlan, deleteFoodPlan, getChildInfo } from "@/lib/storage";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Star, StarOff, Plus, Trash2, Save, Bookmark, BookmarkCheck, Search, Calendar, AlignLeft, Apple, Coffee, Pill } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const foodPlanFormSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  isChildSpecific: z.boolean().default(true),
});

type FoodPlanFormValues = z.infer<typeof foodPlanFormSchema>;

interface FoodPlanManagerProps {
  currentItems: FoodItem[];
  onLoadPlan: (items: FoodItem[]) => void;
  selectedChildId?: string | null;
}

export default function FoodPlanManager({ currentItems, onLoadPlan, selectedChildId }: FoodPlanManagerProps) {
  const [plans, setPlans] = useState<FoodPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<FoodPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null);
  
  // Load plans and child info
  useEffect(() => {
    const loadData = async () => {
      const loadedPlans = await getFoodPlans();
      const loadedChildInfo = await getChildInfo();
      
      // Filter to show general plans and plans for the selected child
      const filteredPlans = loadedPlans.filter(plan => 
        !plan.childId || plan.childId === selectedChildId
      );
      
      setPlans(filteredPlans);
      setFilteredPlans(filteredPlans);
      setChildInfo(loadedChildInfo);
    };
    
    loadData();
  }, [selectedChildId]);
  
  // Filter plans based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlans(plans);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const results = plans.filter(plan => {
      // Match in plan name
      if (plan.name.toLowerCase().includes(query)) return true;
      
      // Match in plan description
      if (plan.description && plan.description.toLowerCase().includes(query)) return true;
      
      // Match in food item names
      const hasMatchingItem = plan.items.some(item => 
        item.name.toLowerCase().includes(query)
      );
      if (hasMatchingItem) return true;
      
      // Match date (formatted as string)
      const dateStr = new Date(plan.createdAt).toLocaleDateString();
      if (dateStr.includes(query)) return true;
      
      return false;
    });
    
    setFilteredPlans(results);
  }, [searchQuery, plans]);
  
  const form = useForm<FoodPlanFormValues>({
    resolver: zodResolver(foodPlanFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
      isChildSpecific: true,
    },
  });

  const handleSavePlan = async (values: FoodPlanFormValues) => {
    if (currentItems.length === 0) {
      toast({
        title: "No items to save",
        description: "Add some food or supplement items before saving a plan.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Add childId to each food item if this is a child-specific plan
      const itemsWithChildId = values.isChildSpecific && selectedChildId
        ? currentItems.map(item => ({
            ...item,
            childId: selectedChildId
          }))
        : currentItems;
      
      // Create the new plan with childId if it's child-specific
      const newPlan: FoodPlan = {
        id: crypto.randomUUID(),
        name: values.name,
        description: values.description || "",
        items: itemsWithChildId,
        isDefault: values.isDefault,
        childId: values.isChildSpecific && selectedChildId ? selectedChildId : null,
        createdAt: Date.now(),
      };
      
      await saveFoodPlan(newPlan);
      
      // Update local state with fresh data
      const updatedPlans = await getFoodPlans();
      const filteredPlans = updatedPlans.filter(plan => 
        !plan.childId || plan.childId === selectedChildId
      );
      setPlans(filteredPlans);
      
      toast({
        title: "Plan saved",
        description: `"${values.name}" has been saved successfully.`,
      });
      
      // Close dialog and reset form
      setIsCreateDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error saving food plan:", error);
      toast({
        title: "Error saving plan",
        description: "There was a problem saving your food plan.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    try {
      await deleteFoodPlan(planId);
      
      // Update plans list
      const updatedPlans = await getFoodPlans();
      const filteredPlans = updatedPlans.filter(plan => 
        !plan.childId || plan.childId === selectedChildId
      );
      setPlans(filteredPlans);
      
      toast({
        title: "Plan deleted",
        description: `"${planName}" has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting food plan:", error);
      toast({
        title: "Error deleting plan",
        description: "There was a problem deleting your food plan.",
        variant: "destructive",
      });
    }
  };

  const handleLoadPlan = (plan: FoodPlan) => {
    try {
      onLoadPlan(plan.items);
      toast({
        title: "Plan loaded",
        description: `"${plan.name}" has been loaded.`,
      });
    } catch (error) {
      console.error("Error loading food plan:", error);
      toast({
        title: "Error loading plan",
        description: "There was a problem loading your food plan.",
        variant: "destructive",
      });
    }
  };

  const handleToggleDefault = async (plan: FoodPlan) => {
    try {
      const updatedPlan = { ...plan, isDefault: !plan.isDefault };
      await saveFoodPlan(updatedPlan);
      
      // Update plans list
      const updatedPlans = await getFoodPlans();
      const filteredPlans = updatedPlans.filter(plan => 
        !plan.childId || plan.childId === selectedChildId
      );
      setPlans(filteredPlans);
      
      toast({
        title: updatedPlan.isDefault ? "Default plan set" : "Default removed",
        description: updatedPlan.isDefault 
          ? `"${plan.name}" is now your default plan.` 
          : `"${plan.name}" is no longer your default plan.`,
      });
    } catch (error) {
      console.error("Error updating food plan:", error);
      toast({
        title: "Error updating plan",
        description: "There was a problem updating your food plan.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="food-plan-manager">
      {/* Save Current Plan Button */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="mb-4 w-full flex items-center justify-center bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            <Save className="h-4 w-4 mr-2" /> Save Current Food Plan
          </Button>
        </DialogTrigger>
        
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Food Plan</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSavePlan)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Monday's meal plan" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add notes about this plan" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 text-primary rounded"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Set as default plan</FormLabel>
                      <FormDescription>
                        This plan will be available for quick access
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {selectedChildId && (
                <FormField
                  control={form.control}
                  name="isChildSpecific"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 text-primary rounded"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Child-specific plan</FormLabel>
                        <FormDescription>
                          This plan will only be available for the selected child
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button type="submit">Save Plan</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Saved Plans List */}
      {plans.length > 0 ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider">
              Saved Plans
            </h3>
            <div className="text-xs text-gray-500">
              {filteredPlans.length} of {plans.length} plans
            </div>
          </div>
          
          {/* Search input */}
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search plans by name, description, items, or date..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {filteredPlans.length === 0 && searchQuery ? (
            <div className="text-center py-8 bg-gray-50 rounded-md">
              <p className="text-gray-500">No plans match your search</p>
              <p className="text-sm text-gray-400">Try a different search term</p>
            </div>
          ) : (
            filteredPlans.map((plan) => (
            <div 
              key={plan.id} 
              className="bg-white rounded-lg border border-gray-200 p-3 transition hover:shadow-md"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium flex items-center">
                    {plan.name}
                    {plan.isDefault && (
                      <span className="ml-2 text-amber-500">
                        <Star className="h-4 w-4" />
                      </span>
                    )}
                    {plan.childId && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        Child Plan
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-gray-500 line-clamp-1">{plan.description}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {plan.items.length} items • {new Date(plan.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleToggleDefault(plan)}
                    title={plan.isDefault ? "Remove as default" : "Set as default"}
                    className="text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                  >
                    {plan.isDefault ? (
                      <StarOff className="h-4 w-4" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleLoadPlan(plan)}
                    title="Load this plan"
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                  >
                    <BookmarkCheck className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeletePlan(plan.id, plan.name)}
                    title="Delete this plan"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      ) : (
        <div className="text-center p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <Bookmark className="h-6 w-6 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">No saved plans yet</p>
          <p className="text-xs text-gray-400">Save your current food items as a plan</p>
        </div>
      )}
    </div>
  );
}