import { useState } from "react";
import { FoodItem } from "@shared/schema";
import { SUPPLEMENT_UNITS, SUPPLEMENT_FREQUENCIES } from "@/lib/constants";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

const supplementEntrySchema = z.object({
  name: z.string().min(1, "Supplement name is required"),
  quantity: z.coerce.number().min(0.25, "Quantity must be at least 0.25"),
  unit: z.string().min(1, "Unit is required"),
  frequency: z.string().min(1, "Frequency is required"),
  purpose: z.string().optional(),
  warnings: z.string().optional(),
});

type SupplementEntryFormValues = z.infer<typeof supplementEntrySchema>;

interface SupplementEntryFormProps {
  onAddSupplement: (supplement: FoodItem) => void;
  selectedDate?: string; // Optional selected date to associate with new supplement items
}

export default function SupplementEntryForm({ onAddSupplement, selectedDate }: SupplementEntryFormProps) {
  const form = useForm<SupplementEntryFormValues>({
    resolver: zodResolver(supplementEntrySchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: "pill",
      frequency: "daily",
      purpose: "",
      warnings: "",
    },
  });

  const onSubmit = (values: SupplementEntryFormValues) => {
    const currentDate = selectedDate || new Date().toISOString().split('T')[0];
    
    // Create a supplement item with the current date
    const newSupplement = {
      id: crypto.randomUUID(),
      name: values.name,
      quantity: values.quantity,
      unit: values.unit,
      mealType: "supplement", // Using mealType to categorize supplements
      type: "supplement" as const,
      supplementInfo: {
        dosage: `${values.quantity} ${values.unit}`,
        frequency: values.frequency,
        purpose: values.purpose || "",
        warnings: values.warnings || "",
      },
      createdAt: Date.now(),
      date: currentDate,
    } as FoodItem;
    
    onAddSupplement(newSupplement);
    form.reset({
      name: "",
      quantity: 1,
      unit: "pill",
      frequency: form.getValues().frequency,
      purpose: "",
      warnings: "",
    });
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
                <FormLabel className="font-medium">Supplement Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Vitamin D, Calcium, Probiotic, etc." 
                    className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent"
                    {...field} 
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel className="font-medium block mb-1">Dosage</FormLabel>
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
                          {SUPPLEMENT_UNITS.map((unit) => (
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
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUPPLEMENT_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Purpose (optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Why is this supplement being taken? E.g., for immunity, growth, etc."
                    className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="warnings"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Known Warnings (optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any known interactions or warnings about this supplement"
                    className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-accent min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3 px-4 rounded-md transition transform hover:scale-[1.02]"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Supplement
          </Button>
        </form>
      </Form>
    </div>
  );
}