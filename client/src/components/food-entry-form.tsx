import { useState, useEffect } from "react";
import { FoodItem, ChildInfo } from "@shared/schema";
import { FOOD_UNITS, DRINK_UNITS, SUPPLEMENT_UNITS, MEAL_TYPES } from "@/lib/constants";
import { getChildInfo } from "@/lib/storage";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Apple, Coffee, Pill, Users } from "lucide-react";

const foodEntrySchema = z.object({
  name: z.string().min(1, "Food name is required"),
  quantity: z.coerce.number().min(0.25, "Quantity must be at least 0.25"),
  unit: z.string().min(1, "Unit is required"),
  mealType: z.string().min(1, "Meal type is required"),
});

type FoodEntryFormValues = z.infer<typeof foodEntrySchema>;

interface FoodEntryFormProps {
  onAddFood: (food: FoodItem) => void;
  selectedDate?: string; // Optional selected date to associate with new food items
}

export default function FoodEntryForm({ onAddFood, selectedDate }: FoodEntryFormProps) {
  const [entryType, setEntryType] = useState<"food" | "drink" | "supplement">("food");
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  
  // Load child information
  useEffect(() => {
    const loadChildInfo = async () => {
      try {
        const info = await getChildInfo();
        setChildInfo(info);
        setSelectedChildId(info.selectedChildId || null);
      } catch (error) {
        console.error("Error loading child info:", error);
      }
    };
    loadChildInfo();
  }, []);
  
  // Get intelligent default meal type based on current time
  const getDefaultMealType = () => {
    const currentHour = new Date().getHours();
    
    // Morning hours: 4am to 10am -> breakfast
    if (currentHour >= 4 && currentHour < 10) {
      return "breakfast";
    }
    // Lunch hours: 10am to 3pm -> lunch
    else if (currentHour >= 10 && currentHour < 15) {
      return "lunch";
    }
    // Dinner hours: 3pm to 10pm -> dinner
    else if (currentHour >= 15 && currentHour < 22) {
      return "dinner";
    }
    // Late night or early morning: other times -> snack
    else {
      return "snack";
    }
  };
  
  const form = useForm<FoodEntryFormValues>({
    resolver: zodResolver(foodEntrySchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: entryType === "food" ? "piece" : entryType === "drink" ? "serving" : "pill",
      mealType: getDefaultMealType(),
    },
  });

  // Update form when entry type changes
  useEffect(() => {
    // Get appropriate default unit for the selected type
    const defaultUnit = 
      entryType === "food" ? "piece" : 
      entryType === "drink" ? "serving" : 
      "pill";
    
    form.setValue("unit", defaultUnit);
  }, [entryType, form]);

  const onSubmit = (values: FoodEntryFormValues) => {
    const currentDate = selectedDate || new Date().toISOString().split('T')[0];
    
    // Create a food item with the current date and selected type
    const newFood = {
      id: crypto.randomUUID(),
      name: values.name,
      quantity: values.quantity,
      unit: values.unit,
      mealType: values.mealType,
      type: entryType, // Add the selected type
      createdAt: Date.now(),
      date: currentDate,
      childId: selectedChildId || undefined, // Associate with selected child
    } as FoodItem;
    
    onAddFood(newFood);
    form.reset({
      name: "",
      quantity: 1,
      unit: entryType === "food" ? "piece" : entryType === "drink" ? "serving" : "pill",
      mealType: form.getValues().mealType,
    });
  };

  // Get the proper label and placeholder based on entry type
  const getItemTypeLabel = () => {
    switch (entryType) {
      case "food": return "Food Item";
      case "drink": return "Drink Item";
      case "supplement": return "Supplement";
      default: return "Item";
    }
  };

  const getItemPlaceholder = () => {
    switch (entryType) {
      case "food": return "e.g., Apple, Chicken nuggets, etc.";
      case "drink": return "e.g., Water, Orange juice, Milk, etc.";
      case "supplement": return "e.g., Vitamin D, Iron supplement, etc.";
      default: return "Enter item name";
    }
  };

  // Get the appropriate units based on entry type
  const getUnitsForType = () => {
    switch (entryType) {
      case "food": return FOOD_UNITS;
      case "drink": return DRINK_UNITS;
      case "supplement": return [...SUPPLEMENT_UNITS];
      default: return FOOD_UNITS;
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">{getItemTypeLabel()}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={getItemPlaceholder()}
                    className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent"
                    {...field} 
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div>
            <FormLabel className="font-medium block mb-1">Quantity</FormLabel>
            <div className="flex space-x-2">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem className="w-1/3">
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0.25"
                        step="0.25"
                        className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem className="w-2/3">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getUnitsForType().map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="mealType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Meal</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent">
                      <SelectValue placeholder="Select meal type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    
                    <SelectItem value="morning_snack" className="text-sm text-muted-foreground">
                      Morning Snack
                    </SelectItem>
                    
                    <SelectItem value="lunch">Lunch</SelectItem>
                    
                    <SelectItem value="afternoon_snack" className="text-sm text-muted-foreground">
                      Afternoon Snack
                    </SelectItem>
                    
                    <SelectItem value="dinner">Dinner</SelectItem>
                    
                    <SelectItem value="dessert" className="text-sm text-muted-foreground">
                      Dessert
                    </SelectItem>
                    
                    <SelectItem value="evening_snack" className="text-sm text-muted-foreground">
                      Evening Snack
                    </SelectItem>
                    
                    <SelectItem value="beverage" className="text-sm text-muted-foreground">
                      Beverage
                    </SelectItem>
                    
                    <SelectItem value="snack" className="text-sm text-muted-foreground">
                      Snack (Other)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          
          {/* Child selector */}
          {childInfo?.children && childInfo.children.length > 0 && (
            <div className="space-y-2">
              <FormLabel className="font-medium flex items-center">
                <Users className="mr-2 h-4 w-4" /> Child Association
              </FormLabel>
              <Select 
                value={selectedChildId || "none"} 
                onValueChange={(value) => setSelectedChildId(value === "none" ? null : value)}
              >
                <SelectTrigger className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent">
                  <SelectValue placeholder="Select child or leave empty for all" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Children (No specific child)</SelectItem>
                  {childInfo.children.map(child => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name || `Child ${childInfo.children.findIndex(c => c.id === child.id) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Select a specific child or leave empty to add this item for all children
              </p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-md transition transform hover:scale-[1.02]"
          >
            <Plus className="mr-2 h-4 w-4" /> Add {entryType === "food" ? "Food" : entryType === "drink" ? "Drink" : "Supplement"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
