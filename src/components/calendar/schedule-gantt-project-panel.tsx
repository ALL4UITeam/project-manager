"use client";

import type { Project, ScheduleRow } from "@/types";
import type { ScheduleWeekColumn } from "@/lib/schedule-utils";
import { ScheduleGanttTable } from "@/components/calendar/schedule-gantt-table";
import { ProjectScheduleSharePanel } from "@/components/calendar/project-schedule-share-panel";

export function ScheduleGanttProjectPanel({
  project,
  selectedYear,
  rows,
  columns,
  canEdit,
  onEdit,
  onDelete,
  onDeleteService,
  onDeletePart,
  onEditService,
  onEditPart,
  onUpdateRemarks,
  showSharePanel = false,
  compact = false,
}: {
  project: Project;
  selectedYear: number;
  rows: ScheduleRow[];
  columns: ScheduleWeekColumn[];
  canEdit: boolean;
  onEdit: (row: ScheduleRow) => void;
  onDelete: (row: ScheduleRow) => void;
  onDeleteService?: (service: string) => void;
  onDeletePart?: (service: string, part: ScheduleRow["part"]) => void;
  onEditService?: (service: string) => void;
  onEditPart?: (service: string, part: ScheduleRow["part"]) => void;
  onUpdateRemarks?: (id: string, remarks: string) => void;
  showSharePanel?: boolean;
  /** 공유 페이지 — 메타 정보 최소화 */
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-sm font-bold">
              <span className="font-numeric text-primary">{project.code}</span>
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                {project.name}
              </span>
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {selectedYear}년 · PM {project.pmName}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100/80 px-2 py-0.5 font-medium text-yellow-900">
              <span className="h-1.5 w-3 rounded-sm bg-yellow-400" />
              기획
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 font-medium text-emerald-900">
              <span className="h-1.5 w-3 rounded-sm bg-emerald-400" />
              디자인
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100/80 px-2 py-0.5 font-medium text-sky-900">
              <span className="h-1.5 w-3 rounded-sm bg-sky-400" />
              퍼블리싱
            </span>
          </div>
        </div>
      )}

      {showSharePanel && canEdit && (
        <ProjectScheduleSharePanel project={project} />
      )}

      <ScheduleGanttTable
        rows={rows}
        columns={columns}
        canEdit={canEdit}
        onEdit={onEdit}
        onDelete={onDelete}
        onDeleteService={onDeleteService}
        onDeletePart={onDeletePart}
        onEditService={onEditService}
        onEditPart={onEditPart}
        onUpdateRemarks={onUpdateRemarks}
      />
    </div>
  );
}
