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
import { Star, StarOff, Plus, Trash2, Save, Bookmark, BookmarkCheck } from "lucide-react";
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
      setChildInfo(loadedChildInfo);
    };
    
    loadData();
  }, [selectedChildId]);
  
  const form = useForm<FoodPlanFormValues>({
    resolver: zodResolver(foodPlanFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isDefault: false,
      isChildSpecific: true,
    },
  });

  const handleSavePlan = (values: FoodPlanFormValues) => {
    if (currentItems.length === 0) {
      toast({
        title: "No items to save",
        description: "Add some food or supplement items before saving a plan.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newPlan: FoodPlan = {
        id: crypto.randomUUID(),
        name: values.name,
        description: values.description || "",
        items: [...currentItems],
        isDefault: values.isDefault,
        createdAt: Date.now(),
      };
      
      saveFoodPlan(newPlan);
      
      // Update local state
      setPlans(getFoodPlans());
      
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

  const handleDeletePlan = (planId: string, planName: string) => {
    try {
      deleteFoodPlan(planId);
      setPlans(getFoodPlans());
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

  const handleToggleDefault = (plan: FoodPlan) => {
    try {
      const updatedPlan = { ...plan, isDefault: !plan.isDefault };
      saveFoodPlan(updatedPlan);
      setPlans(getFoodPlans());
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
          <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-2">
            Saved Plans
          </h3>
          
          {plans.map((plan) => (
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
          ))}
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