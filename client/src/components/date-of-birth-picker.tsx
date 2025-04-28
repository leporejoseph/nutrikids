import React, { useEffect, useState } from "react"
import { format, isValid, set, addYears, subYears } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"

interface DateOfBirthPickerProps {
  date: Date | undefined
  onSelect: (date: Date | undefined) => void
  className?: string
}

export function DateOfBirthPicker({ date, onSelect, className }: DateOfBirthPickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date)
  const [calendarView, setCalendarView] = useState<Date>(date || new Date())
  const [selectedMonth, setSelectedMonth] = useState<string>(String(calendarView.getMonth()))
  const [selectedYear, setSelectedYear] = useState<string>(String(calendarView.getFullYear()))
  
  // Update month/year selectors when calendar view changes
  useEffect(() => {
    setSelectedMonth(String(calendarView.getMonth()))
    setSelectedYear(String(calendarView.getFullYear()))
  }, [calendarView])
  
  // Update the selected date value when the external date prop changes
  useEffect(() => {
    setSelectedDate(date)
  }, [date])

  // Jump to decade (e.g., 1990s, 1980s)
  const jumpToDecade = (startYear: number) => {
    const newDate = set(new Date(), { year: startYear, month: 0, date: 1 })
    setCalendarView(newDate)
  }
  
  // Generate years for selector (100 years back)
  const generateYearsArray = () => {
    const currentYear = new Date().getFullYear()
    const startYear = currentYear - 100
    const years = []
    
    for (let year = currentYear; year >= startYear; year--) {
      years.push(year)
    }
    
    return years
  }
  
  // Month names for selector
  const months = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ]

  // Common decades for quick navigation
  const decades = [
    { label: "2010s", year: 2010 },
    { label: "2000s", year: 2000 },
    { label: "1990s", year: 1990 },
    { label: "1980s", year: 1980 },
    { label: "1970s", year: 1970 },
    { label: "1960s", year: 1960 },
    { label: "1950s", year: 1950 },
    { label: "1940s", year: 1940 },
  ]

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value)
    const newDate = set(calendarView, { month: parseInt(value) })
    setCalendarView(newDate)
  }

  const handleYearChange = (value: string) => {
    setSelectedYear(value)
    const newDate = set(calendarView, { year: parseInt(value) })
    setCalendarView(newDate)
  }

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
    onSelect(date)
  }

  const jumpYear = (amount: number) => {
    const newDate = amount > 0 
      ? addYears(calendarView, amount)
      : subYears(calendarView, Math.abs(amount))
    setCalendarView(newDate)
  }

  return (
    <div className={cn("relative", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full h-10 justify-start text-left font-normal border border-gray-300 rounded-md",
              !selectedDate ? "text-muted-foreground" : "text-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate && isValid(selectedDate) ? (
              format(selectedDate, "PPP")
            ) : (
              <span>Choose date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b border-border">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Date of Birth</div>
            </div>
            
            {/* Month/Year selectors */}
            <div className="flex gap-2 mb-2">
              <Select value={selectedMonth} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => jumpYear(10)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateYearsArray().map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => jumpYear(-10)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Decade quick jumps */}
            <div className="grid grid-cols-4 gap-1 mb-2">
              {decades.map((decade) => (
                <Button
                  key={decade.year}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => jumpToDecade(decade.year)}
                >
                  {decade.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Calendar */}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            defaultMonth={calendarView}
            month={calendarView}
            onMonthChange={setCalendarView}
            disabled={{ after: new Date() }}
            initialFocus
            captionLayout="buttons"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}