"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  ChevronRight,
  ArrowLeft,
  FolderOpen,
  Plus,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import type { Project, MeetingNote } from "@/types";
import { ProjectStatusBadge } from "@/components/shared/project-status-badge";
import { MeetingNoteEditorDialog } from "@/components/meetings/meeting-note-editor-dialog";
import {
  MeetingNoteDetail,
  MeetingNoteListItem,
} from "@/components/meetings/meeting-note-detail";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

function ProjectNoteList({
  project,
  notes,
  onBack,
}: {
  project: Project;
  notes: MeetingNote[];
  onBack: () => void;
}) {
  const { getIssuesByProject, canEditMeetingNote } = useApp();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<MeetingNote | undefined>();

  const projectIssues = getIssuesByProject(project.id).slice(0, 5);

  const sorted = [...notes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const selectedNote = selectedNoteId
    ? notes.find((n) => n.id === selectedNoteId)
    : null;

  const openCreate = () => {
    setEditingNote(undefined);
    setEditorOpen(true);
  };

  const openEdit = (note: MeetingNote) => {
    setEditingNote(note);
    setEditorOpen(true);
  };

  if (selectedNote) {
    return (
      <>
        <MeetingNoteDetail
          note={selectedNote}
          project={project}
          onBack={() => setSelectedNoteId(null)}
          onEdit={() => openEdit(selectedNote)}
        />
        <MeetingNoteEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          project={project}
          note={editingNote}
          onSaved={() => setEditorOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ArrowLeft className="mr-1 h-4 w-4" />
          프로젝트 목록
        </Button>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm font-semibold text-primary">
              {project.code}
            </p>
            <h2 className="mt-1 text-xl font-bold">{project.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PM {project.pmName} · 회의록 {notes.length}건
            </p>
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>
        {projectIssues.length > 0 && (
          <ul className="mt-4 space-y-1 border-t border-primary/10 pt-4">
            {projectIssues.map((issue) => (
              <li key={issue.id} className="text-sm text-orange-800">
                · [{issue.date}] {issue.content}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <FolderOpen className="h-4 w-4" />
            회의록 모음
          </h3>
          {canEditMeetingNote() && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              회의록 작성
            </Button>
          )}
        </div>
        {sorted.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              이 프로젝트에 등록된 회의록이 없습니다
              {canEditMeetingNote() && (
                <div className="mt-4">
                  <Button size="sm" variant="outline" onClick={openCreate}>
                    첫 회의록 작성하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sorted.map((note) => (
              <MeetingNoteListItem
                key={note.id}
                note={note}
                onClick={() => setSelectedNoteId(note.id)}
              />
            ))}
          </div>
        )}
      </div>

      <MeetingNoteEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        project={project}
        note={editingNote}
        onSaved={(saved) => {
          if (!editingNote) setSelectedNoteId(saved.id);
        }}
      />
    </div>
  );
}

function ProjectPicker({
  projects,
  noteCountByProject,
  onSelect,
}: {
  projects: Project[];
  noteCountByProject: Record<string, number>;
  onSelect: (projectId: string) => void;
}) {
  const withNotes = projects.filter(
    (p) => (noteCountByProject[p.id] ?? 0) > 0
  );
  const withoutNotes = projects.filter(
    (p) => (noteCountByProject[p.id] ?? 0) === 0
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {withNotes.map((project) => {
          const count = noteCountByProject[project.id] ?? 0;
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelect(project.id)}
              className={cn(
                "group rounded-xl border border-border bg-card p-4 text-left transition-all",
                "hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-semibold text-primary">
                    {project.code}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
                    {project.name}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    PM {project.pmName}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <ProjectStatusBadge status={project.status} />
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {count}건
                </Badge>
              </div>
            </button>
          );
        })}
      </div>

      {withoutNotes.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            회의록 없음
          </p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {withoutNotes.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => onSelect(project.id)}
                className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-left opacity-80 transition-opacity hover:opacity-100"
              >
                <p className="font-mono text-xs text-muted-foreground">
                  {project.code}
                </p>
                <p className="mt-0.5 line-clamp-1 text-sm">{project.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MeetingNotesView() {
  const { meetingNotes, projects } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  const noteCountByProject = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const note of meetingNotes) {
      counts[note.projectId] = (counts[note.projectId] ?? 0) + 1;
    }
    return counts;
  }, [meetingNotes]);

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  const selectedNotes = selectedProjectId
    ? meetingNotes.filter((n) => n.projectId === selectedProjectId)
    : [];

  if (selectedProject) {
    return (
      <div className="space-y-2">
        <ProjectNoteList
          project={selectedProject}
          notes={selectedNotes}
          onBack={() => setSelectedProjectId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">회의록</h1>
        <p className="text-sm text-muted-foreground">
          프로젝트를 선택해 회의록을 작성·조회하세요. 외부 공유는 계정 없이{" "}
          <strong className="font-medium text-foreground">링크</strong>로
          제공합니다.
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              표시할 프로젝트가 없습니다
            </p>
          </CardContent>
        </Card>
      ) : (
        <ProjectPicker
          projects={projects}
          noteCountByProject={noteCountByProject}
          onSelect={setSelectedProjectId}
        />
      )}
    </div>
  );
}
