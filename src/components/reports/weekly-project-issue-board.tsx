"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useApp } from "@/context/app-context";
import { ProjectStatusBadge } from "@/components/shared/project-status-badge";
import { ProjectCodeNameStack } from "@/components/shared/project-select";
import { ProjectPmCell, ProjectAssigneeCell } from "@/components/shared/project-pm-cell";
import { formatRemarkLine } from "@/components/issues/remark-components";
import { IssueStatusEditor } from "@/components/issues/issue-components";
import { formatWeekRange, getWeekBoundsForYear } from "@/lib/week-utils";
import { sortProjectsForDisplay } from "@/lib/project-utils";
import { cn } from "@/lib/utils";
import type { IssueStatus, Project, ProjectIssue, ProjectRemark } from "@/types";
import { ISSUE_STATUS_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CELL_SCROLL = "max-h-[100px] overflow-y-auto overscroll-contain";

function InlineIssueEdit({
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

  return (
    <form
      className="space-y-1 rounded border border-primary/20 bg-primary/5 p-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!content.trim()) return;
        updateProjectIssue(issue.id, {
          date,
          content: content.trim(),
          status,
        });
        onDone();
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap gap-1">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-6 w-[110px] text-[10px]"
        />
        <Select value={status} onValueChange={(v) => setStatus(v as IssueStatus)}>
          <SelectTrigger className="h-6 w-[60px] text-[10px]">
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
        className="h-6 text-[10px]"
        autoFocus
      />
      <div className="flex gap-1">
        <Button type="submit" size="sm" className="h-5 px-1.5 text-[10px]">
          저장
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-5 px-1.5 text-[10px]"
          onClick={onDone}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

function InlineRemarkEdit({
  remark,
  onDone,
}: {
  remark: ProjectRemark;
  onDone: () => void;
}) {
  const { updateProjectRemark } = useApp();
  const [date, setDate] = useState(remark.date);
  const [content, setContent] = useState(remark.content);

  return (
    <form
      className="space-y-1 rounded border border-violet-500/20 bg-violet-500/5 p-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!content.trim()) return;
        updateProjectRemark(remark.id, {
          date,
          content: content.trim(),
        });
        onDone();
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="h-6 w-[110px] text-[10px]"
      />
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="h-6 text-[10px]"
        autoFocus
      />
      <div className="flex gap-1">
        <Button type="submit" size="sm" className="h-5 px-1.5 text-[10px]">
          저장
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-5 px-1.5 text-[10px]"
          onClick={onDone}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

function ProjectIssueInputRow({
  projectId,
  defaultDate,
  onDone,
}: {
  projectId: string;
  defaultDate: string;
  onDone: () => void;
}) {
  const { addProjectIssue } = useApp();
  const [date, setDate] = useState(defaultDate);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<IssueStatus>("진행");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addProjectIssue({ projectId, date, content: content.trim(), status });
    setContent("");
    setStatus("진행");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-1.5 rounded-md border border-primary/20 bg-primary/5 p-2"
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
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="이슈 내용"
          className="h-7 min-w-[100px] flex-1 text-xs"
          autoFocus
        />
        <Button
          type="submit"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={!content.trim()}
        >
          등록
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

function ProjectRemarkInputRow({
  projectId,
  weekStartISO,
  onDone,
}: {
  projectId: string;
  weekStartISO: string;
  onDone: () => void;
}) {
  const { addProjectRemark } = useApp();
  /** 시작일만 필수 — 종료일(to)은 비워 두면 시작일만으로 저장 */
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !date) return;
    const contentText = endDate.trim()
      ? `[${format(parseISO(date), "MM/dd")}~${format(parseISO(endDate), "MM/dd")}] ${content.trim()}`
      : content.trim();
    addProjectRemark({
      projectId,
      date,
      weekStart: weekStartISO,
      content: contentText,
    });
    setContent("");
    setEndDate("");
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
          title="시작일 (필수)"
        />
        <span className="text-[10px] text-muted-foreground">~</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-7 w-[118px] shrink-0 text-xs"
          title="종료일 (선택 — 비워두면 시작일만 저장)"
        />
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="비고 (종료일 선택)"
          className="h-7 min-w-[100px] flex-1 text-xs"
          autoFocus
        />
        <Button
          type="submit"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={!content.trim() || !date}
        >
          등록
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
      <p className="text-[10px] text-muted-foreground">
        종료일은 선택 사항입니다. 비워 두면 시작일만 저장됩니다.
      </p>
    </form>
  );
}

export function WeeklyProjectIssueBoard({
  weekStart,
  selectedYear,
  yearProjects,
  onPrevWeek,
  onNextWeek,
  defaultExpanded = true,
  forceCollapsed = false,
}: {
  weekStart: Date;
  selectedYear: number;
  yearProjects: Project[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  defaultExpanded?: boolean;
  /** 회의 모드 등에서 상단 목록을 접을 때 */
  forceCollapsed?: boolean;
}) {
  const {
    getIssuesByWeek,
    getRemarksByWeek,
    getUserById,
    canAddIssue,
    updateProjectIssue,
    deleteProjectIssue,
    deleteProjectRemark,
  } = useApp();
  const [addingIssueProjectId, setAddingIssueProjectId] = useState<string | null>(
    null
  );
  const [addingRemarkProjectId, setAddingRemarkProjectId] = useState<
    string | null
  >(null);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [editingRemarkId, setEditingRemarkId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (forceCollapsed) setExpanded(false);
  }, [forceCollapsed]);

  const weekStartISO = format(weekStart, "yyyy-MM-dd");
  const defaultIssueDate = format(new Date(), "yyyy-MM-dd");
  const reportIssues = getIssuesByWeek(weekStartISO);
  const weekRemarks = getRemarksByWeek(weekStartISO);
  const sortedProjects = sortProjectsForDisplay(yearProjects);
  const { min, max } = getWeekBoundsForYear(selectedYear);
  const canPrevWeek = weekStart.getTime() > min.getTime();
  const canNextWeek = weekStart.getTime() < max.getTime();

  return (
    <Card className="border-primary/15 shadow-sm">
      <CardHeader className="space-y-3 border-b bg-primary/[0.03]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex min-w-0 flex-1 items-start gap-2 rounded-lg text-left transition-colors hover:bg-muted/30 -m-1 p-1"
            aria-expanded={expanded ? "true" : "false"}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">이번주 이슈사항</CardTitle>
                <Badge variant="secondary" className="h-6 text-[11px]">
                  프로젝트 {sortedProjects.length}
                </Badge>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                    expanded && "rotate-180"
                  )}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CardDescription className="m-0 text-xs">
                  {formatWeekRange(weekStart)} · 진행 이슈 유지 · 완료는 변경 후 이번 주에
                  표시
                </CardDescription>
                <Badge variant="secondary" className="h-6 text-[11px]">
                  이슈 {reportIssues.length}
                </Badge>
                <Badge variant="outline" className="h-6 text-[11px]">
                  비고 {weekRemarks.length}
                </Badge>
              </div>
            </div>
          </button>
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-card px-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onPrevWeek}
              disabled={!canPrevWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] px-2 text-center text-xs font-semibold">
              {formatWeekRange(weekStart)}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onNextWeek}
              disabled={!canNextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[148px] px-4 font-semibold">
                  프로젝트
                </TableHead>
                <TableHead className="px-4 font-semibold">PM</TableHead>
                <TableHead className="min-w-[100px] px-4 font-semibold">
                  담당
                </TableHead>
                <TableHead className="px-4 font-semibold">상태</TableHead>
                <TableHead className="min-w-[280px] px-4 font-semibold">
                  이슈
                </TableHead>
                <TableHead className="min-w-[240px] px-4 font-semibold">
                  비고
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProjects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    {selectedYear}년에 표시할 프로젝트가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
              sortedProjects.map((project) => {
                const projectIssues = reportIssues.filter(
                  (i) => i.projectId === project.id
                );
                const projectRemarks = weekRemarks.filter(
                  (r) => r.projectId === project.id
                );
                const isAddingIssue = addingIssueProjectId === project.id;
                const isAddingRemark = addingRemarkProjectId === project.id;

                return (
                  <TableRow key={project.id} className="align-top">
                    <TableCell className="whitespace-normal px-3 py-2 align-top">
                      <ProjectCodeNameStack
                        code={project.code}
                        name={project.name}
                      />
                    </TableCell>
                    <TableCell className="whitespace-normal px-3 py-2 align-top">
                      <ProjectPmCell project={project} />
                    </TableCell>
                    <TableCell className="whitespace-normal px-3 py-2 align-top">
                      <ProjectAssigneeCell project={project} />
                    </TableCell>
                    <TableCell className="whitespace-normal px-3 py-2 align-top">
                      <ProjectStatusBadge status={project.status} />
                    </TableCell>
                    <TableCell className="min-w-[240px] whitespace-normal px-3 py-2 align-top">
                      <div className="flex flex-col gap-1.5">
                        {canAddIssue() && !isAddingIssue && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-fit text-xs"
                            onClick={() => {
                              setAddingRemarkProjectId(null);
                              setAddingIssueProjectId(project.id);
                            }}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            이슈
                          </Button>
                        )}
                        {isAddingIssue && (
                          <ProjectIssueInputRow
                            projectId={project.id}
                            defaultDate={defaultIssueDate}
                            onDone={() => setAddingIssueProjectId(null)}
                          />
                        )}
                        <div
                          className={cn(
                            "space-y-1",
                            projectIssues.length > 0 && CELL_SCROLL
                          )}
                        >
                          {projectIssues.length === 0 && !isAddingIssue ? (
                            <p className="text-xs text-muted-foreground">—</p>
                          ) : (
                            <ul className="space-y-1">
                              {projectIssues.map((issue) => {
                                const author = getUserById(issue.userId);
                                const isDone = issue.status === "완료";
                                const isCarried =
                                  !isDone && issue.weekStart !== weekStartISO;

                                if (editingIssueId === issue.id) {
                                  return (
                                    <li key={issue.id}>
                                      <InlineIssueEdit
                                        issue={issue}
                                        onDone={() => setEditingIssueId(null)}
                                      />
                                    </li>
                                  );
                                }

                                return (
                                  <li
                                    key={issue.id}
                                    className={cn(
                                      "rounded border px-2 py-1",
                                      isDone
                                        ? "border-border/80 bg-muted/30"
                                        : "border-orange-100 bg-orange-50/80"
                                    )}
                                  >
                                    <div className="flex flex-wrap items-center gap-1 text-[10px] leading-tight text-muted-foreground">
                                      <span>
                                        {format(parseISO(issue.date), "M/d", {
                                          locale: ko,
                                        })}
                                        {author && ` · ${author.name}`}
                                      </span>
                                      {isCarried && (
                                        <Badge
                                          variant="outline"
                                          className="h-4 px-1 text-[9px]"
                                        >
                                          이월
                                        </Badge>
                                      )}
                                      {canAddIssue() && (
                                        <IssueStatusEditor
                                          issueId={issue.id}
                                          status={issue.status}
                                          reportWeekStart={weekStartISO}
                                          compact
                                          onUpdate={updateProjectIssue}
                                        />
                                      )}
                                      {canAddIssue() && (
                                        <span className="ml-auto flex gap-0">
                                          <button
                                            type="button"
                                            className="rounded p-0.5 hover:bg-background"
                                            title="수정"
                                            onClick={() =>
                                              setEditingIssueId(issue.id)
                                            }
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </button>
                                          <button
                                            type="button"
                                            className="rounded p-0.5 text-destructive hover:bg-background"
                                            title="삭제"
                                            onClick={() => {
                                              if (
                                                window.confirm(
                                                  "이 이슈를 삭제할까요?"
                                                )
                                              ) {
                                                deleteProjectIssue(issue.id);
                                              }
                                            }}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </span>
                                      )}
                                    </div>
                                    <p
                                      className={cn(
                                        "text-xs leading-snug",
                                        isDone
                                          ? "text-muted-foreground line-through"
                                          : "text-orange-950"
                                      )}
                                    >
                                      {issue.content}
                                    </p>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[200px] whitespace-normal px-3 py-2 align-top">
                      <div className="flex flex-col gap-1.5">
                        {canAddIssue() && !isAddingRemark && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-fit text-xs"
                            onClick={() => {
                              setAddingIssueProjectId(null);
                              setAddingRemarkProjectId(project.id);
                            }}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            비고
                          </Button>
                        )}
                        {isAddingRemark && (
                          <ProjectRemarkInputRow
                            projectId={project.id}
                            weekStartISO={weekStartISO}
                            onDone={() => setAddingRemarkProjectId(null)}
                          />
                        )}
                        <div
                          className={cn(
                            "space-y-1",
                            projectRemarks.length > 0 && CELL_SCROLL
                          )}
                        >
                          {projectRemarks.length === 0 && !isAddingRemark ? (
                            <p className="text-xs text-muted-foreground">—</p>
                          ) : (
                            <ul className="space-y-1">
                              {projectRemarks.map((remark) =>
                                editingRemarkId === remark.id ? (
                                  <li key={remark.id}>
                                    <InlineRemarkEdit
                                      remark={remark}
                                      onDone={() => setEditingRemarkId(null)}
                                    />
                                  </li>
                                ) : (
                                  <li
                                    key={remark.id}
                                    className="rounded border border-slate-200 bg-slate-50/80 px-2 py-1 text-xs leading-snug text-slate-800"
                                  >
                                    <div className="flex items-start gap-1">
                                      <span className="min-w-0 flex-1">
                                        {formatRemarkLine(remark)}
                                      </span>
                                      {canAddIssue() && (
                                        <span className="flex shrink-0 gap-0">
                                          <button
                                            type="button"
                                            className="rounded p-0.5 hover:bg-background"
                                            title="수정"
                                            onClick={() =>
                                              setEditingRemarkId(remark.id)
                                            }
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </button>
                                          <button
                                            type="button"
                                            className="rounded p-0.5 text-destructive hover:bg-background"
                                            title="삭제"
                                            onClick={() => {
                                              if (
                                                window.confirm(
                                                  "이 비고를 삭제할까요?"
                                                )
                                              ) {
                                                deleteProjectRemark(remark.id);
                                              }
                                            }}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </span>
                                      )}
                                    </div>
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      )}
    </Card>
  );
}
