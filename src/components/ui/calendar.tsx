"use client"

import * as React from "react"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayPicker, useNavigation, type CaptionProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: CustomCaption,
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" {...props} />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" {...props} />,
      }}
      fromYear={new Date().getFullYear() - 100}
      toYear={new Date().getFullYear() + 10}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

function CustomCaption({ displayMonth }: CaptionProps) {
  const { goToMonth, nextMonth, previousMonth } = useNavigation();
  const { fromYear, toYear } = useDayPicker();

  const startYear = fromYear || new Date().getFullYear() - 100;
  const endYear = toYear || new Date().getFullYear() + 10;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-2">
        <Select
          value={displayMonth.getMonth().toString()}
          onValueChange={(value) => {
            goToMonth(new Date(displayMonth.getFullYear(), Number(value), 1));
          }}
        >
          <SelectTrigger className="w-[120px] focus:ring-ring focus:ring-offset-2 focus:ring-2">
            <SelectValue placeholder={format(displayMonth, "MMMM")} />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month} value={month.toString()}>
                {format(new Date(2000, month), "MMMM")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={displayMonth.getFullYear().toString()}
          onValueChange={(value) => {
            goToMonth(new Date(Number(value), displayMonth.getMonth(), 1));
          }}
        >
          <SelectTrigger className="w-[100px] focus:ring-ring focus:ring-offset-2 focus:ring-2">
            <SelectValue placeholder={displayMonth.getFullYear().toString()} />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Go to previous month"
          onClick={() => previousMonth && goToMonth(previousMonth)}
          disabled={!previousMonth}
          className={cn(buttonVariants({ variant: 'outline' }), 'h-8 w-8 p-0')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Go to next month"
          onClick={() => nextMonth && goToMonth(nextMonth)}
          disabled={!nextMonth}
          className={cn(buttonVariants({ variant: 'outline' }), 'h-8 w-8 p-0')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export { Calendar }
