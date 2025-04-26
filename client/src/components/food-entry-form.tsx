import { useState, useEffect } from "react";
import { FoodItem } from "@shared/schema";
import { FOOD_UNITS, DRINK_UNITS, MEAL_TYPES } from "@/lib/constants";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Apple, Coffee, Pill, Save, FileInput } from "lucide-react";

const foodEntrySchema = z.object({
  name: z.string().min(1, "Food name is required"),
  quantity: z.coerce.number().min(0.25, "Quantity must be at least 0.25"),
  unit: z.string().min(1, "Unit is required"),
  mealType: z.string().min(1, "Meal type is required"),
  type: z.enum(["food", "drink", "supplement"]).default("food"),
});

type FoodEntryFormValues = z.infer<typeof foodEntrySchema>;

interface FoodEntryFormProps {
  onAddFood: (food: FoodItem) => void;
  selectedDate?: string; // Optional selected date to associate with new food items
  onSavePlan?: () => void; // Function to open the save plan dialog
  onLoadPlan?: () => void; // Function to open the load plan dialog
  hasItems?: boolean; // Whether there are items that can be saved as a plan
  hasPlans?: boolean; // Whether there are saved plans that can be loaded
}

export default function FoodEntryForm({ 
  onAddFood, 
  selectedDate,
  onSavePlan,
  onLoadPlan,
  hasItems = false,
  hasPlans = false
}: FoodEntryFormProps) {
  const [itemType, setItemType] = useState<"food" | "drink" | "supplement">("food");
  const [currentUnits, setCurrentUnits] = useState(FOOD_UNITS);

  const form = useForm<FoodEntryFormValues>({
    resolver: zodResolver(foodEntrySchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: "piece",
      mealType: "breakfast",
      type: "food",
    },
  });

  // Update units when item type changes
  useEffect(() => {
    // Update the unit options based on item type
    if (itemType === "drink") {
      setCurrentUnits(DRINK_UNITS);
      // Set a default drink unit
      form.setValue("unit", "ml");
    } else if (itemType === "supplement") {
      setCurrentUnits(FOOD_UNITS);
      form.setValue("unit", "piece");
    } else {
      setCurrentUnits(FOOD_UNITS);
      form.setValue("unit", "piece");
    }
    
    // Set the type value in the form
    form.setValue("type", itemType);
  }, [itemType, form]);

  const onSubmit = (values: FoodEntryFormValues) => {
    const currentDate = selectedDate || new Date().toISOString().split('T')[0];
    
    // Create a food item with the current date
    const newFood = {
      id: crypto.randomUUID(),
      name: values.name,
      quantity: values.quantity,
      unit: values.unit,
      mealType: values.mealType,
      type: values.type, // Include the type field
      createdAt: Date.now(),
      date: currentDate,
    } as FoodItem;
    
    onAddFood(newFood);
    form.reset({
      name: "",
      quantity: 1,
      unit: itemType === "drink" ? "ml" : "piece",
      mealType: form.getValues().mealType,
      type: itemType,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 relative">
      {/* Type selector at the top of the form */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Button 
            type="button"
            onClick={() => setItemType("food")}
            variant={itemType === "food" ? "default" : "outline"}
            className="flex items-center"
          >
            <Apple className="mr-1 h-4 w-4" /> Food
          </Button>
          <Button 
            type="button"
            onClick={() => setItemType("drink")}
            variant={itemType === "drink" ? "default" : "outline"}
            className="flex items-center"
          >
            <Coffee className="mr-1 h-4 w-4" /> Drink
          </Button>
          <Button 
            type="button"
            onClick={() => setItemType("supplement")}
            variant={itemType === "supplement" ? "default" : "outline"}
            className="flex items-center"
          >
            <Pill className="mr-1 h-4 w-4" /> Supplement
          </Button>
        </div>
        
        {/* Plan save/load buttons */}
        <div className="plan-buttons flex space-x-2">
          {hasItems && onSavePlan && (
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              title="Save current items as plan"
              onClick={onSavePlan}
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
          {hasPlans && onLoadPlan && (
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              title="Load saved plan"
              onClick={onLoadPlan}
            >
              <FileInput className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  {itemType === "drink" ? "Drink" : itemType === "supplement" ? "Supplement" : "Food"} Name
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={
                      itemType === "drink" 
                        ? "e.g., Orange juice, Milk, etc." 
                        : itemType === "supplement" 
                          ? "e.g., Vitamin D, Iron, etc."
                          : "e.g., Apple, Chicken nuggets, etc."
                    }
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
                        {currentUnits.map((unit) => (
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

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-md transition transform hover:scale-[1.02]"
          >
            <Plus className="mr-2 h-4 w-4" /> 
            {itemType === "drink" ? "Add Drink" : itemType === "supplement" ? "Add Supplement" : "Add Food"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
