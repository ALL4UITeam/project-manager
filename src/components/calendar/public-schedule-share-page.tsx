"use client";

import { useMemo, useState, useEffect } from "react";
import { FileX2, Globe } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useApp } from "@/context/app-context";
import {
  buildScheduleWeekColumnsForRows,
  rowOverlapsYear,
  yearBounds,
} from "@/lib/schedule-utils";
import { ScheduleGanttProjectPanel } from "@/components/calendar/schedule-gantt-project-panel";
import { YearFilterSelect } from "@/components/shared/year-filter-select";
import {
  getAvailableYears,
  getDefaultSelectedYear,
} from "@/lib/project-utils";
import { Badge } from "@/components/ui/badge";

/** 공유 URL 전용 — 사이드바·편집 UI 없이 간트 본문만 */
export function PublicScheduleSharePage({ token }: { token: string }) {
  const { getProjectByScheduleShareToken, getScheduleRowsByProject } = useApp();
  const project = getProjectByScheduleShareToken(token);

  const allYears = useMemo(
    () => (project ? getAvailableYears([project]) : []),
    [project]
  );

  const [selectedYear, setSelectedYear] = useState(() =>
    getDefaultSelectedYear(allYears)
  );

  useEffect(() => {
    if (allYears.length > 0 && !allYears.includes(selectedYear)) {
      setSelectedYear(getDefaultSelectedYear(allYears));
    }
  }, [allYears, selectedYear]);

  const rows = useMemo(() => {
    if (!project) return [];
    return getScheduleRowsByProject(project.id).filter((r) =>
      rowOverlapsYear(r, selectedYear)
    );
  }, [project, getScheduleRowsByProject, selectedYear]);

  const columns = useMemo(
    () => buildScheduleWeekColumnsForRows(rows, selectedYear),
    [rows, selectedYear]
  );

  if (!project) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <FileX2 className="h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-lg font-semibold">일정표를 찾을 수 없습니다</h1>
        <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
          링크가 만료되었거나, 공유가 해제되었거나, 주소가 올바르지 않을 수
          있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <div className="mb-4 text-center">
        <Badge variant="secondary" className="mb-3 gap-1">
          <Globe className="h-3 w-3" />
          공유 일정표 · 조회 전용
        </Badge>
        <h1 className="text-lg font-bold leading-snug">
          <span className="font-numeric text-primary">{project.code}</span>
          <span className="mt-1 block text-sm font-normal text-muted-foreground">
            {project.name}
          </span>
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          PM {project.pmName} ·{" "}
          {format(yearBounds(selectedYear).start, "yyyy년", { locale: ko })}
        </p>
      </div>

      <div className="mb-4 flex justify-center">
        <YearFilterSelect
          years={allYears}
          value={selectedYear}
          onChange={setSelectedYear}
          className="h-8 w-28"
        />
      </div>

      <ScheduleGanttProjectPanel
        project={project}
        selectedYear={selectedYear}
        rows={rows}
        columns={columns}
        canEdit={false}
        onEdit={() => {}}
        onDelete={() => {}}
        compact
      />

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        이 페이지는 링크를 통해 공유된 프로젝트 일정표입니다. 수정은 팀 계정으로
        로그인한 사용자만 가능합니다.
      </p>
    </div>
  );
}
