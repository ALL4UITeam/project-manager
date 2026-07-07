import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import type { ProjectIssue, ProjectRemark, WeeklyTask } from "@/types";
import { getWeekStart } from "@/lib/week-utils";

/** mock-data 기준 이번주 월요일 */
const MOCK_ANCHOR_MONDAY = parseISO("2026-07-06");

function shiftIsoDate(iso: string, days: number): string {
  if (!days) return iso;
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd");
}

export function getDemoWeekShiftDays(): number {
  return differenceInCalendarDays(
    getWeekStart(new Date()),
    getWeekStart(MOCK_ANCHOR_MONDAY)
  );
}

export function alignWeeklyTasksToCurrentWeek(
  tasks: WeeklyTask[]
): WeeklyTask[] {
  const shift = getDemoWeekShiftDays();
  if (!shift) return tasks;
  return tasks.map((t) => ({
    ...t,
    startDate: shiftIsoDate(t.startDate, shift),
    endDate: shiftIsoDate(t.endDate, shift),
  }));
}

export function alignProjectIssuesToCurrentWeek(
  issues: ProjectIssue[]
): ProjectIssue[] {
  const shift = getDemoWeekShiftDays();
  if (!shift) return issues;
  return issues.map((i) => ({
    ...i,
    date: shiftIsoDate(i.date, shift),
    weekStart: shiftIsoDate(i.weekStart, shift),
  }));
}

export function alignProjectRemarksToCurrentWeek(
  remarks: ProjectRemark[]
): ProjectRemark[] {
  const shift = getDemoWeekShiftDays();
  if (!shift) return remarks;
  return remarks.map((r) => ({
    ...r,
    date: r.date ? shiftIsoDate(r.date, shift) : r.date,
    weekStart: shiftIsoDate(r.weekStart, shift),
  }));
}
