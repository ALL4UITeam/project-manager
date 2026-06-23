"use client";

import { Filter } from "lucide-react";
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
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select value={projectFilter} onValueChange={setProjectFilter}>
        <SelectTrigger className="h-8 w-56">
          <SelectValue placeholder="프로젝트 필터" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 프로젝트</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.code} · {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
