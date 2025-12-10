'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { cn } from '@openzeppelin/ui-builder-utils';

import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

/**
 * Props for the DateRangePicker component.
 */
export interface DateRangePickerProps {
  /** The selected date range */
  value?: DateRange;
  /** Callback when the date range changes */
  onChange?: (range: DateRange | undefined) => void;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Number of months to display (default: 2) */
  numberOfMonths?: number;
  /** Alignment of the popover */
  align?: 'start' | 'center' | 'end';
}

/**
 * DateRangePicker component for selecting a date range.
 * Uses react-day-picker with Radix Popover for a shadcn-styled date range selection.
 *
 * @example
 * ```tsx
 * const [dateRange, setDateRange] = useState<DateRange | undefined>();
 *
 * <DateRangePicker
 *   value={dateRange}
 *   onChange={setDateRange}
 *   placeholder="Select date range"
 * />
 * ```
 */
function DateRangePicker({
  value,
  onChange,
  placeholder = 'Pick a date range',
  className,
  disabled = false,
  numberOfMonths = 2,
  align = 'start',
}: DateRangePickerProps): React.ReactElement {
  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date-range"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-[280px] justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, 'LLL dd, y')} - {format(value.to, 'LLL dd, y')}
                </>
              ) : (
                format(value.from, 'LLL dd, y')
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            autoFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={numberOfMonths}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
DateRangePicker.displayName = 'DateRangePicker';

export { DateRangePicker };

// Re-export DateRange type for convenience
export type { DateRange };
