"use client";

import { useMemo } from "react";
import {
  ArrowLeft,
  AlertCircle,
  Users,
  Calendar,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/context/app-context";
import type { Project } from "@/types";
import { WORK_PARTS, PART_LABELS, TASK_TYPE_LABELS } from "@/types";
import { ProjectStatusBadge } from "@/components/shared/project-status-badge";
import {
  IssueList,
} from "@/components/issues/issue-components";
import { RemarkList } from "@/components/issues/remark-components";
import { ProjectPartLinks } from "@/components/projects/project-part-links";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
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

const PART_ACCENT: Record<string, string> = {
  기획: "border-amber-200 bg-amber-50/50",
  디자인: "border-pink-200 bg-pink-50/50",
  퍼블리싱: "border-cyan-200 bg-cyan-50/50",
};

export function ProjectDetailView({
  project,
  onBack,
}: {
  project: Project;
  onBack: () => void;
}) {
  const {
    weeklyTasks,
    meetingNotes,
    getUserById,
    getIssuesByProject,
    getRemarksByProject,
  } = useApp();

  const projectIssues = getIssuesByProject(project.id);
  const projectRemarks = getRemarksByProject(project.id);

  const projectTasks = useMemo(
    () => weeklyTasks.filter((t) => t.projectId === project.id),
    [weeklyTasks, project.id]
  );

  const totalMD = projectTasks.reduce((s, t) => s + t.md, 0);
  const projectMeetings = meetingNotes.filter(
    (n) => n.projectId === project.id
  );

  const partMembers = useMemo(() => {
    return WORK_PARTS.map((part) => {
      const partTasks = projectTasks.filter((t) => t.part === part);
      const userIds = [...new Set(partTasks.map((t) => t.userId))];

      const members = userIds.map((userId) => {
        const user = getUserById(userId);
        const userTasks = partTasks.filter((t) => t.userId === userId);
        const md = userTasks.reduce((s, t) => s + t.md, 0);
        const thisWeek = userTasks
          .filter((t) => t.taskType === "THIS_WEEK")
          .reduce((s, t) => s + t.md, 0);
        const nextWeek = userTasks
          .filter((t) => t.taskType === "NEXT_WEEK")
          .reduce((s, t) => s + t.md, 0);

        return { user, md, thisWeek, nextWeek, taskCount: userTasks.length };
      });

      const partMD = partTasks.reduce((s, t) => s + t.md, 0);
      return { part, members, partMD, taskCount: partTasks.length };
    });
  }, [projectTasks, getUserById]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
        <ArrowLeft className="mr-1 h-4 w-4" />
        프로젝트 현황 목록
      </Button>

      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm font-bold text-primary">
              {project.code}
            </p>
            <h2 className="mt-1 text-2xl font-bold">{project.name}</h2>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>PM {project.pmName}</span>
              <span>담당 정 {project.assigneePrimary || "—"}</span>
              {project.assigneeSecondary && (
                <span>부 {project.assigneeSecondary}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {project.startDate} ~ {project.endDate}
              </span>
            </div>
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3 border-t border-primary/10 pt-4">
          <Badge variant="secondary">누적 M/D {totalMD.toFixed(2)}</Badge>
          <Badge variant="outline">
            투입 파트 {partMembers.filter((p) => p.members.length > 0).length}
          </Badge>
          <Badge variant="outline">이슈 {projectIssues.length}건</Badge>
          <Badge variant="outline">비고 {projectRemarks.length}건</Badge>
          <Badge variant="outline">회의록 {projectMeetings.length}건</Badge>
        </div>
      </div>

      <Card className={projectIssues.length > 0 ? "border-orange-200" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle
              className={cn(
                "h-5 w-5",
                projectIssues.length > 0
                  ? "text-orange-500"
                  : "text-muted-foreground"
              )}
            />
            이슈 이력 (전체 {projectIssues.length}건)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            주간 등록은 주간 업무 보고 → 이번주 이슈사항에서 작성하세요
          </p>
        </CardHeader>
        <CardContent>
          <IssueList issues={projectIssues} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">비고 이력 (전체 {projectRemarks.length}건)</CardTitle>
          <p className="text-xs text-muted-foreground">
            일정·참고사항 등 (이슈와 별도). 주간 등록은 주간 업무 보고에서
            작성하세요.
          </p>
        </CardHeader>
        <CardContent>
          <RemarkList remarks={projectRemarks} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-5 w-5 text-primary" />
          파트별 투입 멤버
        </h3>
        <div className="grid gap-4 lg:grid-cols-3">
          {partMembers.map(({ part, members, partMD, taskCount }) => (
            <Card
              key={part}
              className={cn("border", PART_ACCENT[part] ?? "border-border")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>[{part}]</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    M/D {partMD.toFixed(2)}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  업무 {taskCount}건 · {members.length}명 투입
                </p>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="py-2 text-center text-sm text-muted-foreground">
                    투입 이력 없음
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {members.map(({ user, md, thisWeek, nextWeek, taskCount: tc }) => (
                      <li
                        key={user!.id}
                        className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {user!.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{user!.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {PART_LABELS[user!.part]} · {tc}건
                          </p>
                          <div className="mt-1 flex gap-2 text-[10px] text-muted-foreground">
                            <span>실적 {thisWeek.toFixed(2)}M</span>
                            <span>·</span>
                            <span>계획 {nextWeek.toFixed(2)}M</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-lg font-bold text-primary">
                            {md.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">M/D</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <ProjectPartLinks projectId={project.id} part={part} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {projectTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">투입 업무 내역</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>파트</TableHead>
                  <TableHead>담당</TableHead>
                  <TableHead>주차</TableHead>
                  <TableHead>업무내용</TableHead>
                  <TableHead className="text-right">M/D</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectTasks.map((task) => {
                  const user = getUserById(task.userId);
                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {task.part}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {user?.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {TASK_TYPE_LABELS[task.taskType]}
                      </TableCell>
                      <TableCell className="max-w-md text-sm leading-relaxed">
                        {task.content}
                      </TableCell>
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
      )}

      {projectMeetings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              관련 회의록
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {projectMeetings.map((note) => (
              <Link
                key={note.id}
                href="/meetings"
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted/40"
              >
                <span className="font-medium">{note.title}</span>
                <span className="text-xs text-muted-foreground">{note.date}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
