"use client";

import { useState } from "react";
import { Plus, Presentation, Trash2 } from "lucide-react";
import { format, addWeeks, subWeeks } from "date-fns";
import { useApp } from "@/context/app-context";
import {
  WORK_PARTS,
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
  USER_PART_TO_WORK,
  PART_LABELS,
  type TaskType,
  type TaskStatus,
  type WeeklyTask,
} from "@/types";
import { GlobalProjectFilter } from "@/components/shared/global-project-filter";
import { WeeklyProjectIssueBoard } from "@/components/reports/weekly-project-issue-board";
import { getWeekStart } from "@/lib/week-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

function TaskEntryForm() {
  const {
    currentUser,
    projects,
    addWeeklyTask,
    filteredWeeklyTasks,
    deleteWeeklyTask,
    canEditTask,
  } = useApp();

  const [taskType, setTaskType] = useState<TaskType>("THIS_WEEK");
  const [form, setForm] = useState({
    projectId: "",
    startDate: "2026-06-16",
    endDate: "2026-06-20",
    status: "진행" as TaskStatus,
    content: "",
    md: 0.5,
  });

  if (!currentUser) return null;

  const workPart = USER_PART_TO_WORK[currentUser.part];
  if (!workPart) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          PM/관리자 계정은 팀원 계정으로 전환하여 업무를 작성하세요.
        </CardContent>
      </Card>
    );
  }

  const myTasks = filteredWeeklyTasks.filter(
    (t) => t.userId === currentUser.id && t.taskType === taskType
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId || !form.content) return;
    addWeeklyTask({
      projectId: form.projectId,
      userId: currentUser.id,
      part: workPart,
      taskType,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      content: form.content,
      md: form.md,
    });
    setForm((prev) => ({ ...prev, content: "", md: 0.5 }));
  };

  return (
    <div className="space-y-4">
      <Tabs value={taskType} onValueChange={(v) => setTaskType(v as TaskType)}>
        <TabsList>
          <TabsTrigger value="THIS_WEEK">이번주 실적</TabsTrigger>
          <TabsTrigger value="NEXT_WEEK">다음주 계획</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {TASK_TYPE_LABELS[taskType]} 작성
            <Badge variant="secondary" className="ml-2">
              {workPart}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>프로젝트</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(v) => setForm({ ...form, projectId: v })}
                >
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
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>종료일</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>구분</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as TaskStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_100px]">
              <div className="space-y-2">
                <Label>업무내용</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  placeholder="업무 내용을 입력하세요"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>M/D</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  value={form.md}
                  onChange={(e) =>
                    setForm({ ...form, md: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <Button type="submit" disabled={!form.projectId || !form.content}>
              <Plus className="mr-2 h-4 w-4" />
              업무 추가
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            내 {TASK_TYPE_LABELS[taskType]} ({myTasks.length}건)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TaskTable
            tasks={myTasks}
            editable={canEditTask(currentUser.id)}
            onDelete={deleteWeeklyTask}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function MeetingTaskSections() {
  const { weeklyTasks } = useApp();
  const [activeWeek, setActiveWeek] = useState<TaskType>("THIS_WEEK");
  const tasksForWeek = weeklyTasks.filter((t) => t.taskType === activeWeek);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={activeWeek}
          onValueChange={(v) => setActiveWeek(v as TaskType)}
        >
          <TabsList className="h-10">
            <TabsTrigger value="THIS_WEEK" className="px-5">
              {TASK_TYPE_LABELS.THIS_WEEK} (
              {weeklyTasks.filter((t) => t.taskType === "THIS_WEEK").length})
            </TabsTrigger>
            <TabsTrigger value="NEXT_WEEK" className="px-5">
              {TASK_TYPE_LABELS.NEXT_WEEK} (
              {weeklyTasks.filter((t) => t.taskType === "NEXT_WEEK").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Badge variant="outline" className="gap-1">
          <Presentation className="h-3 w-3" />
          회의 모드 · 파트별 통합 뷰
        </Badge>
      </div>

      {WORK_PARTS.map((part) => {
        const partTasks = tasksForWeek.filter((t) => t.part === part);
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
    meetingMode,
    setMeetingMode,
    canViewAllReports,
    filteredWeeklyTasks,
  } = useApp();

  const [reportWeekStart, setReportWeekStart] = useState(() =>
    getWeekStart(new Date("2026-06-18"))
  );

  const isMember = currentUser?.role === "MEMBER";

  return (
    <div className={cn("space-y-6", meetingMode && "max-w-none")}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">주간 업무 보고</h1>
          <p className="text-sm text-muted-foreground">
            이번주 이슈 · 실적/계획 · 프로젝트 현황 통합 관리
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!meetingMode && <GlobalProjectFilter />}
          {canViewAllReports() && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2">
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
        </div>
      </div>

      {/* 이번주 이슈 — 항상 표시 (등록 + 조회) */}
      <WeeklyProjectIssueBoard
        weekStart={reportWeekStart}
        onPrevWeek={() => setReportWeekStart(subWeeks(reportWeekStart, 1))}
        onNextWeek={() => setReportWeekStart(addWeeks(reportWeekStart, 1))}
      />

      {isMember && !meetingMode && <TaskEntryForm />}

      {canViewAllReports() && meetingMode && <MeetingTaskSections />}

      {canViewAllReports() && !meetingMode && (
        <Tabs defaultValue="THIS_WEEK">
          <TabsList>
            <TabsTrigger value="THIS_WEEK">이번주 실적</TabsTrigger>
            <TabsTrigger value="NEXT_WEEK">다음주 계획</TabsTrigger>
          </TabsList>
          {(["THIS_WEEK", "NEXT_WEEK"] as TaskType[]).map((type) => (
            <TabsContent key={type} value={type}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {TASK_TYPE_LABELS[type]} 전체 (
                    {
                      filteredWeeklyTasks.filter((t) => t.taskType === type)
                        .length
                    }
                    건)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <TaskTable
                    tasks={filteredWeeklyTasks.filter(
                      (t) => t.taskType === type
                    )}
                    showUser
                  />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
