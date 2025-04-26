import { useState } from "react";
import { FoodItem } from "@shared/schema";
import { FOOD_UNITS, MEAL_TYPES } from "@/lib/constants";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

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
  const form = useForm<FoodEntryFormValues>({
    resolver: zodResolver(foodEntrySchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: "piece",
      mealType: "breakfast",
    },
  });

  const onSubmit = (values: FoodEntryFormValues) => {
    const currentDate = selectedDate || new Date().toISOString().split('T')[0];
    
    // Create a food item with the current date
    const newFood = {
      id: crypto.randomUUID(),
      name: values.name,
      quantity: values.quantity,
      unit: values.unit,
      mealType: values.mealType,
      createdAt: Date.now(),
      date: currentDate,
    } as FoodItem;
    
    onAddFood(newFood);
    form.reset({
      name: "",
      quantity: 1,
      unit: "piece",
      mealType: form.getValues().mealType,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Food Item</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Apple, Chicken nuggets, etc." 
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
                        {FOOD_UNITS.map((unit) => (
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
                    {MEAL_TYPES.map((meal) => (
                      <SelectItem key={meal.value} value={meal.value}>
                        {meal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-md transition transform hover:scale-[1.02]"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Food Item
          </Button>
        </form>
      </Form>
    </div>
  );
}
