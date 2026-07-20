"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useApp } from "@/context/app-context";
import type { IssueStatus, ProjectIssue } from "@/types";
import { ISSUE_STATUS_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function IssueStatusEditor({
  issueId,
  status,
  reportWeekStart,
  compact = false,
  onUpdate,
}: {
  issueId: string;
  status: IssueStatus;
  /** 주간 보고에서 완료 처리 시 이번 주로 기록 */
  reportWeekStart?: string;
  compact?: boolean;
  onUpdate: (
    id: string,
    data: Partial<Pick<ProjectIssue, "status" | "weekStart">>
  ) => void;
}) {
  const [draft, setDraft] = useState(status);
  const dirty = draft !== status;

  useEffect(() => {
    setDraft(status);
  }, [status, issueId]);

  const handleApply = () => {
    const data: Partial<Pick<ProjectIssue, "status" | "weekStart">> = {
      status: draft,
    };
    if (draft === "완료" && reportWeekStart) {
      data.weekStart = reportWeekStart;
    }
    onUpdate(issueId, data);
  };

  const triggerClass = compact
    ? "h-8 w-[76px] border-orange-200 bg-background px-2 text-xs shadow-sm"
    : "h-9 w-[88px] border-orange-200 bg-background/80 text-sm";

  return (
    <div className="inline-flex items-center gap-1.5">
      <Select
        value={draft}
        onValueChange={(v) => setDraft(v as IssueStatus)}
      >
        <SelectTrigger className={triggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ISSUE_STATUS_LABELS) as IssueStatus[]).map((s) => (
            <SelectItem key={s} value={s} className="text-sm">
              {ISSUE_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {dirty && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={cn(compact ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm")}
          onClick={handleApply}
        >
          변경
        </Button>
      )}
    </div>
  );
}

export function IssueRegisterForm({
  defaultProjectId,
  compact = false,
}: {
  defaultProjectId?: string;
  compact?: boolean;
}) {
  const { projects, addProjectIssue, canAddIssue } = useApp();
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<IssueStatus>("진행");

  if (!canAddIssue()) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pid = defaultProjectId ?? projectId;
    if (!pid || !content.trim()) return;
    addProjectIssue({ projectId: pid, date, content: content.trim(), status });
    setContent("");
    setStatus("진행");
  };

  return (
    <Card className={compact ? "border-dashed" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">이슈 등록</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!defaultProjectId && (
            <div className="space-y-2">
              <Label>프로젝트</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} · {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>발생일</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>상태</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as IssueStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ISSUE_STATUS_LABELS) as IssueStatus[]).map(
                    (s) => (
                      <SelectItem key={s} value={s}>
                        {ISSUE_STATUS_LABELS[s]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>이슈 내용</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="이번 주 발생한 이슈를 작성하세요"
              rows={compact ? 2 : 3}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={(!defaultProjectId && !projectId) || !content.trim()}
          >
            <Plus className="mr-1 h-4 w-4" />
            이슈 등록
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function IssueEditForm({
  issue,
  onDone,
}: {
  issue: ProjectIssue;
  onDone: () => void;
}) {
  const { updateProjectIssue } = useApp();
  const [date, setDate] = useState(issue.date);
  const [content, setContent] = useState(issue.content);
  const [status, setStatus] = useState<IssueStatus>(issue.status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    updateProjectIssue(issue.id, {
      date,
      content: content.trim(),
      status,
    });
    onDone();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded-md border border-primary/20 bg-primary/5 p-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-7 w-[118px] shrink-0 text-xs"
        />
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as IssueStatus)}
        >
          <SelectTrigger className="h-7 w-[68px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ISSUE_STATUS_LABELS) as IssueStatus[]).map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {ISSUE_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="h-7 text-xs"
        autoFocus
      />
      <div className="flex gap-1">
        <Button type="submit" size="sm" className="h-7 px-2 text-xs" disabled={!content.trim()}>
          저장
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onDone}>
          취소
        </Button>
      </div>
    </form>
  );
}

export function IssueList({
  issues,
  showProject = false,
  showStatus = true,
  editableStatus = false,
  emptyMessage = "등록된 이슈가 없습니다",
}: {
  issues: ProjectIssue[];
  showProject?: boolean;
  showStatus?: boolean;
  editableStatus?: boolean;
  emptyMessage?: string;
}) {
  const {
    getUserById,
    getProjectById,
    updateProjectIssue,
    deleteProjectIssue,
    canAddIssue,
  } = useApp();
  const canEdit = canAddIssue();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (issues.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {issues.map((issue) => {
        const author = getUserById(issue.userId);
        const project = getProjectById(issue.projectId);
        const isDone = issue.status === "완료";

        if (editingId === issue.id) {
          return (
            <li key={issue.id}>
              <IssueEditForm issue={issue} onDone={() => setEditingId(null)} />
            </li>
          );
        }

        return (
          <li
            key={issue.id}
            className={cn(
              "rounded-lg border px-4 py-3",
              isDone
                ? "border-border/80 bg-muted/40"
                : "border-orange-100 bg-orange-50/80"
            )}
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span
                className={cn(
                  "font-medium",
                  isDone ? "text-muted-foreground" : "text-orange-800"
                )}
              >
                {format(parseISO(issue.date), "yyyy.MM.dd (EEE)", {
                  locale: ko,
                })}
              </span>
              {author && <span>· {author.name}</span>}
              {showProject && project && (
                <span className="font-mono text-primary">{project.code}</span>
              )}
              {showStatus && !(editableStatus && canEdit) && (
                <Badge
                  variant={isDone ? "secondary" : "outline"}
                  className={cn(
                    "h-5 text-[10px]",
                    !isDone && "border-orange-300 text-orange-700"
                  )}
                >
                  {ISSUE_STATUS_LABELS[issue.status]}
                </Badge>
              )}
              {showStatus && editableStatus && canEdit && (
                <IssueStatusEditor
                  issueId={issue.id}
                  status={issue.status}
                  onUpdate={updateProjectIssue}
                />
              )}
              {canEdit && (
                <span className="ml-auto flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6"
                    title="수정"
                    onClick={() => setEditingId(issue.id)}
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
                      if (window.confirm("이 이슈를 삭제할까요?")) {
                        deleteProjectIssue(issue.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </span>
              )}
            </div>
            <p
              className={cn(
                "text-sm leading-relaxed",
                isDone ? "text-muted-foreground line-through" : "text-orange-950"
              )}
            >
              {issue.content}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
