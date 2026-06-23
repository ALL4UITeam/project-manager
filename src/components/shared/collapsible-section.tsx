"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CollapsibleSection({
  title,
  description,
  count,
  defaultOpen = false,
  icon,
  className,
  contentClassName,
  children,
}: {
  title: ReactNode;
  description?: string;
  count?: number;
  defaultOpen?: boolean;
  icon?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-start gap-2 rounded-lg text-left transition-colors hover:bg-muted/40 -mx-1 px-1 py-1"
          aria-expanded={open}
        >
          {icon}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold leading-snug">{title}</span>
              {count !== undefined && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {count}건
                </span>
              )}
            </div>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <ChevronDown
            className={cn(
              "mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </CardHeader>
      {open && (
        <CardContent className={cn("pt-4", contentClassName)}>{children}</CardContent>
      )}
    </Card>
  );
}
