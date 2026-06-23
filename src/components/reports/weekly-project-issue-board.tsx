"use client";

import { useState } from "react";
import { Plus, AlertCircle, ChevronLeft, ChevronRight, X, MessageSquarePlus } from "lucide-react";
import { formInputClassName } from "@/components/shared/form-dialog";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useApp } from "@/context/app-context";
import { ProjectStatusBadge } from "@/components/shared/project-status-badge";
import { ProjectPmCell, ProjectAssigneeCell } from "@/components/shared/project-pm-cell";
import { formatRemarkLine } from "@/components/issues/remark-components";
import { formatWeekRange, getWeekBoundsForYear } from "@/lib/week-utils";
import { sortProjectsForDisplay } from "@/lib/project-utils";
import type { Project } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function ProjectIssueInputRow({
  projectId,
  onDone,
}: {
  projectId: string;
  onDone: () => void;
}) {
  const { addProjectIssue } = useApp();
  const [date, setDate] = useState(format(new Date("2026-06-18"), "yyyy-MM-dd"));
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addProjectIssue({ projectId, date, content: content.trim() });
    setContent("");
    onDone();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-violet-500/5 p-4 shadow-sm ring-1 ring-primary/10"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
          <AlertCircle className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">
          이번 주 이슈 등록
        </span>
      </div>
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className={formInputClassName("h-9 text-xs")}
      />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="이번 주 이슈 내용을 입력하세요"
        rows={2}
        className="mt-2 border-border/70 bg-background/90 text-sm shadow-sm"
        autoFocus
      />
      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm" disabled={!content.trim()} className="shadow-sm">
          <Plus className="mr-1 h-3 w-3" />
          등록
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          <X className="mr-1 h-3 w-3" />
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
  const [date, setDate] = useState(format(new Date("2026-06-18"), "yyyy-MM-dd"));
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addProjectRemark({
      projectId,
      date,
      weekStart: weekStartISO,
      content: content.trim(),
    });
    setContent("");
    onDone();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-card to-primary/5 p-4 shadow-sm ring-1 ring-violet-500/10"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/12 text-violet-600">
          <MessageSquarePlus className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs font-semibold tracking-wide text-violet-600 uppercase">
          비고 등록
        </span>
      </div>
      <Input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className={formInputClassName("h-9 text-xs")}
      />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="비고 (예: 디자인 시안 확인)"
        rows={2}
        className="mt-2 border-border/70 bg-background/90 text-sm shadow-sm"
        autoFocus
      />
      <div className="mt-3 flex gap-2">
        <Button type="submit" size="sm" disabled={!content.trim()} className="shadow-sm">
          <Plus className="mr-1 h-3 w-3" />
          등록
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          <X className="mr-1 h-3 w-3" />
          취소
        </Button>
      </div>
    </form>
  );
}

export function WeeklyProjectIssueBoard({
  weekStart,
  selectedYear,
  yearProjects,
  onPrevWeek,
  onNextWeek,
}: {
  weekStart: Date;
  selectedYear: number;
  yearProjects: Project[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
}) {
  const {
    getIssuesByWeek,
    getRemarksByWeek,
    getUserById,
    canAddIssue,
  } = useApp();
  const [addingIssueProjectId, setAddingIssueProjectId] = useState<string | null>(
    null
  );
  const [addingRemarkProjectId, setAddingRemarkProjectId] = useState<
    string | null
  >(null);

  const weekStartISO = format(weekStart, "yyyy-MM-dd");
  const weekIssues = getIssuesByWeek(weekStartISO);
  const weekRemarks = getRemarksByWeek(weekStartISO);
  const sortedProjects = sortProjectsForDisplay(yearProjects);
  const { min, max } = getWeekBoundsForYear(selectedYear);
  const canPrevWeek = weekStart.getTime() > min.getTime();
  const canNextWeek = weekStart.getTime() < max.getTime();

  return (
    <Card className="border-primary/15 shadow-sm">
      <CardHeader className="space-y-0 border-b bg-primary/[0.03] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <CardTitle className="flex items-center gap-1.5 text-base">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              이번주 이슈사항
            </CardTitle>
            <CardDescription className="m-0 text-xs">
              {selectedYear}년 · 이번 주 이슈·비고
            </CardDescription>
            <Badge variant="secondary" className="h-6 text-[11px]">
              이슈 {weekIssues.length}
            </Badge>
            <Badge variant="outline" className="h-6 text-[11px]">
              비고 {weekRemarks.length}
            </Badge>
          </div>
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onPrevWeek}
              disabled={!canPrevWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[130px] text-center text-xs font-semibold">
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
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-24 font-semibold">코드</TableHead>
                <TableHead className="min-w-[160px] font-semibold">프로젝트</TableHead>
                <TableHead className="w-20 font-semibold">PM</TableHead>
                <TableHead className="min-w-[100px] font-semibold">담당</TableHead>
                <TableHead className="w-20 font-semibold">상태</TableHead>
                <TableHead className="min-w-[260px] font-semibold">
                  이번 주 이슈
                </TableHead>
                <TableHead className="min-w-[220px] font-semibold">비고</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProjects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {selectedYear}년에 표시할 프로젝트가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
              sortedProjects.map((project) => {
                const projectIssues = weekIssues.filter(
                  (i) => i.projectId === project.id
                );
                const projectRemarks = weekRemarks.filter(
                  (r) => r.projectId === project.id
                );
                const isAddingIssue = addingIssueProjectId === project.id;
                const isAddingRemark = addingRemarkProjectId === project.id;

                return (
                  <TableRow key={project.id} className="align-top">
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {project.code}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {project.name}
                    </TableCell>
                    <TableCell>
                      <ProjectPmCell project={project} />
                    </TableCell>
                    <TableCell>
                      <ProjectAssigneeCell project={project} />
                    </TableCell>
                    <TableCell>
                      <ProjectStatusBadge status={project.status} />
                    </TableCell>
                    <TableCell>
                      {projectIssues.length > 0 ? (
                        <ul className="space-y-2">
                          {projectIssues.map((issue) => {
                            const author = getUserById(issue.userId);
                            return (
                              <li
                                key={issue.id}
                                className="rounded-md border border-orange-100 bg-orange-50 px-3 py-2"
                              >
                                <div className="mb-0.5 text-[10px] text-muted-foreground">
                                  {format(parseISO(issue.date), "M/d (EEE)", {
                                    locale: ko,
                                  })}
                                  {author && ` · ${author.name}`}
                                </div>
                                <p className="text-sm leading-snug text-orange-900">
                                  {issue.content}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        !isAddingIssue && (
                          <span className="text-sm text-muted-foreground">
                            등록된 이슈 없음
                          </span>
                        )
                      )}
                      {isAddingIssue && (
                        <ProjectIssueInputRow
                          projectId={project.id}
                          onDone={() => setAddingIssueProjectId(null)}
                        />
                      )}
                      {canAddIssue() && !isAddingIssue && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 h-8 text-xs"
                          onClick={() => {
                            setAddingRemarkProjectId(null);
                            setAddingIssueProjectId(project.id);
                          }}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          이슈 작성
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {projectRemarks.length > 0 ? (
                        <ul className="space-y-2">
                          {projectRemarks.map((remark) => (
                            <li
                              key={remark.id}
                              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-snug text-slate-800"
                            >
                              {formatRemarkLine(remark)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        !isAddingRemark && (
                          <span className="text-sm text-muted-foreground">
                            등록된 비고 없음
                          </span>
                        )
                      )}
                      {isAddingRemark && (
                        <ProjectRemarkInputRow
                          projectId={project.id}
                          weekStartISO={weekStartISO}
                          onDone={() => setAddingRemarkProjectId(null)}
                        />
                      )}
                      {canAddIssue() && !isAddingRemark && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 h-8 text-xs"
                          onClick={() => {
                            setAddingIssueProjectId(null);
                            setAddingRemarkProjectId(project.id);
                          }}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          비고 작성
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
