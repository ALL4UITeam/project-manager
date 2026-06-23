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
import { YearFilterSelect } from "@/components/shared/year-filter-select";
import { ProjectSearchInput } from "@/components/shared/project-search-input";
import { PageHeader } from "@/components/shared/page-header";
import { MeetingNoteEditorDialog } from "@/components/meetings/meeting-note-editor-dialog";
import {
  MeetingNoteDetail,
  MeetingNoteListItem,
} from "@/components/meetings/meeting-note-detail";
import {
  getAvailableYears,
  filterProjectsByYear,
  getDefaultSelectedYear,
  dateInYear,
  filterProjectsBySearch,
} from "@/lib/project-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function getMeetingYears(notes: MeetingNote[]): number[] {
  const years = new Set<number>();
  for (const n of notes) {
    years.add(parseInt(n.date.slice(0, 4), 10));
  }
  return [...years].sort((a, b) => b - a);
}

function ProjectNoteList({
  project,
  notes,
  selectedYear,
  onBack,
}: {
  project: Project;
  notes: MeetingNote[];
  selectedYear: number;
  onBack: () => void;
}) {
  const { canEditMeetingNote } = useApp();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<MeetingNote | undefined>();

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
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
        <ArrowLeft className="mr-1 h-4 w-4" />
        {selectedYear}년 프로젝트 목록
      </Button>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm font-semibold text-primary">
              {project.code}
            </p>
            <h2 className="mt-1 text-xl font-bold">{project.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PM {project.pmName} · {selectedYear}년 회의록 {notes.length}건
            </p>
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <FolderOpen className="h-4 w-4" />
            {selectedYear}년 회의록 ({notes.length}건)
          </CardTitle>
          {canEditMeetingNote() && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              회의록 작성
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          {sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {selectedYear}년에 등록된 회의록이 없습니다
              {canEditMeetingNote() && (
                <span className="mt-4 block">
                  <Button size="sm" variant="outline" onClick={openCreate}>
                    첫 회의록 작성하기
                  </Button>
                </span>
              )}
            </p>
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
        </CardContent>
      </Card>

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

export function MeetingNotesView() {
  const { meetingNotes, projects } = useApp();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  const availableYears = useMemo(() => {
    const fromProjects = getAvailableYears(projects);
    const fromNotes = getMeetingYears(meetingNotes);
    const merged = new Set([...fromProjects, ...fromNotes]);
    return [...merged].sort((a, b) => b - a);
  }, [projects, meetingNotes]);

  const [selectedYear, setSelectedYear] = useState(() =>
    getDefaultSelectedYear(
      [...new Set([...getAvailableYears(projects), ...getMeetingYears(meetingNotes)])].sort(
        (a, b) => b - a
      )
    )
  );

  const yearProjects = useMemo(
    () => filterProjectsByYear(projects, selectedYear),
    [projects, selectedYear]
  );

  const displayProjects = useMemo(
    () => filterProjectsBySearch(yearProjects, searchQuery),
    [yearProjects, searchQuery]
  );

  const yearNotes = useMemo(
    () => meetingNotes.filter((n) => dateInYear(n.date, selectedYear)),
    [meetingNotes, selectedYear]
  );

  const noteCountByProject = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const note of yearNotes) {
      counts[note.projectId] = (counts[note.projectId] ?? 0) + 1;
    }
    return counts;
  }, [yearNotes]);

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId) ?? null
    : null;

  const selectedNotes = selectedProjectId
    ? yearNotes.filter((n) => n.projectId === selectedProjectId)
    : [];

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setSelectedProjectId(null);
    setSearchQuery("");
  };

  return (
    <div className="page-stack">
      <PageHeader
        icon={FileText}
        iconClassName="bg-rose-500/10 text-rose-600 ring-rose-500/15"
        title={`회의록 (${selectedYear})`}
        description={`${selectedYear}년 프로젝트별 회의록 · 외부 공유는 링크로 제공`}
      >
        <YearFilterSelect
          years={availableYears}
          value={selectedYear}
          onChange={handleYearChange}
        />
        <ProjectSearchInput value={searchQuery} onChange={setSearchQuery} />
      </PageHeader>

      {selectedProject ? (
        <ProjectNoteList
          project={selectedProject}
          notes={selectedNotes}
          selectedYear={selectedYear}
          onBack={() => setSelectedProjectId(null)}
        />
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              {selectedYear}년 프로젝트 ({displayProjects.length}건
              {searchQuery.trim() && yearProjects.length !== displayProjects.length
                ? ` · 전체 ${yearProjects.length}건`
                : ""}
              )
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {yearProjects.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                해당 연도에 진행/완료된 프로젝트가 없습니다
              </p>
            ) : displayProjects.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                「{searchQuery}」 검색 결과가 없습니다
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-24 font-semibold">코드</TableHead>
                      <TableHead className="min-w-[240px] font-semibold">
                        프로젝트명
                      </TableHead>
                      <TableHead className="w-24 font-semibold">PM</TableHead>
                      <TableHead className="w-28 font-semibold">기간</TableHead>
                      <TableHead className="w-20 font-semibold">상태</TableHead>
                      <TableHead className="w-24 font-semibold">회의록</TableHead>
                      <TableHead className="w-8" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayProjects.map((project) => {
                      const count = noteCountByProject[project.id] ?? 0;
                      return (
                        <TableRow
                          key={project.id}
                          className="cursor-pointer transition-colors hover:bg-primary/5"
                          onClick={() => setSelectedProjectId(project.id)}
                        >
                          <TableCell className="font-mono text-xs font-semibold text-primary">
                            {project.code}
                          </TableCell>
                          <TableCell className="font-medium">
                            {project.name}
                          </TableCell>
                          <TableCell className="text-sm">
                            {project.pmName}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {project.startDate}
                            <br />~ {project.endDate}
                          </TableCell>
                          <TableCell>
                            <ProjectStatusBadge status={project.status} />
                          </TableCell>
                          <TableCell>
                            {count > 0 ? (
                              <Badge variant="secondary" className="gap-1">
                                <FileText className="h-3 w-3" />
                                {count}건
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
