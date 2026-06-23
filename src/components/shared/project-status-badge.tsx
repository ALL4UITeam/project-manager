import type { ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";

export const PROJECT_STATUS_STYLES: Record<
  ProjectStatus,
  { badge: string; dot: string }
> = {
  진행: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  홀드: {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  완료: {
    badge: "bg-slate-100 text-slate-500 border-slate-200",
    dot: "bg-slate-400",
  },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        PROJECT_STATUS_STYLES[status].badge
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          PROJECT_STATUS_STYLES[status].dot
        )}
      />
      {status}
    </span>
  );
}

export function StatusLegend() {
  const items: ProjectStatus[] = ["진행", "홀드", "완료"];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((status) => (
        <ProjectStatusBadge key={status} status={status} />
      ))}
    </div>
  );
}
