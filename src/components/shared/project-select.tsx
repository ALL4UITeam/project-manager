import { cn } from "@/lib/utils";

export function ProjectCodeNameStack({
  code,
  name,
  className,
}: {
  code: string;
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-0.5 text-left",
        className
      )}
    >
      <span className="font-numeric text-xs font-bold leading-none text-primary">
        {code}
      </span>
      <span className="text-sm font-medium leading-snug text-foreground">
        {name}
      </span>
    </div>
  );
}
