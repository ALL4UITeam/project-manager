import {
  addDays,
  addWeeks,
  format,
  startOfWeek,
  subWeeks,
  parseISO,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameWeek,
} from "date-fns";
import { ko } from "date-fns/locale";
import type { ReportTaskView, Weekday, WeeklyTask } from "@/types";

export const WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "월",
  tuesday: "화",
  wednesday: "수",
  thursday: "목",
  friday: "금",
};

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekStartISO(date: Date = new Date()): string {
  return format(getWeekStart(date), "yyyy-MM-dd");
}

export function getWeekDates(weekStart: Date): Date[] {
  return WEEKDAYS.map((_, i) => addDays(weekStart, i));
}

export function formatWeekRange(weekStart: Date): string {
  const dates = getWeekDates(weekStart);
  const start = format(dates[0], "M월 d일", { locale: ko });
  const end = format(dates[4], "M월 d일", { locale: ko });
  return `${start} ~ ${end}`;
}

export function formatWeekdayHeader(date: Date): string {
  return format(date, "M/d (EEE)", { locale: ko });
}

export function navigateWeek(weekStart: Date, direction: "prev" | "next"): Date {
  return direction === "prev" ? subWeeks(weekStart, 1) : addWeeks(weekStart, 1);
}

export function getMonthGrid(month: Date): Date[][] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = addDays(
    startOfWeek(monthEnd, { weekStartsOn: 0 }),
    6
  );
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function isInCurrentMonth(day: Date, month: Date): boolean {
  return isSameMonth(day, month);
}

export function isToday(day: Date): boolean {
  return isSameDay(day, new Date());
}

export function parseWeekStart(iso: string): Date {
  return parseISO(iso);
}

export function getWeekStartFromDate(isoDate: string): string {
  return format(getWeekStart(parseISO(isoDate)), "yyyy-MM-dd");
}

export function isWeekInYear(weekStart: Date, year: number): boolean {
  return parseInt(format(weekStart, "yyyy"), 10) === year;
}

export function getWeekBoundsForYear(year: number): { min: Date; max: Date } {
  let min = getWeekStart(new Date(year, 0, 1));
  while (!isWeekInYear(min, year)) {
    min = addWeeks(min, 1);
  }
  let max = getWeekStart(new Date(year, 11, 31));
  while (!isWeekInYear(max, year)) {
    max = subWeeks(max, 1);
  }
  return { min, max };
}

export function getAnchorWeekForYear(year: number): Date {
  const now = new Date();
  if (now.getFullYear() === year) {
    return getWeekStart(now);
  }
  return getWeekBoundsForYear(year).max;
}

/** 탭별 기준 주차 (월요일) */
export function getWeekStartForReportView(
  reportWeekStart: Date,
  view: ReportTaskView
): Date {
  if (view === "LAST_WEEK") return subWeeks(reportWeekStart, 1);
  if (view === "NEXT_WEEK") return addWeeks(reportWeekStart, 1);
  return reportWeekStart;
}

/** 주간 보고 주차 기준으로 실적·계획 업무 필터 */
export function filterTasksByReportView(
  tasks: WeeklyTask[],
  reportWeekStart: Date,
  view: ReportTaskView
): WeeklyTask[] {
  if (view === "NEXT_WEEK") {
    const nextWeek = addWeeks(reportWeekStart, 1);
    return tasks.filter(
      (t) =>
        t.taskType === "NEXT_WEEK" &&
        isSameWeek(parseISO(t.startDate), nextWeek, { weekStartsOn: 1 })
    );
  }

  const targetWeek =
    view === "LAST_WEEK" ? subWeeks(reportWeekStart, 1) : reportWeekStart;

  return tasks.filter(
    (t) =>
      t.taskType === "THIS_WEEK" &&
      isSameWeek(parseISO(t.startDate), targetWeek, { weekStartsOn: 1 })
  );
}
