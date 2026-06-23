"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { useApp } from "@/context/app-context";
import type { ProjectIssue } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function IssueRegisterForm({
  defaultProjectId,
  compact = false,
}: {
  defaultProjectId?: string;
  compact?: boolean;
}) {
  const { projects, addProjectIssue, canAddIssue } = useApp();
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [date, setDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [content, setContent] = useState("");

  if (!canAddIssue()) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pid = defaultProjectId ?? projectId;
    if (!pid || !content.trim()) return;
    addProjectIssue({ projectId: pid, date, content: content.trim() });
    setContent("");
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
          <div className="space-y-2">
            <Label>발생일</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
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

export function IssueList({
  issues,
  showProject = false,
  emptyMessage = "등록된 이슈가 없습니다",
}: {
  issues: ProjectIssue[];
  showProject?: boolean;
  emptyMessage?: string;
}) {
  const { getUserById, getProjectById } = useApp();

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
        return (
          <li
            key={issue.id}
            className="rounded-lg border border-orange-100 bg-orange-50/80 px-4 py-3"
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-orange-800">
                {format(parseISO(issue.date), "yyyy.MM.dd (EEE)", {
                  locale: ko,
                })}
              </span>
              {author && <span>· {author.name}</span>}
              {showProject && project && (
                <span className="font-mono text-primary">{project.code}</span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-orange-950">
              {issue.content}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
