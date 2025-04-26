import React, { useState, useEffect } from 'react';
import { format, addDays, parseISO, isToday, isSameDay, subDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  // Parse the selected date
  const parsedDate = selectedDate ? parseISO(selectedDate) : new Date();
  
  // Generate dates for week view (3 days before, today, 3 days after)
  const weekDates = [-3, -2, -1, 0, 1, 2, 3].map(offset => 
    addDays(new Date(), offset)
  );
  
  // Format a date for display in the bubble
  const formatDateBubble = (date: Date) => {
    return {
      day: format(date, 'd'),
      weekday: format(date, 'EEE'),
      fullDate: format(date, 'yyyy-MM-dd'),
      isToday: isToday(date),
      isSelected: isSameDay(date, parsedDate)
    };
  };

  // Formatted week dates for display
  const formattedDates = weekDates.map(formatDateBubble);
  
  // Select a date from the week view
  const selectDate = (dateString: string) => {
    onDateChange(dateString);
  };
  
  // Handle selection from calendar
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(format(date, 'yyyy-MM-dd'));
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Food Entries</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2 border-dashed">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>Choose date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={parsedDate}
              onSelect={handleCalendarSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Week bubble view */}
      <div className="flex justify-between items-center overflow-x-auto py-2 px-1">
        {formattedDates.map((date) => (
          <button
            key={date.fullDate}
            onClick={() => selectDate(date.fullDate)}
            className={`
              flex flex-col items-center justify-center rounded-full w-12 h-12
              transition-colors
              ${
                date.isSelected
                  ? 'bg-primary text-white'
                  : date.isToday
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }
            `}
            aria-label={`Select ${date.fullDate}`}
          >
            <span className="text-xs font-medium">{date.weekday}</span>
            <span className="text-sm font-bold">{date.day}</span>
          </button>
        ))}
      </div>
    </div>
  );
}