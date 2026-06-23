"use client";

import { format, parseISO } from "date-fns";
import type { ProjectRemark } from "@/types";
import { useApp } from "@/context/app-context";

export function formatRemarkLine(remark: ProjectRemark) {
  const dateStr = format(parseISO(remark.date), "yyyy/MM/dd");
  return `${dateStr} ${remark.content}`;
}

export function RemarkList({
  remarks,
  compact = false,
}: {
  remarks: ProjectRemark[];
  compact?: boolean;
}) {
  const { getUserById } = useApp();

  if (remarks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {compact ? "등록된 비고 없음" : "비고 내역이 없습니다"}
      </p>
    );
  }

  return (
    <ul className={compact ? "space-y-2" : "space-y-3"}>
      {remarks.map((remark) => {
        const author = getUserById(remark.userId);
        return (
          <li
            key={remark.id}
            className={
              compact
                ? "rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                : "rounded-lg border border-border px-4 py-3"
            }
          >
            <p className="text-sm leading-snug text-foreground">
              {formatRemarkLine(remark)}
            </p>
            {!compact && author && (
              <p className="mt-1 text-xs text-muted-foreground">
                {author.name}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
