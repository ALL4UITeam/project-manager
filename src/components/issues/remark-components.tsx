"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { ProjectRemark } from "@/types";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function formatRemarkLine(remark: ProjectRemark) {
  const dateStr = format(parseISO(remark.date), "yyyy/MM/dd");
  return `${dateStr} ${remark.content}`;
}

function RemarkEditForm({
  remark,
  onDone,
}: {
  remark: ProjectRemark;
  onDone: () => void;
}) {
  const { updateProjectRemark } = useApp();
  const [date, setDate] = useState(remark.date);
  const [content, setContent] = useState(remark.content);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    updateProjectRemark(remark.id, {
      date,
      content: content.trim(),
    });
    onDone();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-1.5 rounded-md border border-violet-500/20 bg-violet-500/5 p-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-7 w-[118px] shrink-0 text-xs"
        />
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-7 min-w-[100px] flex-1 text-xs"
          autoFocus
        />
        <Button
          type="submit"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={!content.trim()}
        >
          저장
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={onDone}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

export function RemarkList({
  remarks,
  compact = false,
  editable = false,
}: {
  remarks: ProjectRemark[];
  compact?: boolean;
  editable?: boolean;
}) {
  const { getUserById, canAddIssue, deleteProjectRemark } = useApp();
  const canEdit = editable && canAddIssue();
  const [editingId, setEditingId] = useState<string | null>(null);

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

        if (editingId === remark.id) {
          return (
            <li key={remark.id}>
              <RemarkEditForm remark={remark} onDone={() => setEditingId(null)} />
            </li>
          );
        }

        return (
          <li
            key={remark.id}
            className={
              compact
                ? "rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                : "rounded-lg border border-border px-4 py-3"
            }
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-foreground">
                  {formatRemarkLine(remark)}
                </p>
                {!compact && author && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {author.name}
                  </p>
                )}
              </div>
              {canEdit && (
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6"
                    title="수정"
                    onClick={() => setEditingId(remark.id)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    title="삭제"
                    onClick={() => {
                      if (window.confirm("이 비고를 삭제할까요?")) {
                        deleteProjectRemark(remark.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
