"use client";

import { FolderKanban } from "lucide-react";
import { useApp } from "@/context/app-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function GlobalProjectFilter() {
  const { projects, projectFilter, setProjectFilter } = useApp();

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 px-2.5 py-1 shadow-sm backdrop-blur-sm">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <FolderKanban className="h-3.5 w-3.5" strokeWidth={2.25} />
      </div>
      <Select value={projectFilter} onValueChange={setProjectFilter}>
        <SelectTrigger className="h-8 w-52 border-0 bg-transparent shadow-none">
          <SelectValue placeholder="프로젝트 필터" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 프로젝트</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className="font-numeric">{p.code}</span>
              <span className="text-muted-foreground"> · {p.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
