"use client";

import { ChevronDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface FilterDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FilterDropdownProps {
  label: string;
  value: string | null;
  options: FilterDropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
  triggerClassName?: string;
}

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder,
  loading,
  disabled,
  emptyMessage,
  className,
  triggerClassName,
}: FilterDropdownProps) {
  const selected = options.find((o) => o.value === value);
  const display =
    selected?.label ??
    placeholder ??
    (options.length === 0 ? (emptyMessage ?? "—") : `Pilih ${label.toLowerCase()}`);

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={disabled || loading || (options.length === 0 && !value)}
          className={cn(
            "inline-flex h-9 w-full min-w-[140px] items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm shadow-xs",
            "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            triggerClassName,
          )}
        >
          <span className="truncate text-left font-normal">{display}</span>
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-h-64 min-w-[var(--anchor-width)] overflow-y-auto"
        >
          {options.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              {emptyMessage ?? "Tidak ada pilihan"}
            </p>
          ) : (
            <DropdownMenuRadioGroup
              value={value ?? ""}
              onValueChange={(next) => {
                if (next) onChange(next);
              }}
            >
              {options.map((opt) => (
                <DropdownMenuRadioItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="truncate"
                >
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}