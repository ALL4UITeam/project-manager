"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Pencil, Trash2, ChevronRight, FolderKanban, ArrowUpDown } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  FormDialogHeader,
  FormDialogSection,
  FormField,
  formInputClassName,
} from "@/components/shared/form-dialog";
import { useApp } from "@/context/app-context";
import type { Project, ProjectStatus } from "@/types";
import { PROJECT_STATUS_LABELS, ALLOCATED_MD_PARTS, DEFAULT_ALLOCATED_MD } from "@/types";
import { sumAllocatedMd } from "@/lib/project-md-utils";
import {
  ProjectStatusBadge,
  StatusLegend,
} from "@/components/shared/project-status-badge";
import { GlobalProjectFilter } from "@/components/shared/global-project-filter";
import { ProjectDetailView } from "@/components/projects/project-detail-view";
import {
  getAvailableYears,
  filterProjectsByYear,
  getDefaultSelectedYear,
  filterProjectsBySearch,
  sortProjects,
  filterProjectsByStatus,
  type ProjectSortKey,
  type ProjectSortDir,
  type ProjectStatusFilter,
} from "@/lib/project-utils";
import { YearFilterSelect } from "@/components/shared/year-filter-select";
import { ProjectSearchInput } from "@/components/shared/project-search-input";
import { IssueSearchInput } from "@/components/shared/issue-search-input";
import { IssueList } from "@/components/issues/issue-components";
import { filterIssuesBySearch } from "@/lib/issue-utils";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProjectForm = Omit<Project, "id">;

const emptyForm: ProjectForm = {
  code: "",
  name: "",
  pmName: "",
  startDate: "",
  endDate: "",
  status: "진행",
  assigneePrimary: "",
  assigneeSecondary: "",
  isSupportProject: false,
  allocatedMd: { ...DEFAULT_ALLOCATED_MD },
};

function ProjectFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  title,
  canEditAssignee,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: ProjectForm;
  onSave: (data: ProjectForm) => Promise<void>;
  title: string;
  canEditAssignee: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(initial);
      setSaveError(null);
    }
  }, [open, initial]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(form);
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      setSaveError(message);
      window.alert(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <FormDialogHeader
          icon={FolderKanban}
          accent="sky"
          title={title}
          description="프로젝트 기본 정보와 일정을 입력하세요."
        />
        <DialogBody className="space-y-4">
          <FormDialogSection title="기본 정보">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="코드" required hint="예: AF_P06">
                <Input
                  className={formInputClassName("font-numeric")}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="AF_P06"
                />
              </FormField>
              <FormField label="상태" required>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as ProjectStatus })
                  }
                >
                  <SelectTrigger className={formInputClassName()}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map(
                      (s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="프로젝트명" required>
              <Input
                className={formInputClassName()}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="프로젝트 이름"
              />
            </FormField>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/15 px-3 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="is-support-project" className="text-sm font-medium">
                  프로젝트 지원 및 전사
                </Label>
                <p className="text-xs text-muted-foreground">
                  체크 시 주간 보고에서 실무 프로젝트와 분리하여 표시됩니다.
                </p>
              </div>
              <Switch
                id="is-support-project"
                checked={form.isSupportProject ?? false}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isSupportProject: checked })
                }
              />
            </div>
          </FormDialogSection>

          <FormDialogSection title="담당 · PM">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="PM">
                <Input
                  className={formInputClassName()}
                  value={form.pmName}
                  onChange={(e) => setForm({ ...form, pmName: e.target.value })}
                  placeholder="PM 이름"
                />
              </FormField>
              <FormField
                label="담당 정"
                hint={canEditAssignee ? undefined : "Master만 수정"}
              >
                <Input
                  className={formInputClassName()}
                  value={form.assigneePrimary}
                  onChange={(e) =>
                    setForm({ ...form, assigneePrimary: e.target.value })
                  }
                  disabled={!canEditAssignee}
                  placeholder={canEditAssignee ? "담당 정" : "Master만 수정"}
                />
              </FormField>
            </div>
            {canEditAssignee && (
              <FormField label="담당 부" hint="선택">
                <Input
                  className={formInputClassName()}
                  value={form.assigneeSecondary ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      assigneeSecondary: e.target.value || undefined,
                    })
                  }
                  placeholder="없으면 비워두세요"
                />
              </FormField>
            )}
          </FormDialogSection>

          <FormDialogSection title="일정">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="시작일">
                <Input
                  type="date"
                  className={formInputClassName()}
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </FormField>
              <FormField label="종료일">
                <Input
                  type="date"
                  className={formInputClassName()}
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </FormField>
            </div>
          </FormDialogSection>

          <FormDialogSection
            title="수주 M/D"
            description="파트별 계약(배정) 공수 · 기본값 0"
          >
            <div className="grid grid-cols-2 gap-4">
              {ALLOCATED_MD_PARTS.map((part) => (
                <FormField key={part} label={part} required>
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    className={formInputClassName("font-numeric")}
                    value={form.allocatedMd[part]}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setForm({
                        ...form,
                        allocatedMd: {
                          ...form.allocatedMd,
                          [part]: Number.isFinite(v) ? Math.max(0, v) : 0,
                        },
                      });
                    }}
                  />
                </FormField>
              ))}
            </div>
          </FormDialogSection>
        </DialogBody>
        {saveError && (
          <p className="px-6 pb-0 text-sm text-destructive">{saveError}</p>
        )}
        <DialogFooter>
          <Button variant="outline" className="min-w-24" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            className="min-w-24 shadow-sm shadow-primary/20"
            onClick={() => void handleSave()}
            disabled={!form.code || !form.name || saving}
          >
            {saving ? "저장 중…" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectStatusBoard() {
  const {
    projects,
    projectFilter,
    weeklyTasks,
    projectIssues,
    addProject,
    updateProject,
    deleteProject,
    canEditProject,
    canDeleteProject,
    canEditAssignee,
    getUserById,
    getProjectById,
  } = useApp();

  const availableYears = useMemo(() => getAvailableYears(projects), [projects]);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(() =>
    getDefaultSelectedYear(availableYears.length ? availableYears : [currentYear])
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [issueSearchQuery, setIssueSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<ProjectSortKey>("code");
  const [sortDir, setSortDir] = useState<ProjectSortDir>("asc");
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("all");

  const yearProjects = useMemo(() => {
    const byYear = filterProjectsByYear(projects, selectedYear);
    if (projectFilter === "all") return byYear;
    return byYear.filter((p) => p.id === projectFilter);
  }, [projects, selectedYear, projectFilter]);

  const displayProjects = useMemo(() => {
    const searched = filterProjectsBySearch(yearProjects, searchQuery);
    const byStatus = filterProjectsByStatus(searched, statusFilter);
    return sortProjects(byStatus, sortKey, sortDir);
  }, [yearProjects, searchQuery, statusFilter, sortKey, sortDir]);

  const activeCount = useMemo(
    () => filterProjectsByStatus(yearProjects, "active").length,
    [yearProjects]
  );
  const doneCount = useMemo(
    () => filterProjectsByStatus(yearProjects, "done").length,
    [yearProjects]
  );

  const yearProjectIds = useMemo(
    () => new Set(yearProjects.map((p) => p.id)),
    [yearProjects]
  );

  const yearIssues = useMemo(
    () =>
      projectIssues
        .filter((i) => yearProjectIds.has(i.projectId))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [projectIssues, yearProjectIds]
  );

  const filteredIssues = useMemo(
    () =>
      filterIssuesBySearch(yearIssues, issueSearchQuery, {
        getAuthorName: (userId) => getUserById(userId)?.name,
        getProjectLabel: (projectId) => {
          const p = getProjectById(projectId);
          return p ? `${p.code} ${p.name}` : undefined;
        },
      }),
    [yearIssues, issueSearchQuery, getUserById, getProjectById]
  );

  const selectedProject = selectedId
    ? projects.find((p) => p.id === selectedId) ?? null
    : null;

  const getIssueCount = (projectId: string) =>
    projectIssues.filter((i) => i.projectId === projectId).length;

  const getProjectStats = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    const tasks = weeklyTasks.filter(
      (t) => t.projectId === projectId && t.taskType === "THIS_WEEK"
    );
    const md = tasks.reduce((s, t) => s + t.md, 0);
    const memberCount = new Set(tasks.map((t) => t.userId)).size;
    const allocatedTotal = project
      ? sumAllocatedMd(project.allocatedMd)
      : 0;
    return { md, memberCount, taskCount: tasks.length, allocatedTotal };
  };

  const toggleSort = (key: ProjectSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  if (selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="page-stack">
      <PageHeader
        icon={FolderKanban}
        title={`프로젝트 현황 (${selectedYear})`}
        description="진행/완료 분리 · 정렬 · 클릭 시 파트별 투입 · 이슈 이력"
      >
        <YearFilterSelect
          years={availableYears}
          value={selectedYear}
          onChange={(y) => {
            setSelectedYear(y);
            setSearchQuery("");
            setIssueSearchQuery("");
          }}
        />
        <ProjectSearchInput value={searchQuery} onChange={setSearchQuery} />
        <IssueSearchInput value={issueSearchQuery} onChange={setIssueSearchQuery} />
        <GlobalProjectFilter />
        {canEditProject() && (
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            프로젝트 추가
          </Button>
        )}
      </PageHeader>

      <StatusLegend />

      {issueSearchQuery.trim() && (
        <Card className="border-orange-200/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              이슈 검색 결과 ({filteredIssues.length}건)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {selectedYear}년 프로젝트 · 「{issueSearchQuery}」
            </p>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto pt-0">
            <IssueList
              issues={filteredIssues}
              showProject
              emptyMessage={`「${issueSearchQuery}」 검색 결과가 없습니다`}
            />
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold">
              {selectedYear}년 프로젝트 ({displayProjects.length}건
              {searchQuery.trim() && yearProjects.length !== displayProjects.length
                ? ` · 전체 ${yearProjects.length}건`
                : ""}
              )
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-border p-0.5">
                {(
                  [
                    ["all", `전체 ${yearProjects.length}`],
                    ["active", `진행 ${activeCount}`],
                    ["done", `완료 ${doneCount}`],
                  ] as const
                ).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={statusFilter === value ? "secondary" : "ghost"}
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setStatusFilter(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Select
                value={`${sortKey}:${sortDir}`}
                onValueChange={(v) => {
                  const [k, d] = v.split(":") as [ProjectSortKey, ProjectSortDir];
                  setSortKey(k);
                  setSortDir(d);
                }}
              >
                <SelectTrigger className="h-8 w-[160px] text-xs">
                  <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code:asc">코드 오름차순</SelectItem>
                  <SelectItem value="code:desc">코드 내림차순</SelectItem>
                  <SelectItem value="name:asc">이름 오름차순</SelectItem>
                  <SelectItem value="name:desc">이름 내림차순</SelectItem>
                  <SelectItem value="status:asc">상태 순</SelectItem>
                  <SelectItem value="startDate:asc">시작일 오름차순</SelectItem>
                  <SelectItem value="startDate:desc">시작일 내림차순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {yearProjects.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              해당 연도에 진행/완료된 프로젝트가 없습니다
            </p>
          ) : displayProjects.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {searchQuery.trim()
                ? `「${searchQuery}」 검색 결과가 없습니다`
                : "선택한 상태의 프로젝트가 없습니다"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-24 font-semibold">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-primary"
                        onClick={() => toggleSort("code")}
                      >
                        코드
                        {sortKey === "code" && (
                          <span className="text-[10px]">
                            {sortDir === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="min-w-[240px] font-semibold">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-primary"
                        onClick={() => toggleSort("name")}
                      >
                        프로젝트명
                        {sortKey === "name" && (
                          <span className="text-[10px]">
                            {sortDir === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-24 font-semibold">PM</TableHead>
                    <TableHead className="w-28 font-semibold">담당</TableHead>
                    <TableHead className="w-28 font-semibold">기간</TableHead>
                    <TableHead className="w-20 font-semibold">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-primary"
                        onClick={() => toggleSort("status")}
                      >
                        상태
                        {sortKey === "status" && (
                          <span className="text-[10px]">
                            {sortDir === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </TableHead>
                    <TableHead className="w-28 font-semibold">
                      투입 / 수주
                    </TableHead>
                    <TableHead className="w-16 font-semibold">이슈</TableHead>
                    {(canEditProject() || canDeleteProject()) && (
                      <TableHead className="w-20 font-semibold" />
                    )}
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayProjects.map((project) => {
                    const stats = getProjectStats(project.id);
                    const issueCount = getIssueCount(project.id);
                    return (
                      <TableRow
                        key={project.id}
                        className="cursor-pointer transition-colors hover:bg-primary/5"
                        onClick={() => setSelectedId(project.id)}
                      >
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {project.code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {project.name}
                        </TableCell>
                        <TableCell className="text-sm">{project.pmName}</TableCell>
                        <TableCell className="text-xs">
                          <div>정: {project.assigneePrimary || "—"}</div>
                          {project.assigneeSecondary && (
                            <div className="text-muted-foreground">
                              부: {project.assigneeSecondary}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {project.startDate}
                          <br />~ {project.endDate}
                        </TableCell>
                        <TableCell>
                          <ProjectStatusBadge status={project.status} />
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span
                              className={cn(
                                "font-mono font-semibold",
                                stats.allocatedTotal > 0 &&
                                  stats.md > stats.allocatedTotal
                                  ? "text-destructive"
                                  : "text-primary"
                              )}
                            >
                              {stats.md.toFixed(1)} / {stats.allocatedTotal.toFixed(1)}M
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              · {stats.memberCount}명
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {issueCount > 0 ? (
                            <Badge
                              variant="outline"
                              className="border-orange-200 bg-orange-50 text-orange-700"
                            >
                              {issueCount}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        {(canEditProject() || canDeleteProject()) && (
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              {canEditProject() && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditing(project);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {canDeleteProject() && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      window.confirm(
                                        `"${project.code}" 프로젝트를 삭제할까요?\n연결된 업무·이슈 등이 있으면 실패할 수 있습니다.`
                                      )
                                    ) {
                                      deleteProject(project.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
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

      <ProjectFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing ?? emptyForm}
        onSave={async (data) => {
          if (editing) {
            await updateProject(editing.id, data);
          } else {
            await addProject(data);
          }
        }}
        title={editing ? "프로젝트 수정" : "프로젝트 등록"}
        canEditAssignee={canEditAssignee()}
      />
    </div>
  );
}
