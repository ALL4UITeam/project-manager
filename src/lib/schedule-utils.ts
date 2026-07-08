import {
  addDays,
  addMonths,
  addWeeks,
  eachMonthOfInterval,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  max,
  min,
  parseISO,
  startOfMonth,
} from "date-fns";
import { ko } from "date-fns/locale";
import type { ScheduleRow } from "@/types";
import { WORK_PARTS } from "@/types";
import { getWeekStart } from "@/lib/week-utils";

export interface ScheduleWeekColumn {
  id: string;
  monthKey: string;
  monthLabel: string;
  weekInMonth: number;
  weekLabel: string;
  start: Date;
  end: Date;
}

/** 해당 월에 월요일이 속한 주만 W1~Wn (실제 달력 기준, 월간 4~5주) */
export function getMonthWeekRanges(year: number, month: number) {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(monthStart);
  const ranges: { weekInMonth: number; start: Date; end: Date }[] = [];

  let monday = getWeekStart(monthStart);
  while (monday < monthStart) {
    monday = addWeeks(monday, 1);
  }

  let weekInMonth = 1;
  while (monday <= monthEnd) {
    ranges.push({
      weekInMonth,
      start: monday,
      end: addDays(monday, 6),
    });
    weekInMonth++;
    monday = addWeeks(monday, 1);
  }

  return ranges;
}

export function buildScheduleWeekColumns(
  rangeStart: Date,
  rangeEnd: Date
): ScheduleWeekColumn[] {
  const start = startOfMonth(rangeStart);
  const end = endOfMonth(rangeEnd);
  const columns: ScheduleWeekColumn[] = [];

  for (const month of eachMonthOfInterval({ start, end })) {
    const year = month.getFullYear();
    const monthNum = month.getMonth() + 1;
    const monthKey = format(month, "yyyy-MM");
    const monthLabel = format(month, "M월", { locale: ko });

    for (const range of getMonthWeekRanges(year, monthNum)) {
      if (isBefore(range.end, rangeStart) || isAfter(range.start, rangeEnd)) continue;

      columns.push({
        id: `${monthKey}-W${range.weekInMonth}`,
        monthKey,
        monthLabel,
        weekInMonth: range.weekInMonth,
        weekLabel: `W${range.weekInMonth}`,
        start: max([range.start, rangeStart]),
        end: min([range.end, rangeEnd]),
      });
    }
  }

  return columns;
}

export function rowOverlapsColumn(
  row: ScheduleRow,
  column: ScheduleWeekColumn
): boolean {
  const rowStart = parseISO(row.startDate);
  const rowEnd = parseISO(row.endDate);
  return rowStart <= column.end && rowEnd >= column.start;
}

export interface GroupedScheduleRow extends ScheduleRow {
  serviceRowSpan: number;
  partRowSpan: number;
  showService: boolean;
  showPart: boolean;
}

export function groupScheduleRows(rows: ScheduleRow[]): GroupedScheduleRow[] {
  const sorted = [...rows].sort(
    (a, b) =>
      a.service.localeCompare(b.service) ||
      WORK_PARTS.indexOf(a.part) - WORK_PARTS.indexOf(b.part) ||
      a.sortOrder - b.sortOrder
  );

  const result: GroupedScheduleRow[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    const prev = sorted[i - 1];
    const next = sorted[i + 1];

    const showService = !prev || prev.service !== row.service;
    const showPart =
      showService || !prev || prev.part !== row.part || prev.service !== row.service;

    let serviceRowSpan = 1;
    if (showService) {
      let j = i + 1;
      while (j < sorted.length && sorted[j].service === row.service) {
        serviceRowSpan++;
        j++;
      }
    }

    let partRowSpan = 1;
    if (showPart) {
      let j = i + 1;
      while (
        j < sorted.length &&
        sorted[j].service === row.service &&
        sorted[j].part === row.part
      ) {
        partRowSpan++;
        j++;
      }
    }

    result.push({
      ...row,
      serviceRowSpan,
      partRowSpan,
      showService,
      showPart,
    });

    void next;
  }

  return result;
}

export function getScheduleRangeFromRows(rows: ScheduleRow[]): {
  start: Date;
  end: Date;
} | null {
  if (rows.length === 0) return null;
  let start = parseISO(rows[0].startDate);
  let end = parseISO(rows[0].endDate);
  for (const row of rows) {
    const rs = parseISO(row.startDate);
    const re = parseISO(row.endDate);
    if (isBefore(rs, start)) start = rs;
    if (isAfter(re, end)) end = re;
  }
  return { start: startOfMonth(start), end: endOfMonth(end) };
}

export function defaultScheduleRange(projectStart?: string, projectEnd?: string) {
  const now = new Date();
  const start = projectStart
    ? startOfMonth(parseISO(projectStart))
    : startOfMonth(now);
  const end = projectEnd
    ? endOfMonth(parseISO(projectEnd))
    : endOfMonth(addMonths(now, 3));
  return { start, end };
}

export interface MonthHeaderGroup {
  monthKey: string;
  monthLabel: string;
  colSpan: number;
}

export function getRowBarSpan(
  row: ScheduleRow,
  columns: ScheduleWeekColumn[]
): { start: number; end: number; span: number } | null {
  let start = -1;
  let end = -1;
  columns.forEach((col, i) => {
    if (rowOverlapsColumn(row, col)) {
      if (start === -1) start = i;
      end = i;
    }
  });
  if (start === -1) return null;
  return { start, end, span: end - start + 1 };
}

export function rowOverlapsYear(row: ScheduleRow, year: number): boolean {
  const startY = parseInt(row.startDate.slice(0, 4), 10);
  const endY = parseInt(row.endDate.slice(0, 4), 10);
  return year >= startY && year <= endY;
}

export function groupColumnsByMonth(
  columns: ScheduleWeekColumn[]
): MonthHeaderGroup[] {
  const groups: MonthHeaderGroup[] = [];
  for (const col of columns) {
    const last = groups[groups.length - 1];
    if (last?.monthKey === col.monthKey) {
      last.colSpan++;
    } else {
      groups.push({
        monthKey: col.monthKey,
        monthLabel: col.monthLabel,
        colSpan: 1,
      });
    }
  }
  return groups;
}

export function buildScheduleWeekColumnsForRows(
  rows: ScheduleRow[],
  year: number
): ScheduleWeekColumn[] {
  const yearRows = rows.filter((r) => rowOverlapsYear(r, year));
  if (yearRows.length === 0) return [];

  const { start, end } = yearBounds(year);
  const allColumns = buildScheduleWeekColumns(start, end);

  return allColumns.filter((col) =>
    yearRows.some((row) => rowOverlapsColumn(row, col))
  );
}

export function yearBounds(year: number): { start: Date; end: Date } {
  return {
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31),
  };
}
