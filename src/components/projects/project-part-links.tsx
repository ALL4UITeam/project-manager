"use client";

import { useState } from "react";
import { ExternalLink, Link2, Plus, Trash2, X } from "lucide-react";
import type { WorkPart } from "@/types";
import { useApp } from "@/context/app-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function ResourceLinkForm({
  projectId,
  part,
  onDone,
}: {
  projectId: string;
  part: WorkPart;
  onDone: () => void;
}) {
  const { addProjectResourceLink } = useApp();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return;
    addProjectResourceLink({
      projectId,
      part,
      label: label.trim(),
      url: normalizeUrl(url),
    });
    setLabel("");
    setUrl("");
    onDone();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 space-y-2 rounded-lg border border-dashed border-border bg-muted/30 p-3"
    >
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="이름 (예: 시안 1, IA 문서)"
        className="h-8 text-xs"
        autoFocus
      />
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="링크 URL"
        className="h-8 text-xs"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!label.trim() || !url.trim()}>
          <Plus className="mr-1 h-3 w-3" />
          추가
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          <X className="mr-1 h-3 w-3" />
          취소
        </Button>
      </div>
    </form>
  );
}

export function ProjectPartLinks({
  projectId,
  part,
}: {
  projectId: string;
  part: WorkPart;
}) {
  const {
    getResourceLinksByProject,
    deleteProjectResourceLink,
    canEditPartLinks,
  } = useApp();
  const [adding, setAdding] = useState(false);

  const links = getResourceLinksByProject(projectId).filter((l) => l.part === part);
  const canEdit = canEditPartLinks(part);

  return (
    <div className="mt-4 border-t border-border/60 pt-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Link2 className="h-3.5 w-3.5" />
          산출물 링크
        </p>
        {canEdit && !adding && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={() => setAdding(true)}
          >
            <Plus className="mr-0.5 h-3 w-3" />
            추가
          </Button>
        )}
      </div>

      {links.length > 0 ? (
        <ul className="space-y-1.5">
          {links.map((link) => (
            <li
              key={link.id}
              className="group flex items-center gap-2 rounded-md border border-border/50 bg-background/80 px-2.5 py-2"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="truncate">{link.label}</span>
              </a>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => deleteProjectResourceLink(link.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !adding && (
          <p className="text-xs text-muted-foreground">등록된 링크 없음</p>
        )
      )}

      {adding && (
        <ResourceLinkForm
          projectId={projectId}
          part={part}
          onDone={() => setAdding(false)}
        />
      )}
    </div>
  );
}
