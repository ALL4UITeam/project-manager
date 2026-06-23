"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useApp } from "@/context/app-context";
import { WORK_PARTS, TASK_TYPE_LABELS, type TaskType } from "@/types";
import { GlobalProjectFilter } from "@/components/shared/global-project-filter";
import { PageHeader } from "@/components/shared/page-header";
import {
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  기획: "oklch(0.75 0.15 75)",
  디자인: "oklch(0.65 0.18 350)",
  퍼블리싱: "oklch(0.65 0.12 200)",
};

export function MDDashboard() {
  const {
    filteredWeeklyTasks,
    filteredProjects,
    getProjectById,
    getUserById,
    projectFilter,
  } = useApp();

  const thisWeekTasks = filteredWeeklyTasks.filter(
    (t) => t.taskType === "THIS_WEEK"
  );

  const chartData = useMemo(() => {
    const projects =
      projectFilter === "all"
        ? filteredProjects
        : filteredProjects.filter((p) => p.id === projectFilter);

    return projects.map((project) => {
      const tasks = thisWeekTasks.filter((t) => t.projectId === project.id);
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
    });
  }, [filteredProjects, thisWeekTasks, projectFilter]);

  const totalMD = thisWeekTasks.reduce((s, t) => s + t.md, 0);

  const partSummary = WORK_PARTS.map((part) => ({
    part,
    md: thisWeekTasks
      .filter((t) => t.part === part)
      .reduce((s, t) => s + t.md, 0),
  }));

  const projectGroups = useMemo(() => {
    const projectIds = [
      ...new Set(thisWeekTasks.map((t) => t.projectId)),
    ].sort((a, b) => {
      const codeA = getProjectById(a)?.code ?? a;
      const codeB = getProjectById(b)?.code ?? b;
      return codeA.localeCompare(codeB);
    });

    return projectIds.map((projectId) => {
      const project = getProjectById(projectId);
      const tasks = [...thisWeekTasks.filter((t) => t.projectId === projectId)].sort(
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
  }, [thisWeekTasks, getProjectById, getUserById]);

  const selectedProjectLabel =
    projectFilter === "all"
      ? "전체 프로젝트"
      : getProjectById(projectFilter)?.code ?? "프로젝트";

  return (
    <div className="page-stack">
      <PageHeader
        icon={BarChart3}
        iconClassName="bg-amber-500/10 text-amber-600 ring-amber-500/15"
        title="M/D 공수 현황"
        description="프로젝트·파트별 Man-Day 투입 현황 (이번주 실적 기준)"
      >
        <GlobalProjectFilter />
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card border-0">
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              총 M/D ({selectedProjectLabel})
            </p>
            <p className="stat-value mt-1">{totalMD.toFixed(2)}</p>
          </CardContent>
        </Card>
        {partSummary.map(({ part, md }) => (
          <Card key={part} className="glass-card border-0">
            <CardContent className="pt-6">
              <p className="text-xs font-medium text-muted-foreground">{part}</p>
              <p className="font-numeric mt-1 text-2xl font-semibold tracking-tight">
                {md.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-base">프로젝트별 파트 M/D</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullName ?? ""
                  }
                />
                <Legend />
                {WORK_PARTS.map((part) => (
                  <Bar
                    key={part}
                    dataKey={part}
                    stackId="a"
                    fill={PART_COLORS[part]}
                    radius={part === "퍼블리싱" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-base">파트별 M/D 비율</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {partSummary.map(({ part, md }) => {
              const pct = totalMD > 0 ? (md / totalMD) * 100 : 0;
              return (
                <div key={part}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{part}</span>
                    <span className="font-mono font-semibold">{md.toFixed(2)} M/D</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: PART_COLORS[part],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-border/60 pb-4">
          <div>
            <CardTitle className="font-display text-base">업무별 M/D 상세</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedProjectLabel} · 프로젝트별 묶음 · 이번주 실적
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {projectGroups.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              표시할 업무가 없습니다
            </p>
          ) : (
            <div className="divide-y divide-border">
              {projectGroups.map(({ project, tasks, totalMd, byPart }) => (
                <div key={project?.id ?? "unknown"}>
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 px-4 py-3">
                    <div>
                      <p className="font-mono text-sm font-bold text-primary">
                        {project?.code}
                      </p>
                      <p className="text-sm font-medium">{project?.name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {byPart
                        .filter(({ md }) => md > 0)
                        .map(({ part, md }) => (
                          <Badge key={part} variant="outline" className="text-xs">
                            {part} {md.toFixed(2)}M
                          </Badge>
                        ))}
                      <Badge variant="secondary" className="font-mono text-sm">
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
                    <TableBody>
                      {tasks.map((task) => {
                        const user = getUserById(task.userId);
                        return (
                          <TableRow key={task.id}>
                            <TableCell className="text-sm">{user?.name}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className="text-xs"
                                style={{ borderColor: PART_COLORS[task.part] }}
                              >
                                {task.part}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {TASK_TYPE_LABELS[task.taskType as TaskType]}
                            </TableCell>
                            <TableCell className="text-sm">{task.content}</TableCell>
                            <TableCell className="text-right font-mono font-semibold text-primary">
                              {task.md}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={4} className="text-right text-sm font-medium">
                          {project?.code} 소계
                        </TableCell>
                        <TableCell className="text-right font-mono text-base font-bold text-primary">
                          {totalMd.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              ))}
            </div>
          )}
          {projectGroups.length > 0 && (
            <div className="flex items-center justify-between border-t border-primary/20 bg-primary/5 px-4 py-4">
              <span className="text-sm font-semibold">
                전체 합계 ({selectedProjectLabel})
              </span>
              <span className="font-mono text-xl font-bold text-primary">
                {totalMD.toFixed(2)} M/D
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
