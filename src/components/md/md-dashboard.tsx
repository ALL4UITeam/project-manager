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
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">M/D 공수 현황</h1>
          <p className="text-sm text-muted-foreground">
            프로젝트·파트별 Man-Day 투입 현황 (이번주 실적 기준)
          </p>
        </div>
        <GlobalProjectFilter />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">총 M/D</p>
            <p className="text-3xl font-bold text-primary">{totalMD.toFixed(2)}</p>
          </CardContent>
        </Card>
        {partSummary.map(({ part, md }) => (
          <Card key={part}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{part}</p>
              <p className="text-2xl font-bold">{md.toFixed(2)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
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

        <Card>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">업무별 M/D 상세</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>프로젝트</TableHead>
                <TableHead>담당</TableHead>
                <TableHead>파트</TableHead>
                <TableHead>구분</TableHead>
                <TableHead>업무내용</TableHead>
                <TableHead className="text-right">M/D</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWeeklyTasks.map((task) => {
                const project = getProjectById(task.projectId);
                const user = getUserById(task.userId);
                return (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {project?.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{user?.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs")}
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
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
