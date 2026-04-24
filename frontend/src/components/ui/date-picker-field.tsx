import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  formatDateOnly,
  formatDateOnlyDisplay,
  isLocalDayAfter,
  isLocalDayBefore,
  parseDateOnly,
} from "@/lib/dateOnly";

export interface DatePickerFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  /** Inclusive minimum selectable day (`YYYY-MM-DD`). */
  minDate?: string;
  /** Inclusive maximum selectable day (`YYYY-MM-DD`). */
  maxDate?: string;
  placeholder?: string;
  className?: string;
}

export function DatePickerField({
  id,
  label,
  value,
  onChange,
  disabled,
  minDate,
  maxDate,
  placeholder = "Pick a date",
  className,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDateOnly(value);

  return (
    <div className={cn("grid min-w-0 gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          nativeButton
          id={id}
          disabled={disabled}
          type="button"
          className={cn(
            "inline-flex h-8 w-full min-w-0 items-center justify-start gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm font-normal shadow-none outline-none transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:bg-input/30",
          )}
        >
          {value ? (
            <span className="truncate">{formatDateOnlyDisplay(value)}</span>
          ) : (
            <span className="truncate text-muted-foreground">{placeholder}</span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-auto min-w-0 p-0" align="start" sideOffset={6}>
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) {
                onChange(formatDateOnly(date));
                setOpen(false);
              }
            }}
            disabled={(date) => {
              const min = minDate ? parseDateOnly(minDate) : undefined;
              if (min && isLocalDayBefore(date, min)) return true;
              const max = maxDate ? parseDateOnly(maxDate) : undefined;
              if (max && isLocalDayAfter(date, max)) return true;
              return false;
            }}
            defaultMonth={selected ?? parseDateOnly(minDate ?? "") ?? new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
