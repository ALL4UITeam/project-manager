import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ACCENT_STYLES = {
  primary:
    "bg-primary/12 text-primary ring-primary/20",
  sky: "bg-sky-500/12 text-sky-600 ring-sky-500/20",
  violet:
    "bg-violet-500/12 text-violet-600 ring-violet-500/20",
  rose: "bg-rose-500/12 text-rose-600 ring-rose-500/20",
  emerald:
    "bg-emerald-500/12 text-emerald-600 ring-emerald-500/20",
  cyan: "bg-cyan-500/12 text-cyan-600 ring-cyan-500/20",
  amber:
    "bg-amber-500/12 text-amber-600 ring-amber-500/20",
} as const;

type Accent = keyof typeof ACCENT_STYLES;

export function FormDialogHeader({
  icon: Icon,
  title,
  description,
  accent = "primary",
  badge,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  accent?: Accent;
  badge?: string;
}) {
  return (
    <DialogHeader>
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
            ACCENT_STYLES[accent]
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{title}</DialogTitle>
            {badge && (
              <span className="rounded-full bg-background/80 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground ring-1 ring-border/60">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </div>
      </div>
    </DialogHeader>
  );
}

export function FormDialogSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/60 bg-muted/20 p-4 shadow-sm",
        className
      )}
    >
      {(title || description) && (
        <div className="mb-4 border-b border-border/50 pb-3">
          {title && (
            <h3 className="font-display text-sm font-semibold tracking-tight">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function FormField({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-xs font-semibold tracking-wide text-foreground/80 uppercase">
          {label}
          {required && (
            <span className="ml-0.5 text-destructive" aria-hidden>
              *
            </span>
          )}
        </label>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

export function formInputClassName(className?: string) {
  return cn(
    "h-10 border-border/70 bg-background/90 shadow-sm focus-visible:ring-primary/25",
    className
  );
}
