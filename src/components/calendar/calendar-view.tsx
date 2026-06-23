"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
  differenceInDays,
  isWithinInterval,
} from "date-fns";
import { ko } from "date-fns/locale";
import { useApp } from "@/context/app-context";
import {
  CALENDAR_EVENT_LABELS,
  type CalendarEventType,
} from "@/types";
import {
  getMonthGrid,
  isInCurrentMonth,
  isToday,
  getWeekStart,
  getWeekDates,
  WEEKDAYS,
} from "@/lib/week-utils";
import { WEEKDAY_LABELS } from "@/lib/week-utils";
import { GlobalProjectFilter } from "@/components/shared/global-project-filter";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MILESTONE_STYLES: Record<CalendarEventType, string> = {
  "draft-deadline": "bg-emerald-100 text-emerald-800 border-emerald-200",
  report: "bg-blue-100 text-blue-800 border-blue-200",
  general: "bg-slate-100 text-slate-600 border-slate-200",
};

const BAR_COLORS = [
  "bg-primary/70",
  "bg-sky-400/80",
  "bg-indigo-400/70",
  "bg-violet-400/70",
];

const PART_BAR_COLORS: Record<string, string> = {
  기획: "bg-amber-400/80",
  디자인: "bg-pink-400/80",
  퍼블리싱: "bg-cyan-400/80",
};

export function CalendarView() {
  const {
    weeklyTasks,
    milestones,
    currentUser,
    projects,
    filteredWeeklyTasks,
    projectFilter,
  } = useApp();

  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(getWeekStart());

  const isExternal = currentUser?.role === "EXTERNAL";

  const visibleMilestones = milestones.filter((m) =>
    isExternal ? m.isShared : true
  ).filter((m) =>
    projectFilter === "all" ? true : m.projectId === projectFilter
  );

  const visibleTasks = (projectFilter === "all" ? weeklyTasks : filteredWeeklyTasks);

  const taskBars = useMemo(() => {
    return visibleTasks.map((task, i) => ({
      ...task,
      color: PART_BAR_COLORS[task.part] ?? BAR_COLORS[i % BAR_COLORS.length],
      project: projects.find((p) => p.id === task.projectId),
    }));
  }, [visibleTasks, projects]);

  const getMilestonesForDate = (date: Date) =>
    visibleMilestones.filter((m) => isSameDay(parseISO(m.date), date));

  const getBarsForDate = (date: Date) =>
    taskBars.filter((bar) =>
      isWithinInterval(date, {
        start: parseISO(bar.startDate),
        end: parseISO(bar.endDate),
      })
    );

  const navigate = (dir: "prev" | "next") => {
    if (view === "month") {
      setCurrentDate(dir === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else {
      setWeekStart(dir === "prev" ? subWeeks(weekStart, 1) : addWeeks(weekStart, 1));
    }
  };

  const monthGrid = getMonthGrid(currentDate);
  const weekDates = getWeekDates(weekStart);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CalendarIcon}
        iconClassName="bg-emerald-500/10 text-emerald-600 ring-emerald-500/15"
        title="일정 관리"
        description="업무 기간 Bar · 마일스톤 태그 통합 캘린더"
      >
        {!isExternal && <GlobalProjectFilter />}
        <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week")}>
          <TabsList>
            <TabsTrigger value="month">월간</TabsTrigger>
            <TabsTrigger value="week">주간</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <div className="flex flex-wrap gap-4 text-xs">
        {(["draft-deadline", "report", "general"] as CalendarEventType[]).map(
          (type) => (
            <div key={type} className="flex items-center gap-1.5">
              <Badge variant="outline" className={cn("text-[10px]", MILESTONE_STYLES[type])}>
                {CALENDAR_EVENT_LABELS[type]}
              </Badge>
            </div>
          )
        )}
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-6 rounded bg-primary/70" />
          <span>업무 기간 Bar</span>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {view === "month"
              ? format(currentDate, "yyyy년 M월", { locale: ko })
              : `${format(weekDates[0], "M/d")} ~ ${format(weekDates[4], "M/d")}`}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentDate(new Date());
                setWeekStart(getWeekStart());
              }}
            >
              오늘
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {view === "month" ? (
            <div className="overflow-x-auto">
              <div className="grid min-w-[800px] grid-cols-7">
                {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                  <div
                    key={d}
                    className="border-b border-border py-2 text-center text-xs font-semibold text-muted-foreground"
                  >
                    {d}
                  </div>
                ))}
                {monthGrid.flat().map((day) => {
                  const ms = getMilestonesForDate(day);
                  const bars = getBarsForDate(day);
                  const inMonth = isInCurrentMonth(day, currentDate);
                  const today = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "min-h-[110px] border-b border-r border-border p-1.5",
                        !inMonth && "bg-muted/20",
                        today && "bg-primary/5"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                          today && "bg-primary text-primary-foreground font-bold",
                          !inMonth && "text-muted-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {bars.slice(0, 2).map((bar) => (
                          <div
                            key={`${bar.id}-${format(day, "d")}`}
                            className={cn(
                              "truncate rounded px-1 py-0.5 text-[9px] font-medium text-white",
                              bar.color
                            )}
                            title={`${bar.project?.code} · ${bar.content}`}
                          >
                            {bar.project?.code}
                          </div>
                        ))}
                        {ms.map((m) => (
                          <div
                            key={m.id}
                            className={cn(
                              "truncate rounded border px-1 py-0.5 text-[9px] font-medium",
                              MILESTONE_STYLES[m.type]
                            )}
                          >
                            {m.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2">
                {WEEKDAYS.map((day, i) => {
                  const date = weekDates[i];
                  const ms = getMilestonesForDate(date);
                  const today = isToday(date);
                  return (
                    <div
                      key={day}
                      className={cn(
                        "rounded-lg border p-2 text-center",
                        today && "border-primary/30 bg-primary/5"
                      )}
                    >
                      <p className="text-sm font-semibold">{WEEKDAY_LABELS[day]}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(date, "M/d")}
                      </p>
                      {ms.map((m) => (
                        <Badge
                          key={m.id}
                          variant="outline"
                          className={cn("mt-1 text-[9px]", MILESTONE_STYLES[m.type])}
                        >
                          {m.title}
                        </Badge>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">업무 기간 Bar</p>
                {taskBars.map((bar) => {
                  const start = parseISO(bar.startDate);
                  const end = parseISO(bar.endDate);
                  const weekStartDate = weekDates[0];
                  const weekEndDate = weekDates[4];
                  if (end < weekStartDate || start > weekEndDate) return null;

                  const clampStart = start < weekStartDate ? weekStartDate : start;
                  const clampEnd = end > weekEndDate ? weekEndDate : end;
                  const offset =
                    differenceInDays(clampStart, weekStartDate) / 5;
                  const width =
                    (differenceInDays(clampEnd, clampStart) + 1) / 5;

                  return (
                    <div key={bar.id} className="relative h-8 rounded-lg bg-muted/30">
                      <div
                        className={cn(
                          "absolute top-1 flex h-6 items-center truncate rounded-md px-2 text-[11px] font-medium text-white",
                          bar.color
                        )}
                        style={{
                          left: `${offset * 100}%`,
                          width: `${Math.max(width * 100, 8)}%`,
                        }}
                        title={bar.content}
                      >
                        {bar.project?.code} · {bar.part} · {bar.md}M/D
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
