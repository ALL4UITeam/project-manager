"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import type { Project } from "@/types";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProjectPmCell({ project }: { project: Project }) {
  return (
    <span className="text-sm whitespace-nowrap">{project.pmName}</span>
  );
}

export function ProjectAssigneeCell({ project }: { project: Project }) {
  const { updateProject, canEditAssignee } = useApp();
  const [editing, setEditing] = useState(false);
  const [primary, setPrimary] = useState(project.assigneePrimary);
  const [secondary, setSecondary] = useState(project.assigneeSecondary ?? "");

  const startEdit = () => {
    setPrimary(project.assigneePrimary);
    setSecondary(project.assigneeSecondary ?? "");
    setEditing(true);
  };

  const save = () => {
    updateProject(project.id, {
      assigneePrimary: primary.trim(),
      assigneeSecondary: secondary.trim() || undefined,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div
        className="min-w-[100px] space-y-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          placeholder="담당 정"
          className="h-7 text-xs"
        />
        <Input
          value={secondary}
          onChange={(e) => setSecondary(e.target.value)}
          placeholder="담당 부 (선택)"
          className="h-7 text-xs"
        />
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 px-2" onClick={save}>
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2"
            onClick={() => setEditing(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-[90px] space-y-0.5 text-sm">
      <p className="text-xs">
        <span className="text-muted-foreground">정: </span>
        {project.assigneePrimary || "—"}
      </p>
      {project.assigneeSecondary && (
        <p className="text-xs">
          <span className="text-muted-foreground">부: </span>
          {project.assigneeSecondary}
        </p>
      )}
      {canEditAssignee() && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1 text-[10px] text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            startEdit();
          }}
        >
          <Pencil className="mr-0.5 h-3 w-3" />
          수정
        </Button>
      )}
    </div>
  );
}
