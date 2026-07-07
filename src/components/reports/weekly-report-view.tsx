"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Presentation, Trash2, ClipboardList, Save } from "lucide-react";
import { format, addWeeks, subWeeks } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { useApp } from "@/context/app-context";
import {
  WORK_PARTS,
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
  REPORT_TASK_VIEW_LABELS,
  REPORT_TASK_VIEWS,
  USER_PART_TO_WORK,
  PART_LABELS,
  type TaskType,
  type TaskStatus,
  type ReportTaskView,
  type WeeklyTask,
  type Project,
} from "@/types";
import { GlobalProjectFilter } from "@/components/shared/global-project-filter";
import { YearFilterSelect } from "@/components/shared/year-filter-select";
import { WeeklyProjectIssueBoard } from "@/components/reports/weekly-project-issue-board";
import {
  getAnchorWeekForYear,
  isWeekInYear,
  filterTasksByReportView,
  formatWeekRange,
  getWeekStartForReportView,
  getWeekDates,
} from "@/lib/week-utils";
import {
  getAvailableYears,
  filterProjectsByYear,
  getDefaultSelectedYear,
  dateInYear,
} from "@/lib/project-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_STYLE: Record<TaskStatus, string> = {
  완료: "bg-slate-100 text-slate-600",
  진행: "bg-emerald-50 text-emerald-700",
};

function buildProjectGroupedRows(
  tasks: WeeklyTask[],
  getProjectById: (id: string) => { code: string } | undefined,
  getUserById: (id: string) => { name: string } | undefined
) {
  const projectIds = [...new Set(tasks.map((t) => t.projectId))].sort(
    (a, b) =>
      (getProjectById(a)?.code ?? a).localeCompare(
        getProjectById(b)?.code ?? b
      )
  );

  type Row = {
    task: WeeklyTask;
    showProject: boolean;
    projectRowSpan: number;
    showMember: boolean;
    memberRowSpan: number;
  };

  const rows: Row[] = [];

  for (const projectId of projectIds) {
    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    const memberIds = [...new Set(projectTasks.map((t) => t.userId))].sort(
      (a, b) =>
        (getUserById(a)?.name ?? a).localeCompare(getUserById(b)?.name ?? b)
    );
    const projectRowSpan = projectTasks.length;
    let isFirstProjectRow = true;

    for (const memberId of memberIds) {
      const memberTasks = projectTasks.filter((t) => t.userId === memberId);
      const memberRowSpan = memberTasks.length;
      let isFirstMemberRow = true;

      for (const task of memberTasks) {
        rows.push({
          task,
          showProject: isFirstProjectRow,
          projectRowSpan,
          showMember: isFirstMemberRow,
          memberRowSpan,
        });
        isFirstProjectRow = false;
        isFirstMemberRow = false;
      }
    }
  }

  return rows;
}

function MeetingPartProjectTable({ tasks }: { tasks: WeeklyTask[] }) {
  const { getProjectById, getUserById } = useApp();
  const rows = buildProjectGroupedRows(tasks, getProjectById, getUserById);

  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        해당 파트 업무 없음
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-28 font-semibold">프로젝트</TableHead>
            <TableHead className="w-20 font-semibold">담당</TableHead>
            <TableHead className="w-32 font-semibold">기간</TableHead>
            <TableHead className="w-14 font-semibold">구분</TableHead>
            <TableHead className="min-w-[300px] font-semibold">업무내용</TableHead>
            <TableHead className="w-14 text-right font-semibold">M/D</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ task, showProject, projectRowSpan, showMember, memberRowSpan }) => {
            const project = getProjectById(task.projectId);
            const user = getUserById(task.userId);
            return (
              <TableRow key={task.id} className="align-top">
                {showProject && (
                  <TableCell
                    rowSpan={projectRowSpan}
                    className="border-r border-border/80 bg-primary/5 align-middle"
                  >
                    <div className="space-y-1 py-1">
                      <p className="font-mono text-sm font-bold text-primary">
                        {project?.code}
                      </p>
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        {project?.name}
                      </p>
                      <Badge variant="secondary" className="mt-1 font-mono text-[10px]">
                        M/D{" "}
                        {tasks
                          .filter((t) => t.projectId === task.projectId)
                          .reduce((s, t) => s + t.md, 0)
                          .toFixed(2)}
                      </Badge>
                    </div>
                  </TableCell>
                )}
                {showMember && (
                  <TableCell
                    rowSpan={memberRowSpan}
                    className="border-r border-border/60 bg-muted/20 align-middle font-medium"
                  >
                    <p className="text-sm">{user?.name}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-primary">
                      {tasks
                        .filter(
                          (t) =>
                            t.projectId === task.projectId &&
                            t.userId === task.userId
                        )
                        .reduce((s, t) => s + t.md, 0)
                        .toFixed(2)}
                      M
                    </p>
                  </TableCell>
                )}
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {task.startDate} ~ {task.endDate}
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", STATUS_STYLE[task.status])}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm leading-relaxed whitespace-pre-wrap">
                  {task.content}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold text-primary">
                  {task.md}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function TaskTable({
  tasks,
  showUser = false,
  editable = false,
  onDelete,
}: {
  tasks: WeeklyTask[];
  showUser?: boolean;
  editable?: boolean;
  onDelete?: (id: string) => void;
}) {
  const { getProjectById, getUserById } = useApp();

  if (tasks.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        등록된 업무가 없습니다
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            {showUser && <TableHead className="w-20">담당</TableHead>}
            <TableHead className="w-24">프로젝트</TableHead>
            <TableHead className="w-32">기간</TableHead>
            <TableHead className="w-14">구분</TableHead>
            <TableHead className="min-w-[280px]">업무내용</TableHead>
            <TableHead className="w-14 text-right">M/D</TableHead>
            {editable && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const project = getProjectById(task.projectId);
            const user = getUserById(task.userId);
            return (
              <TableRow key={task.id}>
                {showUser && (
                  <TableCell className="text-sm font-medium whitespace-nowrap">
                    {user?.name}
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {project?.code}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {task.startDate} ~ {task.endDate}
                </TableCell>
                <TableCell>
                  <Badge className={cn("text-xs", STATUS_STYLE[task.status])}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm leading-relaxed whitespace-pre-wrap">
                  {task.content}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold text-primary whitespace-nowrap">
                  {task.md}
                </TableCell>
                {editable && onDelete && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => onDelete(task.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function ReportTaskTabsList({
  showCounts,
  counts,
}: {
  showCounts?: boolean;
  counts?: Partial<Record<ReportTaskView, number>>;
}) {
  return (
    <TabsList className="mx-auto grid w-full max-w-xl grid-cols-3">
      {REPORT_TASK_VIEWS.map((view) => (
        <TabsTrigger key={view} value={view} className="px-3">
          {REPORT_TASK_VIEW_LABELS[view]}
          {showCounts && counts?.[view] !== undefined
            ? ` (${counts[view]})`
            : ""}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

function getTaskYears(tasks: WeeklyTask[]): number[] {
  const years = new Set<number>();
  for (const t of tasks) {
    years.add(parseInt(t.startDate.slice(0, 4), 10));
  }
  return [...years].sort((a, b) => b - a);
}

type DraftRow = {
  key: string;
  projectId: string;
  startDate: string;
  endDate: string;
  content: string;
  md: number;
  status: TaskStatus;
};

function getDefaultDatesForView(
  reportWeekStart: Date,
  view: ReportTaskView
): { startDate: string; endDate: string } {
  const week = getWeekStartForReportView(reportWeekStart, view);
  const dates = getWeekDates(week);
  return {
    startDate: format(dates[0], "yyyy-MM-dd"),
    endDate: format(dates[4], "yyyy-MM-dd"),
  };
}

function createDraftRow(
  startDate: string,
  endDate: string
): DraftRow {
  return {
    key: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    projectId: "",
    startDate,
    endDate,
    content: "",
    md: 0.5,
    status: "진행",
  };
}

function WeeklyTaskSection({
  yearProjects,
  yearTasks,
  reportWeekStart,
  variant,
}: {
  yearProjects: Project[];
  yearTasks: WeeklyTask[];
  reportWeekStart: Date;
  variant: "member" | "admin";
}) {
  const {
    currentUser,
    addWeeklyTask,
    deleteWeeklyTask,
    canEditTask,
  } = useApp();

  const [taskView, setTaskView] = useState<ReportTaskView>("THIS_WEEK");
  const defaultDates = getDefaultDatesForView(reportWeekStart, "THIS_WEEK");
  const [drafts, setDrafts] = useState<DraftRow[]>(() => [
    createDraftRow(defaultDates.startDate, defaultDates.endDate),
  ]);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const dates = getDefaultDatesForView(reportWeekStart, taskView);
    setDrafts([createDraftRow(dates.startDate, dates.endDate)]);
    setSavedFlash(false);
  }, [taskView, reportWeekStart]);

  const workPart =
    variant === "member" && currentUser
      ? USER_PART_TO_WORK[currentUser.part]
      : undefined;

  if (variant === "member") {
    if (!currentUser) return null;
    if (!workPart) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            PM/관리자 계정은 상단 Demo에서 MEMBER로 전환하거나, 김찬기 등 팀원
            계정으로 로그인하세요.
          </CardContent>
        </Card>
      );
    }
  }

  const canWrite =
    variant === "member" &&
    (taskView === "THIS_WEEK" || taskView === "NEXT_WEEK");
  const taskTypeForSave: TaskType =
    taskView === "NEXT_WEEK" ? "NEXT_WEEK" : "THIS_WEEK";

  const validDrafts = drafts.filter(
    (r) => r.projectId && r.content.trim() && r.startDate && r.endDate
  );

  const updateDraft = (key: string, patch: Partial<DraftRow>) => {
    setDrafts((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
    );
  };

  const addDraftRow = () => {
    const dates = getDefaultDatesForView(reportWeekStart, taskView);
    setDrafts((prev) => [
      ...prev,
      createDraftRow(dates.startDate, dates.endDate),
    ]);
  };

  const removeDraftRow = (key: string) => {
    setDrafts((prev) =>
      prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)
    );
  };

  const handleSave = () => {
    if (!canWrite || !currentUser || !workPart || validDrafts.length === 0)
      return;
    for (const row of validDrafts) {
      addWeeklyTask({
        projectId: row.projectId,
        userId: currentUser.id,
        part: workPart,
        taskType: taskTypeForSave,
        startDate: row.startDate,
        endDate: row.endDate,
        status: row.status,
        content: row.content.trim(),
        md: row.md,
      });
    }
    const dates = getDefaultDatesForView(reportWeekStart, taskView);
    setDrafts([createDraftRow(dates.startDate, dates.endDate)]);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  const tabCounts = Object.fromEntries(
    REPORT_TASK_VIEWS.map((view) => [
      view,
      filterTasksByReportView(yearTasks, reportWeekStart, view).length,
    ])
  );

  return (
    <Card className="glass-card border-0">
      <Tabs
        value={taskView}
        onValueChange={(v) => setTaskView(v as ReportTaskView)}
      >
        <CardHeader className="border-b border-border/60 pb-3">
          <ReportTaskTabsList
            showCounts={variant === "admin"}
            counts={tabCounts}
          />
        </CardHeader>

        {REPORT_TASK_VIEWS.map((view) => {
          const viewWeek = getWeekStartForReportView(reportWeekStart, view);
          const viewTasks = filterTasksByReportView(
            yearTasks,
            reportWeekStart,
            view
          );
          const displayTasks =
            variant === "member" && currentUser
              ? viewTasks.filter((t) => t.userId === currentUser.id)
              : viewTasks;
          const writable =
            variant === "member" &&
            (view === "THIS_WEEK" || view === "NEXT_WEEK");

          return (
            <TabsContent key={view} value={view} className="m-0">
              <div className="border-b border-border/40 bg-muted/15 px-4 py-2 text-xs text-muted-foreground">
                {formatWeekRange(viewWeek)} · {displayTasks.length}건
                {writable && (
                  <span className="ml-2 text-primary">
                    → {REPORT_TASK_VIEW_LABELS[view]} 저장 시{" "}
                    {view === "NEXT_WEEK" ? "다음주 계획" : "이번주 실적"}에
                    등록
                  </span>
                )}
              </div>

              {writable && (
                <div className="space-y-2 border-b border-border/40 px-4 py-3">
                  {drafts.map((row) => (
                    <div
                      key={row.key}
                      className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 p-2"
                    >
                      <Select
                        value={row.projectId}
                        onValueChange={(v) =>
                          updateDraft(row.key, { projectId: v })
                        }
                      >
                        <SelectTrigger className="h-8 w-[120px] shrink-0 text-xs">
                          <SelectValue placeholder="프로젝트" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearProjects.map((p) => (
                            <SelectItem
                              key={p.id}
                              value={p.id}
                              className="text-xs"
                            >
                              {p.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        value={row.startDate}
                        onChange={(e) =>
                          updateDraft(row.key, { startDate: e.target.value })
                        }
                        className="h-8 w-[128px] shrink-0 text-xs"
                        title="시작일"
                      />
                      <Input
                        type="date"
                        value={row.endDate}
                        onChange={(e) =>
                          updateDraft(row.key, { endDate: e.target.value })
                        }
                        className="h-8 w-[128px] shrink-0 text-xs"
                        title="종료일"
                      />
                      <Input
                        value={row.content}
                        onChange={(e) =>
                          updateDraft(row.key, { content: e.target.value })
                        }
                        placeholder="업무 내용"
                        className="h-8 min-w-[120px] flex-1 text-sm"
                      />
                      <Input
                        type="number"
                        step="0.25"
                        min="0"
                        value={row.md}
                        onChange={(e) =>
                          updateDraft(row.key, {
                            md: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-8 w-14 shrink-0 font-numeric text-xs"
                        title="M/D"
                      />
                      <Select
                        value={row.status}
                        onValueChange={(v) =>
                          updateDraft(row.key, { status: v as TaskStatus })
                        }
                      >
                        <SelectTrigger className="h-8 w-[72px] shrink-0 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(TASK_STATUS_LABELS) as TaskStatus[]
                          ).map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {drafts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive"
                          onClick={() => removeDraftRow(row.key)}
                          title="삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDraftRow}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      추가
                    </Button>
                    <div className="flex items-center gap-2">
                      {savedFlash && (
                        <span className="text-xs text-emerald-600">저장됨</span>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        disabled={validDrafts.length === 0}
                        onClick={handleSave}
                      >
                        <Save className="mr-1 h-4 w-4" />
                        저장 ({validDrafts.length})
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <TaskTable
                tasks={displayTasks}
                showUser={variant === "admin"}
                editable={
                  writable &&
                  !!currentUser &&
                  canEditTask(currentUser.id)
                }
                onDelete={deleteWeeklyTask}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </Card>
  );
}

function MeetingTaskSections({
  yearTasks,
  reportWeekStart,
}: {
  yearTasks: WeeklyTask[];
  reportWeekStart: Date;
}) {
  const [activeView, setActiveView] = useState<ReportTaskView>("THIS_WEEK");
  const tasksForView = filterTasksByReportView(
    yearTasks,
    reportWeekStart,
    activeView
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={activeView}
          onValueChange={(v) => setActiveView(v as ReportTaskView)}
        >
          <ReportTaskTabsList
            showCounts
            counts={Object.fromEntries(
              REPORT_TASK_VIEWS.map((view) => [
                view,
                filterTasksByReportView(yearTasks, reportWeekStart, view).length,
              ])
            )}
          />
        </Tabs>
        <Badge variant="outline" className="gap-1">
          <Presentation className="h-3 w-3" />
          회의 모드 · {formatWeekRange(reportWeekStart)}
        </Badge>
      </div>

      {WORK_PARTS.map((part) => {
        const partTasks = tasksForView.filter((t) => t.part === part);
        if (partTasks.length === 0) return null;
        const partMD = partTasks.reduce((s, t) => s + t.md, 0);
        return (
          <Card key={part} className="border-0 shadow-md">
            <CardHeader className="border-b bg-muted/20 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                  {part.charAt(0)}
                </span>
                [{part}] 파트
                <Badge variant="secondary" className="ml-auto">
                  {partTasks.length}건 · M/D {partMD.toFixed(2)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MeetingPartProjectTable tasks={partTasks} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function WeeklyReportView() {
  const {
    currentUser,
    projects,
    weeklyTasks,
    projectFilter,
    meetingMode,
    setMeetingMode,
    canViewAllReports,
    filteredWeeklyTasks,
  } = useApp();

  const availableYears = useMemo(() => {
    const merged = new Set([
      ...getAvailableYears(projects),
      ...getTaskYears(weeklyTasks),
    ]);
    return [...merged].sort((a, b) => b - a);
  }, [projects, weeklyTasks]);
  const [selectedYear, setSelectedYear] = useState(() =>
    getDefaultSelectedYear(
      [...new Set([...getAvailableYears(projects), ...getTaskYears(weeklyTasks)])].sort(
        (a, b) => b - a
      )
    )
  );
  const [reportWeekStart, setReportWeekStart] = useState(() =>
    getAnchorWeekForYear(getDefaultSelectedYear(getAvailableYears(projects)))
  );

  const yearProjects = useMemo(() => {
    const byYear = filterProjectsByYear(projects, selectedYear);
    if (projectFilter === "all") return byYear;
    return byYear.filter((p) => p.id === projectFilter);
  }, [projects, selectedYear, projectFilter]);

  const yearTasks = useMemo(
    () =>
      filteredWeeklyTasks.filter((t) => dateInYear(t.startDate, selectedYear)),
    [filteredWeeklyTasks, selectedYear]
  );

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setReportWeekStart(getAnchorWeekForYear(year));
  };

  const handlePrevWeek = () => {
    const next = subWeeks(reportWeekStart, 1);
    if (isWeekInYear(next, selectedYear)) setReportWeekStart(next);
  };

  const handleNextWeek = () => {
    const next = addWeeks(reportWeekStart, 1);
    if (isWeekInYear(next, selectedYear)) setReportWeekStart(next);
  };

  const isMember = currentUser?.role === "MEMBER";
  const thisWeekCount = filterTasksByReportView(
    yearTasks,
    reportWeekStart,
    "THIS_WEEK"
  ).length;

  return (
    <div className={cn("page-stack", meetingMode && "max-w-none")}>
      <PageHeader
        icon={ClipboardList}
        iconClassName="bg-violet-500/10 text-violet-600 ring-violet-500/15"
        title={`주간 업무 보고 (${selectedYear})`}
        description={`이번주 이슈 · 실적/계획 · 더미: ${formatWeekRange(reportWeekStart)} 주차 기준`}
      >
        <YearFilterSelect
          years={availableYears}
          value={selectedYear}
          onChange={handleYearChange}
        />
        {!meetingMode && <GlobalProjectFilter />}
        {canViewAllReports() && (
          <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">
            <Presentation className="h-4 w-4 text-primary" />
            <Label htmlFor="meeting-mode" className="text-sm font-medium">
              회의 모드
            </Label>
            <Switch
              id="meeting-mode"
              checked={meetingMode}
              onCheckedChange={setMeetingMode}
            />
          </div>
        )}
      </PageHeader>

      {!isMember && canViewAllReports() && (
        <p className="rounded-lg border border-violet-200/80 bg-violet-50/50 px-4 py-2.5 text-xs text-violet-900">
          전체 조회는 관리자/팀장 화면입니다. 업무 작성은{" "}
          <strong>MEMBER</strong> 계정(예: 김찬기) 로그인 또는 상단 Demo 역할
          전환 후 확인하세요. 이번주 실적 더미 {thisWeekCount}건.
        </p>
      )}

      {/* 이번주 이슈 — 항상 표시 (등록 + 조회) */}
      <WeeklyProjectIssueBoard
        weekStart={reportWeekStart}
        selectedYear={selectedYear}
        yearProjects={yearProjects}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
      />

      {isMember && !meetingMode && (
        <WeeklyTaskSection
          variant="member"
          yearProjects={yearProjects}
          yearTasks={yearTasks}
          reportWeekStart={reportWeekStart}
        />
      )}

      {canViewAllReports() && meetingMode && (
        <MeetingTaskSections
          yearTasks={yearTasks}
          reportWeekStart={reportWeekStart}
        />
      )}

      {canViewAllReports() && !meetingMode && (
        <WeeklyTaskSection
          variant="admin"
          yearProjects={yearProjects}
          yearTasks={yearTasks}
          reportWeekStart={reportWeekStart}
        />
      )}
    </div>
  );
}
