"use client";

import { LayoutTemplate } from "lucide-react";

import { RAPOR_TEMPLATE_LIST } from "@/components/rapor/template-registry";
import { Button } from "@/components/ui/button";
import type { RaporTemplateId } from "@/lib/rapor/types";
import { cn } from "@/lib/utils";

interface RaporTemplateSwitcherProps {
  value: RaporTemplateId;
  onChange: (id: RaporTemplateId) => void;
  className?: string;
  compact?: boolean;
}

export function RaporTemplateSwitcher({
  value,
  onChange,
  className,
  compact = false,
}: RaporTemplateSwitcherProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2",
        className,
      )}
    >
      <LayoutTemplate className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">
        Template rapor
      </span>
      {RAPOR_TEMPLATE_LIST.map((template) => (
        <Button
          key={template.id}
          type="button"
          size="sm"
          variant={value === template.id ? "default" : "outline"}
          className={cn("h-8", compact && "text-xs")}
          title={template.description}
          onClick={() => onChange(template.id)}
        >
          {template.label}
        </Button>
      ))}
    </div>
  );
}
