"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GanttChartSquare,
  Plus,
  LayoutTemplate,
  Search,
  Save,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { useApp } from "@/context/app-context";
import { useScheduleDraft } from "@/hooks/use-schedule-draft";
import type { ScheduleRow } from "@/types";
import {
  buildScheduleWeekColumnsForRows,
  rowOverlapsYear,
} from "@/lib/schedule-utils";
import {
  SCHEDULE_TEMPLATE_LABELS,
  type ScheduleTemplateId,
} from "@/lib/schedule-templates";
import {
  filterProjectsBySearch,
  filterProjectsByYear,
  getAvailableYears,
  getDefaultSelectedYear,
} from "@/lib/project-utils";
import { PageHeader } from "@/components/shared/page-header";
import { YearFilterSelect } from "@/components/shared/year-filter-select";
import { ScheduleRowDialog } from "@/components/calendar/schedule-row-dialog";
import { ScheduleGanttProjectPanel } from "@/components/calendar/schedule-gantt-project-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TEMPLATE_IDS = Object.keys(SCHEDULE_TEMPLATE_LABELS) as ScheduleTemplateId[];

export function ScheduleGanttView() {
  const {
    projects,
    getProjectById,
    getScheduleRowsByProject,
    setScheduleRowsForProject,
    canEditCalendar,
  } = useApp();

  const canEdit = canEditCalendar();
  const availableYears = useMemo(() => getAvailableYears(projects), [projects]);
  const [selectedYear, setSelectedYear] = useState(() =>
    getDefaultSelectedYear(availableYears)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const yearProjects = useMemo(
    () => filterProjectsByYear(projects, selectedYear),
    [projects, selectedYear]
  );

  const filteredProjects = useMemo(
    () => filterProjectsBySearch(yearProjects, searchQuery),
    [yearProjects, searchQuery]
  );

  const serverRows = useMemo(
    () =>
      selectedProjectId ? getScheduleRowsByProject(selectedProjectId) : [],
    [selectedProjectId, getScheduleRowsByProject]
  );

  const {
    draftRows,
    isDirty,
    saving,
    saveMessage,
    addRow,
    updateRow,
    deleteRow,
    applyTemplate,
    resetDraft,
    saveDraft,
    confirmDiscard,
  } = useScheduleDraft(selectedProjectId, serverRows, canEdit);

  useEffect(() => {
    if (filteredProjects.length === 0) {
      setSelectedProjectId("");
      return;
    }
    if (!filteredProjects.some((p) => p.id === selectedProjectId)) {
      const withSchedule = filteredProjects.find((p) =>
        getScheduleRowsByProject(p.id).some((r) =>
          rowOverlapsYear(r, selectedYear)
        )
      );
      setSelectedProjectId(withSchedule?.id ?? filteredProjects[0].id);
    }
  }, [
    filteredProjects,
    selectedProjectId,
    selectedYear,
    getScheduleRowsByProject,
  ]);

  const project = selectedProjectId
    ? getProjectById(selectedProjectId)
    : undefined;

  const rows = useMemo(() => {
    if (!selectedProjectId) return [];
    return draftRows.filter((r) => rowOverlapsYear(r, selectedYear));
  }, [selectedProjectId, selectedYear, draftRows]);

  const projectDraftRows = useMemo(
    () => draftRows.filter((r) => r.projectId === selectedProjectId),
    [draftRows, selectedProjectId]
  );

  const existingServices = useMemo(
    () => [...new Set(projectDraftRows.map((r) => r.service))],
    [projectDraftRows]
  );

  const defaultServiceForNewRow = useMemo(() => {
    if (existingServices.length === 1) return existingServices[0];
    return projectDraftRows[projectDraftRows.length - 1]?.service;
  }, [existingServices, projectDraftRows]);

  const columns = useMemo(
    () => buildScheduleWeekColumnsForRows(rows, selectedYear),
    [rows, selectedYear]
  );

  const [rowDialogOpen, setRowDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ScheduleRow | null>(null);
  const [templateAnchor, setTemplateAnchor] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  const handleProjectChange = (projectId: string) => {
    if (projectId === selectedProjectId) return;
    if (!confirmDiscard()) return;
    setSelectedProjectId(projectId);
  };

  const openCreateRow = () => {
    setEditingRow(null);
    setRowDialogOpen(true);
  };

  const openEditRow = (row: ScheduleRow) => {
    setEditingRow(row);
    setRowDialogOpen(true);
  };

  const handleDeleteRow = (row: ScheduleRow) => {
    if (!canEdit) return;
    if (window.confirm(`"${row.taskName}" 일정을 삭제할까요?`)) {
      deleteRow(row.id);
    }
  };

  const handleUpdateRemarks = (id: string, remarks: string) => {
    if (!canEdit) return;
    updateRow(id, { remarks: remarks || undefined });
  };

  const handleApplyTemplate = (templateId: ScheduleTemplateId) => {
    if (!selectedProjectId || !canEdit) return;
    applyTemplate(templateId, templateAnchor);
  };

  const handleSave = async () => {
    if (!selectedProjectId) return;
    await saveDraft((saved) => {
      setScheduleRowsForProject(selectedProjectId, saved);
    });
  };

  return (
    <>
      <PageHeader
        icon={GanttChartSquare}
        iconClassName="bg-emerald-500/10 text-emerald-600 ring-emerald-500/15"
        title="프로젝트 일정표"
        description="연도 · 프로젝트별 WBS 간트"
      >
        {canEdit && selectedProjectId && (
          <>
            {isDirty && (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                저장 필요
              </Badge>
            )}
            {isDirty && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetDraft}
                disabled={saving}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                변경 취소
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || saving}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "저장 중..." : "저장"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={saving}>
                  <LayoutTemplate className="mr-1.5 h-4 w-4" />
                  WBS 템플릿
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {TEMPLATE_IDS.map((id) => (
                  <DropdownMenuItem
                    key={id}
                    onClick={() => handleApplyTemplate(id)}
                  >
                    {SCHEDULE_TEMPLATE_LABELS[id]} 추가
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" onClick={openCreateRow} disabled={saving}>
              <Plus className="mr-1.5 h-4 w-4" />
              행 추가
            </Button>
          </>
        )}
      </PageHeader>

      {canEdit && selectedProjectId && (isDirty || saveMessage) && (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
          {isDirty && (
            <p>변경 사항이 있습니다. 상단 [저장]을 눌러 DB에 반영하세요.</p>
          )}
          {saveMessage && (
            <p className={isDirty ? "mt-1" : undefined}>{saveMessage}</p>
          )}
        </div>
      )}

      <Card className="glass-card border-0">
        <CardContent className="space-y-3 p-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">연도</p>
              <YearFilterSelect
                years={availableYears}
                value={selectedYear}
                onChange={setSelectedYear}
                className="w-28 h-8"
              />
            </div>
            <div className="min-w-[180px] flex-1 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                프로젝트 검색
              </p>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="코드 또는 프로젝트명"
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
            {canEdit && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  템플릿 기준일
                </p>
                <Input
                  type="date"
                  className="h-8 w-36 text-xs"
                  value={templateAnchor}
                  onChange={(e) => setTemplateAnchor(e.target.value)}
                />
              </div>
            )}
          </div>

          {filteredProjects.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                프로젝트
              </p>
              <Select
                value={selectedProjectId}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger className="h-9 w-full max-w-md text-xs">
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects.map((p) => {
                    const count = getScheduleRowsByProject(p.id).filter((r) =>
                      rowOverlapsYear(r, selectedYear)
                    ).length;
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-numeric font-bold">{p.code}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {p.name}
                          {count > 0 ? ` (WBS ${count})` : ""}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {filteredProjects.length === 0 ? (
        <Card className="glass-card border-0">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {searchQuery.trim()
              ? `"${searchQuery}"에 해당하는 ${selectedYear}년 프로젝트가 없습니다`
              : `${selectedYear}년에 해당하는 프로젝트가 없습니다`}
          </CardContent>
        </Card>
      ) : (
        project && (
          <ScheduleGanttProjectPanel
            project={project}
            selectedYear={selectedYear}
            rows={rows}
            columns={columns}
            canEdit={canEdit}
            onEdit={openEditRow}
            onDelete={handleDeleteRow}
            onUpdateRemarks={handleUpdateRemarks}
            showSharePanel
          />
        )
      )}

      {selectedProjectId && (
        <ScheduleRowDialog
          open={rowDialogOpen}
          onOpenChange={setRowDialogOpen}
          projectId={selectedProjectId}
          editing={editingRow}
          defaultService={defaultServiceForNewRow}
          serviceSuggestions={existingServices}
          rowsForOrder={draftRows}
          onAddRow={addRow}
          onUpdateRow={updateRow}
          onDeleteRow={deleteRow}
        />
      )}
    </>
  );
}
