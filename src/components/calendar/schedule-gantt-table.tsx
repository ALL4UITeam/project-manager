"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { ScheduleRow } from "@/types";
import {
  PART_GANTT_BG,
  PART_GANTT_ROW_BG,
  PART_GANTT_TEXT,
} from "@/types";
import {
  getRowBarSpan,
  groupColumnsByMonth,
  groupScheduleRows,
  type ScheduleWeekColumn,
} from "@/lib/schedule-utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** 주간 타임라인 셀 너비(px) — 컴팩트 */
const CELL_W = 30;
const STICKY = { service: 88, part: 72, task: 140, remarks: 128 };

function RemarkCell({
  row,
  canEdit,
  onSave,
}: {
  row: ScheduleRow;
  canEdit: boolean;
  onSave: (id: string, remarks: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row.remarks ?? "");

  useEffect(() => {
    if (!editing) setValue(row.remarks ?? "");
  }, [row.remarks, editing]);

  const commit = () => {
    const next = value.trim();
    const prev = (row.remarks ?? "").trim();
    if (next !== prev) {
      onSave(row.id, next);
    }
    setEditing(false);
  };

  if (!canEdit) {
    return (
      <td className="px-2 py-1.5 align-top text-xs leading-snug text-muted-foreground whitespace-normal">
        {row.remarks}
      </td>
    );
  }

  if (editing) {
    return (
      <td className="px-1 py-1 align-top">
        <textarea
          autoFocus
          value={value}
          rows={2}
          placeholder="마일스톤·참고 사항"
          className="w-full min-w-[100px] resize-y rounded-md border border-primary/30 bg-background px-2 py-1 text-xs leading-snug shadow-sm outline-none ring-2 ring-primary/20"
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setValue(row.remarks ?? "");
              setEditing(false);
            }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              commit();
            }
          }}
        />
      </td>
    );
  }

  return (
    <td
      className="cursor-text px-2 py-1.5 align-top text-xs leading-snug whitespace-normal transition-colors hover:bg-muted/40"
      onClick={() => setEditing(true)}
      title="클릭하여 비고 입력"
    >
      {row.remarks ? (
        <span className="text-muted-foreground">{row.remarks}</span>
      ) : (
        <span className="text-muted-foreground/45">+ 비고</span>
      )}
    </td>
  );
}

export function ScheduleGanttTable({
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
}: {
  rows: ScheduleRow[];
  columns: ScheduleWeekColumn[];
  canEdit: boolean;
  onEdit: (row: ScheduleRow) => void;
  onDelete: (row: ScheduleRow) => void;
  /** 서비스(맨 앞 열) 삭제 → 하위 구분·상세 전부 삭제 */
  onDeleteService?: (service: string) => void;
  /** 구분(중간 열) 삭제 → 해당 구분의 상세업무 전부 삭제 */
  onDeletePart?: (service: string, part: ScheduleRow["part"]) => void;
  onEditService?: (service: string) => void;
  onEditPart?: (service: string, part: ScheduleRow["part"]) => void;
  onUpdateRemarks?: (id: string, remarks: string) => void;
}) {
  const monthGroups = groupColumnsByMonth(columns);
  const groupedRows = groupScheduleRows(rows);
  const timelineWidth = columns.length * CELL_W;

  if (groupedRows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 py-10 text-center">
        <p className="text-xs text-muted-foreground">
          {canEdit
            ? "등록된 WBS 일정이 없습니다 · WBS 템플릿 또는 행 추가로 시작하세요"
            : "표시할 일정이 없습니다"}
        </p>
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 py-10 text-center">
        <p className="text-xs text-muted-foreground">
          선택한 연도에 표시할 일정 기간이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border/70">
      <table
        className="w-full border-collapse text-[13px]"
        style={{
          minWidth:
            STICKY.service + STICKY.part + STICKY.task + timelineWidth + STICKY.remarks,
        }}
      >
        <thead>
          <tr className="bg-muted/50">
            <th
              rowSpan={2}
              className="sticky left-0 z-30 border-b border-r border-border/80 bg-muted/95 px-2 py-1 text-left text-xs font-semibold text-muted-foreground"
              style={{ width: STICKY.service, minWidth: STICKY.service }}
            >
              서비스
            </th>
            <th
              rowSpan={2}
              className="sticky z-30 border-b border-r border-border/80 bg-muted/95 px-2 py-1 text-left text-xs font-semibold text-muted-foreground"
              style={{
                left: STICKY.service,
                width: STICKY.part,
                minWidth: STICKY.part,
              }}
            >
              구분
            </th>
            <th
              rowSpan={2}
              className="sticky z-30 border-b border-r border-border/80 bg-muted/95 px-2 py-1 text-left text-xs font-semibold text-muted-foreground"
              style={{
                left: STICKY.service + STICKY.part,
                width: STICKY.task,
                minWidth: STICKY.task,
              }}
            >
              상세업무
            </th>
            {monthGroups.map((g) => (
              <th
                key={g.monthKey}
                colSpan={g.colSpan}
                className="border-b border-r border-border/60 px-1 py-1 text-center text-[13px] font-semibold"
              >
                {g.monthLabel}
              </th>
            ))}
            <th
              rowSpan={2}
              className="border-b border-border/80 bg-muted/95 px-2 py-1 text-left text-xs font-semibold text-muted-foreground"
              style={{ minWidth: STICKY.remarks }}
            >
              비고
            </th>
          </tr>
          <tr className="bg-muted/25">
            {columns.map((col) => (
              <th
                key={col.id}
                className="border-b border-r border-border/50 py-0.5 text-center text-[11px] font-medium text-muted-foreground"
                style={{ width: CELL_W, minWidth: CELL_W }}
              >
                {col.weekLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groupedRows.map((row) => {
            const bar = getRowBarSpan(row, columns);
            return (
              <tr
                key={row.id}
                className={cn(
                  "group border-b border-border/40",
                  PART_GANTT_ROW_BG[row.part],
                  "hover:brightness-[0.99]"
                )}
              >
                {row.showService && (
                  <td
                    rowSpan={row.serviceRowSpan}
                    className="sticky left-0 z-20 border-r border-border/60 bg-card px-2 py-1.5 align-middle text-[13px] font-semibold"
                    style={{ width: STICKY.service, minWidth: STICKY.service }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>{row.service}</span>
                      {canEdit && (onEditService || onDeleteService) && (
                        <div className="flex shrink-0 gap-0 opacity-0 transition-opacity group-hover:opacity-100">
                          {onEditService && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-6 w-6"
                              title={`「${row.service}」 서비스명 수정`}
                              onClick={() => onEditService(row.service)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                          {onDeleteService && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title={`「${row.service}」 서비스 및 하위 일정 모두 삭제`}
                              onClick={() => onDeleteService(row.service)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                )}
                {row.showPart && (
                  <td
                    rowSpan={row.partRowSpan}
                    className={cn(
                      "sticky z-20 border-r border-border/60 px-2 py-1.5 align-middle text-[13px] font-medium",
                      PART_GANTT_TEXT[row.part]
                    )}
                    style={{
                      left: STICKY.service,
                      width: STICKY.part,
                      minWidth: STICKY.part,
                    }}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>{row.part}</span>
                      {canEdit && (onEditPart || onDeletePart) && (
                        <div className="flex shrink-0 gap-0 opacity-0 transition-opacity group-hover:opacity-100">
                          {onEditPart && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-6 w-6"
                              title={`「${row.part}」 구분 수정`}
                              onClick={() => onEditPart(row.service, row.part)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                          {onDeletePart && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title={`「${row.part}」 구분 및 하위 상세업무 모두 삭제`}
                              onClick={() =>
                                onDeletePart(row.service, row.part)
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                )}
                <td
                  className="sticky z-20 border-r border-border/60 bg-card/95 px-2 py-1 align-middle"
                  style={{
                    left: STICKY.service + STICKY.part,
                    width: STICKY.task,
                    minWidth: STICKY.task,
                  }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[13px] font-medium leading-tight">
                      {row.taskName}
                    </span>
                    {canEdit && (
                      <div className="flex shrink-0 gap-0 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="h-6 w-6"
                          title="수정"
                          onClick={() => onEdit(row)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="삭제"
                          onClick={() => onDelete(row)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </td>
                <td
                  colSpan={columns.length}
                  className="relative h-8 p-0 align-middle"
                >
                  <div className="absolute inset-0 flex">
                    {columns.map((col) => (
                      <div
                        key={col.id}
                        className="h-full border-r border-border/20"
                        style={{ width: CELL_W, minWidth: CELL_W }}
                      />
                    ))}
                  </div>
                  {bar && (
                    <div
                      className={cn(
                        "pointer-events-none absolute top-1/2 z-10 h-[18px] -translate-y-1/2 rounded-sm shadow-sm ring-1 ring-black/5",
                        PART_GANTT_BG[row.part]
                      )}
                      style={{
                        left: bar.start * CELL_W + 2,
                        width: bar.span * CELL_W - 4,
                      }}
                      title={`${row.taskName}: ${row.startDate} ~ ${row.endDate}`}
                    />
                  )}
                </td>
                <RemarkCell
                  row={row}
                  canEdit={canEdit && !!onUpdateRemarks}
                  onSave={(id, remarks) => onUpdateRemarks?.(id, remarks)}
                />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
