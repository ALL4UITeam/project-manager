"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  Layers,
  Lightbulb,
  Palette,
  Code2,
  PieChartIcon,
  ListTree,
  List,
  FolderKanban,
  User,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { WORK_PARTS, TASK_TYPE_LABELS, type TaskType } from "@/types";
import { GlobalProjectFilter } from "@/components/shared/global-project-filter";
import { PageHeader } from "@/components/shared/page-header";
import { YearFilterSelect } from "@/components/shared/year-filter-select";
import {
  getAvailableYears,
  getDefaultSelectedYear,
  filterProjectsByYear,
  dateInYear,
} from "@/lib/project-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TableFooter,
} from "@/components/ui/table";

const PART_COLORS: Record<string, string> = {
  기획: "#f59e0b",
  디자인: "#ec4899",
  퍼블리싱: "#06b6d4",
};

const PART_ICONS = {
  기획: Lightbulb,
  디자인: Palette,
  퍼블리싱: Code2,
} as const;

type DetailView = "grouped" | "flat" | string;

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; payload?: { fullName?: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  const fullName = payload[0]?.payload?.fullName;

  return (
    <div className="rounded-xl border border-border/80 bg-card/95 px-3 py-2.5 shadow-lg backdrop-blur-sm">
      <p className="font-display text-xs font-bold">{fullName ?? label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.name}
            </span>
            <span className="font-numeric font-semibold">{p.value?.toFixed(2)} M/D</span>
          </div>
        ))}
      </div>
      <div className="mt-2 border-t border-border/60 pt-1.5 text-xs font-semibold">
        합계{" "}
        <span className="font-numeric text-primary">{total.toFixed(2)} M/D</span>
      </div>
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload?: { fill: string; pct: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-border/80 bg-card/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-xs font-semibold">{p.name}</p>
      <p className="font-numeric mt-0.5 text-sm font-bold text-primary">
        {p.value?.toFixed(2)} M/D
        <span className="ml-1 text-xs font-normal text-muted-foreground">
          ({p.payload?.pct?.toFixed(1)}%)
        </span>
      </p>
    </div>
  );
}

export function MDDashboard() {
  const {
    projects,
    filteredWeeklyTasks,
    getProjectById,
    getUserById,
    projectFilter,
    setProjectFilter,
  } = useApp();

  const availableYears = useMemo(
    () => getAvailableYears(projects),
    [projects]
  );
  const [selectedYear, setSelectedYear] = useState(() =>
    getDefaultSelectedYear(getAvailableYears(projects))
  );
  const [detailView, setDetailView] = useState<DetailView>("grouped");

  const projectsInYear = useMemo(
    () => filterProjectsByYear(projects, selectedYear),
    [projects, selectedYear]
  );

  const yearProjects = useMemo(() => {
    if (projectFilter === "all") return projectsInYear;
    return projectsInYear.filter((p) => p.id === projectFilter);
  }, [projectsInYear, projectFilter]);

  const yearProjectIds = useMemo(
    () => new Set(yearProjects.map((p) => p.id)),
    [yearProjects]
  );

  const yearTasks = useMemo(
    () =>
      filteredWeeklyTasks.filter(
        (t) =>
          t.taskType === "THIS_WEEK" &&
          dateInYear(t.startDate, selectedYear) &&
          yearProjectIds.has(t.projectId)
      ),
    [filteredWeeklyTasks, selectedYear, yearProjectIds]
  );

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setDetailView("grouped");
    if (projectFilter !== "all") {
      const stillVisible = filterProjectsByYear(projects, year).some(
        (p) => p.id === projectFilter
      );
      if (!stillVisible) setProjectFilter("all");
    }
  };

  const chartData = useMemo(() => {
    return yearProjects
      .map((project) => {
        const tasks = yearTasks.filter((t) => t.projectId === project.id);
        const byPart = WORK_PARTS.reduce(
          (acc, part) => {
            acc[part] = tasks
              .filter((t) => t.part === part)
              .reduce((s, t) => s + t.md, 0);
            return acc;
          },
          {} as Record<string, number>
        );
        return {
          name: project.code,
          fullName: project.name,
          기획: byPart["기획"],
          디자인: byPart["디자인"],
          퍼블리싱: byPart["퍼블리싱"],
          total: tasks.reduce((s, t) => s + t.md, 0),
        };
      })
      .filter((d) => d.total > 0);
  }, [yearProjects, yearTasks]);

  const totalMD = yearTasks.reduce((s, t) => s + t.md, 0);

  const partSummary = WORK_PARTS.map((part) => ({
    part,
    md: yearTasks
      .filter((t) => t.part === part)
      .reduce((s, t) => s + t.md, 0),
  }));

  const pieData = useMemo(
    () =>
      partSummary
        .filter(({ md }) => md > 0)
        .map(({ part, md }) => ({
          name: part,
          value: md,
          fill: PART_COLORS[part],
          pct: totalMD > 0 ? (md / totalMD) * 100 : 0,
        })),
    [partSummary, totalMD]
  );

  const projectGroups = useMemo(() => {
    const projectIds = [
      ...new Set(yearTasks.map((t) => t.projectId)),
    ].sort((a, b) => {
      const codeA = getProjectById(a)?.code ?? a;
      const codeB = getProjectById(b)?.code ?? b;
      return codeA.localeCompare(codeB);
    });

    return projectIds.map((projectId) => {
      const project = getProjectById(projectId);
      const tasks = [...yearTasks.filter((t) => t.projectId === projectId)].sort(
        (a, b) =>
          a.part.localeCompare(b.part) ||
          (getUserById(a.userId)?.name ?? "").localeCompare(
            getUserById(b.userId)?.name ?? ""
          )
      );
      const totalMd = tasks.reduce((s, t) => s + t.md, 0);
      const byPart = WORK_PARTS.map((part) => ({
        part,
        md: tasks.filter((t) => t.part === part).reduce((s, t) => s + t.md, 0),
      }));

      return { project, tasks, totalMd, byPart };
    });
  }, [yearTasks, getProjectById, getUserById]);

  const flatTasks = useMemo(
    () =>
      [...yearTasks].sort(
        (a, b) =>
          (getProjectById(a.projectId)?.code ?? "").localeCompare(
            getProjectById(b.projectId)?.code ?? ""
          ) ||
          a.part.localeCompare(b.part) ||
          (getUserById(a.userId)?.name ?? "").localeCompare(
            getUserById(b.userId)?.name ?? ""
          )
      ),
    [yearTasks, getProjectById, getUserById]
  );

  const displayedGroups = useMemo(() => {
    if (detailView === "grouped") return projectGroups;
    if (detailView === "flat") return [];
    return projectGroups.filter((g) => g.project?.id === detailView);
  }, [detailView, projectGroups]);

  const displayedFlatTasks = useMemo(() => {
    if (detailView === "flat") return flatTasks;
    if (detailView !== "grouped" && detailView !== "flat") {
      return flatTasks.filter((t) => t.projectId === detailView);
    }
    return [];
  }, [detailView, flatTasks]);

  const detailTotal =
    detailView === "flat"
      ? displayedFlatTasks.reduce((s, t) => s + t.md, 0)
      : detailView === "grouped"
        ? totalMD
        : displayedFlatTasks.reduce((s, t) => s + t.md, 0);

  const selectedProjectLabel =
    projectFilter === "all"
      ? `전체 (${yearProjects.length}개)`
      : (getProjectById(projectFilter)?.code ?? "프로젝트");

  const detailViewLabel =
    detailView === "grouped"
      ? "프로젝트별 묶음"
      : detailView === "flat"
        ? "전체 통합"
        : (getProjectById(detailView)?.code ?? "프로젝트");

  const renderTaskRow = (task: (typeof flatTasks)[0]) => {
    const user = getUserById(task.userId);
    const project = getProjectById(task.projectId);
    const PartIcon = PART_ICONS[task.part as keyof typeof PART_ICONS];
    return (
      <TableRow key={task.id}>
        {detailView === "flat" && (
          <TableCell className="font-mono text-xs font-bold text-primary">
            {project?.code}
          </TableCell>
        )}
        <TableCell className="text-sm">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3 w-3 text-muted-foreground" />
            {user?.name}
          </span>
        </TableCell>
        <TableCell>
          <Badge
            variant="secondary"
            className="gap-1 text-xs"
            style={{ borderColor: PART_COLORS[task.part] }}
          >
            {PartIcon && <PartIcon className="h-3 w-3" style={{ color: PART_COLORS[task.part] }} />}
            {task.part}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {TASK_TYPE_LABELS[task.taskType as TaskType]}
        </TableCell>
        <TableCell className="text-sm">{task.content}</TableCell>
        <TableCell className="text-right font-numeric font-semibold text-primary">
          {task.md}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="page-stack">
      <PageHeader
        icon={BarChart3}
        iconClassName="bg-amber-500/10 text-amber-600 ring-amber-500/15"
        title={`M/D 공수 현황 (${selectedYear})`}
        description={`${selectedYear}년 프로젝트 · 이번주 실적 M/D 집계 (시작~종료 연도 기준)`}
      >
        <YearFilterSelect
          years={availableYears}
          value={selectedYear}
          onChange={handleYearChange}
        />
        <GlobalProjectFilter projects={projectsInYear} />
      </PageHeader>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card overflow-hidden border-0">
          <CardContent className="relative p-4">
            <div className="absolute -right-3 -top-3 opacity-[0.07]">
              <Layers className="h-20 w-20 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                총 M/D · {selectedYear}년 · {selectedProjectLabel}
              </p>
            </div>
            <p className="stat-value mt-2 text-2xl">{totalMD.toFixed(2)}</p>
          </CardContent>
        </Card>
        {partSummary.map(({ part, md }) => {
          const Icon = PART_ICONS[part as keyof typeof PART_ICONS];
          const color = PART_COLORS[part];
          return (
            <Card key={part} className="glass-card overflow-hidden border-0">
              <CardContent className="relative p-4">
                <div
                  className="absolute -right-3 -top-3 opacity-[0.08]"
                  style={{ color }}
                >
                  <Icon className="h-20 w-20" />
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{part}</p>
                </div>
                <p className="font-numeric mt-2 text-2xl font-semibold tracking-tight">
                  {md.toFixed(2)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">M/D</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-3 lg:grid-cols-5">
        <Card className="glass-card border-0 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-3.5 w-3.5" />
              </div>
              프로젝트별 파트 M/D
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {chartData.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                {selectedYear}년에 집계할 M/D 데이터가 없습니다
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="oklch(0.88 0.02 265 / 0.6)"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "oklch(0.52 0.03 265)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={72}
                    tick={{ fontSize: 11, fontWeight: 600, fill: "oklch(0.45 0.08 265)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(0.94 0.01 265 / 0.5)" }} />
                  {WORK_PARTS.map((part, i) => (
                    <Bar
                      key={part}
                      dataKey={part}
                      stackId="a"
                      fill={PART_COLORS[part]}
                      radius={
                        i === WORK_PARTS.length - 1 ? [0, 6, 6, 0] : [0, 0, 0, 0]
                      }
                      maxBarSize={28}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              {WORK_PARTS.map((part) => {
                const Icon = PART_ICONS[part as keyof typeof PART_ICONS];
                return (
                  <span key={part} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="h-3 w-3" style={{ color: PART_COLORS[part] }} />
                    <span
                      className="h-2 w-2 rounded-sm"
                      style={{ backgroundColor: PART_COLORS[part] }}
                    />
                    {part}
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-display text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                <PieChartIcon className="h-3.5 w-3.5" />
              </div>
              파트별 M/D 비율
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {pieData.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                표시할 데이터가 없습니다
              </p>
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={96}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="var(--card)"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      formatter={(value) => (
                        <span className="text-xs text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-8">
                  <div className="text-center">
                    <p className="font-numeric text-2xl font-bold text-primary">
                      {totalMD.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Total M/D</p>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-1 space-y-2">
              {partSummary.map(({ part, md }) => {
                const pct = totalMD > 0 ? (md / totalMD) * 100 : 0;
                const Icon = PART_ICONS[part as keyof typeof PART_ICONS];
                return (
                  <div key={part} className="flex items-center gap-2 text-xs">
                    <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: PART_COLORS[part] }} />
                    <span className="w-14 shrink-0">{part}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: PART_COLORS[part] }}
                      />
                    </div>
                    <span className="font-numeric w-10 shrink-0 text-right font-semibold">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail table */}
      <Card className="glass-card border-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-border/60 py-3">
          <div>
            <CardTitle className="flex items-center gap-2 font-display text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <ListTree className="h-3.5 w-3.5" />
              </div>
              업무별 M/D 상세
            </CardTitle>
            <p className="mt-0.5 pl-9 text-xs text-muted-foreground">
              {selectedYear}년 · {selectedProjectLabel} · {detailViewLabel}
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {detailView === "flat" ? (
            displayedFlatTasks.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {selectedYear}년에 표시할 업무가 없습니다
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 hover:bg-muted/10">
                    <TableHead className="w-20">코드</TableHead>
                    <TableHead className="w-24">담당</TableHead>
                    <TableHead className="w-20">파트</TableHead>
                    <TableHead className="w-24">구분</TableHead>
                    <TableHead>업무내용</TableHead>
                    <TableHead className="w-20 text-right">M/D</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{displayedFlatTasks.map(renderTaskRow)}</TableBody>
              </Table>
            )
          ) : displayedGroups.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {selectedYear}년에 표시할 업무가 없습니다
              {yearProjects.length > 0 && (
                <span className="mt-1 block text-xs">
                  해당 연도 프로젝트 {yearProjects.length}개 · M/D 실적 없음
                </span>
              )}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {displayedGroups.map(({ project, tasks, totalMd, byPart }) => (
                <div key={project?.id ?? "unknown"}>
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/25 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-mono text-xs font-bold text-primary">
                          {project?.code}
                        </p>
                        <p className="text-sm font-medium leading-tight">{project?.name}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {byPart
                        .filter(({ md }) => md > 0)
                        .map(({ part, md }) => {
                          const Icon = PART_ICONS[part as keyof typeof PART_ICONS];
                          return (
                            <Badge key={part} variant="outline" className="gap-1 text-[11px]">
                              <Icon className="h-3 w-3" style={{ color: PART_COLORS[part] }} />
                              {part} {md.toFixed(2)}M
                            </Badge>
                          );
                        })}
                      <Badge variant="secondary" className="font-numeric text-xs">
                        소계 {totalMd.toFixed(2)} M/D
                      </Badge>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/10 hover:bg-muted/10">
                        <TableHead className="w-24">담당</TableHead>
                        <TableHead className="w-20">파트</TableHead>
                        <TableHead className="w-24">구분</TableHead>
                        <TableHead>업무내용</TableHead>
                        <TableHead className="w-20 text-right">M/D</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{tasks.map(renderTaskRow)}</TableBody>
                    <TableFooter>
                      <TableRow className="bg-muted/15 hover:bg-muted/15">
                        <TableCell colSpan={4} className="text-right text-xs font-medium">
                          {project?.code} 소계
                        </TableCell>
                        <TableCell className="text-right font-numeric text-sm font-bold text-primary">
                          {totalMd.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              ))}
            </div>
          )}

          {(projectGroups.length > 0 || flatTasks.length > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-primary/15 bg-primary/[0.03] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  합계 ({detailViewLabel})
                </span>
                <span className="font-numeric text-lg font-bold text-primary">
                  {detailTotal.toFixed(2)} M/D
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">보기</span>
                <Select
                  value={detailView}
                  onValueChange={(v) => setDetailView(v as DetailView)}
                >
                  <SelectTrigger className="h-8 w-52 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="grouped">
                      <span className="flex items-center gap-2">
                        <ListTree className="h-3.5 w-3.5" />
                        전체 · 프로젝트별 묶음
                      </span>
                    </SelectItem>
                    <SelectItem value="flat">
                      <span className="flex items-center gap-2">
                        <List className="h-3.5 w-3.5" />
                        전체 · 통합 목록
                      </span>
                    </SelectItem>
                    {projectGroups.length > 0 && (
                      <>
                        <div className="my-1 border-t border-border" />
                        {projectGroups.map(({ project }) =>
                          project ? (
                            <SelectItem key={project.id} value={project.id}>
                              <span className="flex items-center gap-2">
                                <FolderKanban className="h-3.5 w-3.5 text-primary" />
                                <span className="font-numeric">{project.code}</span>
                                <span className="text-muted-foreground truncate">
                                  · {project.name}
                                </span>
                              </span>
                            </SelectItem>
                          ) : null
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
