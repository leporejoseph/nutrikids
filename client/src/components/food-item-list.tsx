import { useState } from "react";
import { FoodItem } from "@shared/schema";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FOOD_UNITS, MEAL_TYPES, APP_IMAGES } from "@/lib/constants";
import { Edit, MinusCircle, Check } from "lucide-react";

interface FoodItemListProps {
  items: FoodItem[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedItem: Partial<FoodItem>) => void;
}

const editFoodSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  quantity: z.coerce.number().min(0.25, "Quantity must be at least 0.25"),
  unit: z.string().min(1, "Unit is required"),
  mealType: z.string().min(1, "Meal type is required"),
});

type EditFoodFormValues = z.infer<typeof editFoodSchema>;

export default function FoodItemList({ items, onDelete, onUpdate }: FoodItemListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const form = useForm<EditFoodFormValues>({
    resolver: zodResolver(editFoodSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: "piece",
      mealType: "breakfast",
    },
  });

  const handleEdit = (item: FoodItem) => {
    setEditingId(item.id);
    form.reset({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      mealType: item.mealType,
    });
  };

  const handleSave = (id: string) => {
    const values = form.getValues();
    onUpdate(id, values);
    setEditingId(null);
  };

  // Format meal type to display the proper label
  const formatMealType = (mealType: string) => {
    const mealTypeObj = MEAL_TYPES.find(meal => meal.value === mealType);
    return mealTypeObj ? mealTypeObj.label : mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  if (items.length === 0) {
    return (
      <div id="emptyFoodListMessage" className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
        <img src={APP_IMAGES.fruits} alt="Empty food list" className="w-16 h-16 mx-auto mb-2 opacity-50 rounded-full" />
        <p className="text-gray-500">No food items added yet</p>
        <p className="text-sm text-gray-400">Add some foods to track nutrition</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li 
          key={item.id} 
          className="food-item bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex justify-between items-center"
        >
          {editingId === item.id ? (
            <div className="w-full">
              <Form {...form}>
                <form className="space-y-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            className="w-full p-2 border border-gray-300 rounded-md mb-2"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex space-x-2">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem className="w-1/4">
                          <FormControl>
                            <Input 
                              type="number"
                              min="0.25"
                              step="0.25"
                              className="p-2 border border-gray-300 rounded-md"
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
                        <FormItem className="w-1/3">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="p-2 border border-gray-300 rounded-md">
                                <SelectValue />
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
                    
                    <FormField
                      control={form.control}
                      name="mealType"
                      render={({ field }) => (
                        <FormItem className="w-1/3">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="p-2 border border-gray-300 rounded-md">
                                <SelectValue />
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
                  </div>
                </form>
              </Form>
              
              <div className="flex justify-end mt-2">
                <button 
                  onClick={() => handleSave(item.id)}
                  className="save-btn p-2 px-4 bg-success text-white rounded-md flex items-center"
                  aria-label="Save changes"
                >
                  <Check className="h-4 w-4 mr-2" /> Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-500">
                  {item.quantity} {item.unit} - {formatMealType(item.mealType)}
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEdit(item)}
                  className="edit-btn p-2 text-gray-600 hover:text-secondary"
                  aria-label="Edit food item"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onDelete(item.id)}
                  className="delete-btn p-2 text-gray-600 hover:text-danger"
                  aria-label="Delete food item"
                >
                  <MinusCircle className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
