import { useState, useEffect } from "react";
import { FoodItem, ChildInfo } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FOOD_UNITS, DRINK_UNITS, SUPPLEMENT_UNITS, MEAL_TYPES, APP_IMAGES } from "@/lib/constants";
import { getChildInfo } from "@/lib/storage";
import { Edit, MinusCircle, Check, Apple, Coffee, Pill, ChevronDown, ChevronUp, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FoodItemListProps {
  items: FoodItem[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedItem: Partial<FoodItem>) => void;
  onAddFood?: (food: FoodItem) => void;
  selectedDate?: string;
}

const editFoodSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  quantity: z.coerce.number().min(0.25, "Quantity must be at least 0.25"),
  unit: z.string().min(1, "Unit is required"),
  mealType: z.string().min(1, "Meal type is required"),
});

type EditFoodFormValues = z.infer<typeof editFoodSchema>;

// Food entry schema
const foodEntrySchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.coerce.number().min(0.25, "Quantity must be at least 0.25"),
  unit: z.string().min(1, "Unit is required"),
  mealType: z.string().min(1, "Meal type is required"),
});

type FoodEntryFormValues = z.infer<typeof foodEntrySchema>;

// Get intelligent default meal type based on current time
function getDefaultMealType() {
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
}

export default function FoodItemList({ items, onDelete, onUpdate, onAddFood, selectedDate }: FoodItemListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [entryType, setEntryType] = useState<"food" | "drink" | "supplement">("food");
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [isAddChildDropdownOpen, setIsAddChildDropdownOpen] = useState(false);
  const [isEditChildDropdownOpen, setIsEditChildDropdownOpen] = useState(false);
  
  // Load child information
  useEffect(() => {
    const loadChildInfo = async () => {
      try {
        const info = await getChildInfo();
        setChildInfo(info);
        // Initialize with the default selected child if there is one
        if (info.selectedChildId) {
          setSelectedChildIds([info.selectedChildId]);
        }
      } catch (error) {
        console.error("Error loading child info:", error);
      }
    };
    loadChildInfo();
  }, []);
  
  // Form for editing existing items
  const form = useForm<EditFoodFormValues>({
    resolver: zodResolver(editFoodSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: "piece",
      mealType: "breakfast",
    },
  });
  
  // Form for adding new items
  const addForm = useForm<FoodEntryFormValues>({
    resolver: zodResolver(foodEntrySchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: entryType === "food" ? "piece" : entryType === "drink" ? "serving" : "pill",
      mealType: getDefaultMealType(),
    },
  });

  // Update unit when entry type changes
  useEffect(() => {
    const defaultUnit = 
      entryType === "food" ? "piece" : 
      entryType === "drink" ? "serving" : 
      "pill";
    
    addForm.setValue("unit", defaultUnit);
  }, [entryType, addForm]);

  const handleEdit = (item: FoodItem) => {
    setEditingId(item.id);
    // Set selected child IDs based on item
    if (item.childIds?.length) {
      setSelectedChildIds(item.childIds);
    } else if (item.childId) {
      setSelectedChildIds([item.childId]);
    } else {
      setSelectedChildIds([]);
    }
    
    form.reset({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      mealType: item.mealType,
    });
  };

  const handleSave = (id: string) => {
    const values = form.getValues();
    // Find the existing item to merge with updates
    const existingItem = items.find(item => item.id === id);
    if (!existingItem) return;

    // Include the childIds in the update
    onUpdate(id, {
      ...values,
      // Preserve existing item properties and add updated ones
      type: existingItem.type,
      createdAt: existingItem.createdAt,
      date: existingItem.date,
      // Update childIds - important to always set both childIds and childId
      childIds: selectedChildIds.length > 0 ? selectedChildIds : undefined,
      // For backward compatibility
      childId: selectedChildIds.length === 1 ? selectedChildIds[0] : undefined
    });
    setEditingId(null);
  };
  
  // Format meal type to display the proper label
  const formatMealType = (mealType: string) => {
    const mealTypeObj = MEAL_TYPES.find(meal => meal.value === mealType);
    return mealTypeObj ? mealTypeObj.label : mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };
  
  // Get appropriate units for the selected type
  const getUnitsForType = () => {
    switch (entryType) {
      case "food": return FOOD_UNITS;
      case "drink": return DRINK_UNITS;
      case "supplement": return SUPPLEMENT_UNITS;
      default: return FOOD_UNITS;
    }
  };
  
  // Get the proper label based on entry type
  const getItemTypeLabel = () => {
    switch (entryType) {
      case "food": return "Food Item";
      case "drink": return "Drink Item";
      case "supplement": return "Supplement";
      default: return "Item";
    }
  };

  // Get the proper placeholder based on entry type
  const getItemPlaceholder = () => {
    switch (entryType) {
      case "food": return "e.g., Apple, Chicken nuggets";
      case "drink": return "e.g., Water, Orange juice";
      case "supplement": return "e.g., Vitamin D, Iron supplement";
      default: return "Enter item name";
    }
  };
  
  // Handle submission of new item form
  const handleAddItem = (values: FoodEntryFormValues) => {
    if (onAddFood) {
      const currentDate = selectedDate || new Date().toISOString().split('T')[0];
      
      // Create a food item with the current date
      const newItem = {
        id: crypto.randomUUID(),
        name: values.name,
        quantity: values.quantity,
        unit: values.unit,
        mealType: values.mealType,
        type: entryType,
        createdAt: Date.now(),
        date: currentDate,
        childIds: selectedChildIds.length > 0 ? selectedChildIds : undefined,
        // For backward compatibility
        childId: selectedChildIds.length === 1 ? selectedChildIds[0] : undefined,
      } as FoodItem;
      
      onAddFood(newItem);
      
      // Reset form and keep the form open for further additions
      addForm.reset({
        name: "",
        quantity: 1,
        unit: entryType === "food" ? "piece" : entryType === "drink" ? "serving" : "pill",
        mealType: addForm.getValues().mealType,
      });
    }
  };

  // Render the Add Item form
  const renderAddItemForm = () => (
    <div className="p-3 border-t border-gray-200">
      {/* Type Selection Buttons */}
      <div className="mb-4">
        <div className="flex gap-2">
          <button
            type="button"
            className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-colors ${
              entryType === "food" 
                ? "bg-green-100 border border-green-300 text-green-700" 
                : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setEntryType("food")}
          >
            <Apple className="h-4 w-4" />
            <span>Food</span>
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-colors ${
              entryType === "drink" 
                ? "bg-purple-100 border border-purple-300 text-purple-700" 
                : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setEntryType("drink")}
          >
            <Coffee className="h-4 w-4" />
            <span>Drink</span>
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-colors ${
              entryType === "supplement" 
                ? "bg-blue-100 border border-blue-300 text-blue-700" 
                : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setEntryType("supplement")}
          >
            <Pill className="h-4 w-4" />
            <span>Supplement</span>
          </button>
        </div>
      </div>
      
      {/* Form */}
      <Form {...addForm}>
        <form onSubmit={addForm.handleSubmit(handleAddItem)} className="space-y-4">
          <FormField
            control={addForm.control}
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
                control={addForm.control}
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
                control={addForm.control}
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
            control={addForm.control}
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
          
          {/* Child multi-selector in quick add form */}
          {childInfo?.children && childInfo.children.length > 0 && (
            <div className="mb-3">
              <FormLabel className="font-medium flex items-center">
                <Users className="mr-2 h-4 w-4" /> Child Association
              </FormLabel>
              
              <div 
                className="p-3 border border-gray-300 rounded-md cursor-pointer flex items-center justify-between"
                onClick={() => setIsAddChildDropdownOpen(!isAddChildDropdownOpen)}
              >
                <div className="flex-1 truncate">
                  {selectedChildIds.length === 0 ? (
                    <span className="text-gray-500">Select children or leave empty for all</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedChildIds.map(id => {
                        const child = childInfo.children.find(c => c.id === id);
                        const childName = child?.name || `Child ${childInfo.children.findIndex(c => c.id === id) + 1}`;
                        return (
                          <span key={id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {childName}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isAddChildDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {/* Dropdown menu */}
              {isAddChildDropdownOpen && (
                <div className="mt-1 p-2 bg-white border border-gray-200 rounded-md shadow-md z-10">
                  <div className="mb-2 px-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Select Children</span>
                      <button 
                        type="button" 
                        className="text-xs text-primary hover:underline"
                        onClick={() => {
                          // Toggle all: if all selected, clear. Otherwise, select all
                          if (selectedChildIds.length === childInfo.children.length) {
                            setSelectedChildIds([]);
                          } else {
                            setSelectedChildIds(childInfo.children.map(c => c.id));
                          }
                        }}
                      >
                        {selectedChildIds.length === childInfo.children.length ? 'Clear All' : 'Select All'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Child list */}
                  <div className="max-h-40 overflow-y-auto">
                    {childInfo.children.map(child => {
                      const isSelected = selectedChildIds.includes(child.id);
                      return (
                        <div 
                          key={child.id}
                          className={`px-2 py-1.5 flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded-sm ${isSelected ? 'bg-gray-50' : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedChildIds(selectedChildIds.filter(id => id !== child.id));
                            } else {
                              setSelectedChildIds([...selectedChildIds, child.id]);
                            }
                          }}
                        >
                          <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span className="flex-1">{child.name || `Child ${childInfo.children.findIndex(c => c.id === child.id) + 1}`}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90"
                      onClick={() => setIsAddChildDropdownOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                Select one or more children or leave empty to add this item for all children
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

  if (items.length === 0) {
    return (
      <div>
        {/* Add your first item row - MOVED TO TOP */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden mb-4">
          <button
            onClick={() => setIsAddingItem(!isAddingItem)}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center">
              <Plus className="h-4 w-4 text-primary mr-2" />
              <span className="font-medium">Add Your First Item</span>
            </div>
            {isAddingItem ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          
          {isAddingItem && renderAddItemForm()}
        </div>
        
        {/* Empty state message */}
        <div id="emptyFoodListMessage" className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <img src={APP_IMAGES.fruits} alt="Empty food list" className="w-16 h-16 mx-auto mb-2 opacity-50 rounded-full" />
          <p className="text-gray-500">No items added yet</p>
          <p className="text-sm text-gray-400">Add food, drinks, or supplements using the form above</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Add new item row */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => setIsAddingItem(!isAddingItem)}
          className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center">
            <Plus className="h-4 w-4 text-primary mr-2" />
            <span className="font-medium">Add New Item</span>
          </div>
          {isAddingItem ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        
        {isAddingItem && renderAddItemForm()}
      </div>
      
      {/* Scrollable items list container */}
      <div className={`${items.length > 4 ? 'max-h-[320px] overflow-y-auto pr-1 pb-2' : ''}`}>
        <ul className="space-y-2">
          {/* Existing items */}
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
                      
                      {/* Child multi-selector in edit mode */}
                      {childInfo?.children && childInfo.children.length > 0 && (
                        <div className="mt-2">
                          <label className="text-xs font-medium flex items-center mb-1">
                            <Users className="mr-1 h-3 w-3" /> Children
                          </label>
                          
                          <div 
                            className="p-2 border border-gray-300 rounded-md cursor-pointer flex items-center justify-between text-sm"
                            onClick={() => setIsEditChildDropdownOpen(!isEditChildDropdownOpen)}
                          >
                            <div className="flex-1 truncate">
                              {selectedChildIds.length === 0 ? (
                                <span className="text-gray-500">None (applies to all)</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {selectedChildIds.map(id => {
                                    const child = childInfo.children.find(c => c.id === id);
                                    const childName = child?.name || `Child ${childInfo.children.findIndex(c => c.id === id) + 1}`;
                                    return (
                                      <span key={id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                        {childName}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isEditChildDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                          
                          {/* Dropdown menu */}
                          {isEditChildDropdownOpen && (
                            <div className="absolute mt-1 p-2 bg-white border border-gray-200 rounded-md shadow-md z-10">
                              <div className="mb-2 px-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">Select Children</span>
                                  <button 
                                    type="button" 
                                    className="text-xs text-primary hover:underline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Toggle all: if all selected, clear. Otherwise, select all
                                      if (selectedChildIds.length === childInfo.children.length) {
                                        setSelectedChildIds([]);
                                      } else {
                                        setSelectedChildIds(childInfo.children.map(c => c.id));
                                      }
                                    }}
                                  >
                                    {selectedChildIds.length === childInfo.children.length ? 'Clear All' : 'Select All'}
                                  </button>
                                </div>
                              </div>
                              
                              {/* Child list */}
                              <div className="max-h-40 overflow-y-auto">
                                {childInfo.children.map(child => {
                                  const isSelected = selectedChildIds.includes(child.id);
                                  return (
                                    <div 
                                      key={child.id}
                                      className={`px-2 py-1.5 flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded-sm ${isSelected ? 'bg-gray-50' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isSelected) {
                                          setSelectedChildIds(selectedChildIds.filter(id => id !== child.id));
                                        } else {
                                          setSelectedChildIds([...selectedChildIds, child.id]);
                                        }
                                      }}
                                    >
                                      <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                      </div>
                                      <span className="flex-1">{child.name || `Child ${childInfo.children.findIndex(c => c.id === child.id) + 1}`}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              <div className="mt-2 flex justify-end">
                                <button
                                  type="button"
                                  className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditChildDropdownOpen(false);
                                  }}
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </form>
                  </Form>
                  
                  <div className="flex justify-between mt-2">
                    <button 
                      onClick={() => setEditingId(null)}
                      className="p-2 px-3 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-gray-600 text-sm"
                      type="button"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleSave(item.id)}
                      className="save-btn p-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
                      aria-label="Save changes"
                      type="button"
                    >
                      <Check className="h-4 w-4 mr-2" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center">
                    <div className="mr-2">
                      {item.type === "supplement" ? (
                        <Pill className="h-4 w-4 text-blue-500" />
                      ) : item.type === "drink" ? (
                        <Coffee className="h-4 w-4 text-purple-500" />
                      ) : (
                        <Apple className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        {item.quantity} {item.unit} - {formatMealType(item.mealType)}
                        
                        {/* Show child pills if associated with specific children */}
                        {childInfo?.children && (
                          <>
                            {item.childIds && item.childIds.length > 0 ? (
                              <div className="ml-2 flex flex-wrap gap-1">
                                {item.childIds.map(childId => {
                                  const child = childInfo.children.find(c => c.id === childId);
                                  const childName = child?.name || `Child ${childInfo.children.findIndex(c => c.id === childId) + 1}`;
                                  return (
                                    <span key={childId} className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full flex items-center">
                                      <Users className="h-2.5 w-2.5 mr-1" />
                                      {childName}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : item.childId ? (
                              <div className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full flex items-center">
                                <Users className="h-2.5 w-2.5 mr-1" />
                                {childInfo.children.find(c => c.id === item.childId)?.name || 'Child'}
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
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
      </div>
    </div>
  );
}