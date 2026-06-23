"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
  getDay,
} from "date-fns";
import { ko } from "date-fns/locale";
import { useApp } from "@/context/app-context";
import type { CalendarMilestone } from "@/types";
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
import { CalendarEventDialog } from "@/components/calendar/calendar-event-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function milestoneStyle(m: CalendarMilestone) {
  if (m.isTeamAdmin) {
    return "bg-violet-100 text-violet-800 border-violet-200";
  }
  return "bg-primary/10 text-primary border-primary/20";
}

function dayCellBackground(day: Date, inMonth: boolean, today: boolean) {
  const dow = getDay(day);
  if (!inMonth) return "bg-muted/20";
  if (today) return "bg-primary/5";
  if (dow === 0) return "bg-red-50/70";
  if (dow === 6) return "bg-blue-50/60";
  return "bg-card/50";
}

function dayHeaderStyle(d: string) {
  if (d === "일") return "text-red-500/80";
  if (d === "토") return "text-blue-600/80";
  return "text-muted-foreground";
}

export function CalendarView() {
  const {
    milestones,
    currentUser,
    projectFilter,
    getProjectById,
    canEditCalendar,
  } = useApp();

  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(getWeekStart());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [editing, setEditing] = useState<CalendarMilestone | null>(null);

  const isExternal = currentUser?.role === "EXTERNAL";
  const canEdit = canEditCalendar();

  const visibleMilestones = milestones
    .filter((m) => (isExternal ? m.isShared : true))
    .filter((m) =>
      projectFilter === "all" ? true : m.projectId === projectFilter
    );

  const getMilestonesForDate = (date: Date) =>
    visibleMilestones.filter((m) => isSameDay(parseISO(m.date), date));

  const openCreate = (date: Date) => {
    if (!canEdit) return;
    setEditing(null);
    setSelectedDate(format(date, "yyyy-MM-dd"));
    setDialogOpen(true);
  };

  const openEdit = (milestone: CalendarMilestone) => {
    if (!canEdit) return;
    setEditing(milestone);
    setSelectedDate(milestone.date);
    setDialogOpen(true);
  };

  const navigate = (dir: "prev" | "next") => {
    if (view === "month") {
      setCurrentDate(
        dir === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1)
      );
    } else {
      setWeekStart(
        dir === "prev" ? subWeeks(weekStart, 1) : addWeeks(weekStart, 1)
      );
    }
  };

  const monthGrid = getMonthGrid(currentDate);
  const weekDates = getWeekDates(weekStart);

  return (
    <div className="page-stack">
      <PageHeader
        icon={CalendarIcon}
        iconClassName="bg-emerald-500/10 text-emerald-600 ring-emerald-500/15"
        title="일정 관리"
        description={
          canEdit
            ? "날짜 클릭 → 일정 등록 · UI팀 관리 일정만 보라색"
            : "공유된 일정만 조회"
        }
      >
        {!isExternal && <GlobalProjectFilter />}
        {canEdit && (
          <Button
            size="sm"
            onClick={() => openCreate(new Date())}
            className="shadow-sm shadow-primary/20"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            일정 등록
          </Button>
        )}
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "month" | "week")}
        >
          <TabsList className="h-8">
            <TabsTrigger value="month" className="text-xs">
              월간
            </TabsTrigger>
            <TabsTrigger value="week" className="text-xs">
              주간
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded border border-primary/20 bg-primary/10" />
          일반 일정
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded border border-violet-200 bg-violet-100" />
          UI팀 관리
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded bg-red-50/80 ring-1 ring-red-100" />
          일요일
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-5 rounded bg-blue-50/80 ring-1 ring-blue-100" />
          토요일
        </span>
      </div>

      <Card className="glass-card border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <CalendarIcon className="h-4 w-4 text-primary" />
            {view === "month"
              ? format(currentDate, "yyyy년 M월", { locale: ko })
              : `${format(weekDates[0], "M/d")} ~ ${format(weekDates[4], "M/d")}`}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => navigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                setWeekStart(getWeekStart(today));
              }}
            >
              오늘
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => navigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {view === "month" ? (
            <div className="overflow-x-auto">
              <div className="grid min-w-[720px] grid-cols-7">
                {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                  <div
                    key={d}
                    className={cn(
                      "border-b border-border py-1.5 text-center text-xs font-semibold",
                      dayHeaderStyle(d)
                    )}
                  >
                    {d}
                  </div>
                ))}
                {monthGrid.flat().map((day) => {
                  const ms = getMilestonesForDate(day);
                  const inMonth = isInCurrentMonth(day, currentDate);
                  const today = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => openCreate(day)}
                      className={cn(
                        "min-h-[96px] border-b border-r border-border p-1 text-left transition-colors",
                        dayCellBackground(day, inMonth, today),
                        canEdit &&
                          "cursor-pointer hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset",
                        !canEdit && "cursor-default"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                          today &&
                            "bg-primary text-[11px] font-bold text-primary-foreground",
                          !inMonth && "text-muted-foreground",
                          inMonth &&
                            !today &&
                            getDay(day) === 0 &&
                            "font-semibold text-red-500",
                          inMonth &&
                            !today &&
                            getDay(day) === 6 &&
                            "font-semibold text-blue-600"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {ms.length === 0 && canEdit && inMonth && (
                          <p className="px-0.5 text-[9px] text-muted-foreground/45">
                            +
                          </p>
                        )}
                        {ms.map((m) => {
                          const project = m.projectId
                            ? getProjectById(m.projectId)
                            : undefined;
                          return (
                            <div
                              key={m.id}
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(m);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.stopPropagation();
                                  openEdit(m);
                                }
                              }}
                              className={cn(
                                "truncate rounded border px-1 py-0.5 text-[9px] font-medium",
                                milestoneStyle(m),
                                canEdit && "cursor-pointer hover:opacity-80"
                              )}
                              title={[
                                m.title,
                                project?.code,
                                m.description,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            >
                              {project?.code && (
                                <span className="font-numeric mr-0.5 opacity-75">
                                  [{project.code}]
                                </span>
                              )}
                              {m.title}
                            </div>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {WEEKDAYS.map((day, i) => {
                const date = weekDates[i];
                const ms = getMilestonesForDate(date);
                const today = isToday(date);
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => openCreate(date)}
                    className={cn(
                      "min-h-[120px] rounded-lg border p-2 text-left transition-colors",
                      today && "border-primary/30 bg-primary/5",
                      canEdit &&
                        "cursor-pointer hover:border-primary/25 hover:bg-primary/5",
                      !canEdit && "cursor-default"
                    )}
                  >
                    <p className="text-sm font-semibold">{WEEKDAY_LABELS[day]}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(date, "M/d")}
                    </p>
                    <div className="mt-1.5 space-y-1">
                      {ms.map((m) => (
                        <Badge
                          key={m.id}
                          variant="outline"
                          className={cn(
                            "block w-full truncate text-left text-[9px]",
                            milestoneStyle(m)
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(m);
                          }}
                        >
                          {m.title}
                        </Badge>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {visibleMilestones.length === 0 && (
            <div className="mt-4 rounded-lg border border-dashed border-border/80 bg-muted/15 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {canEdit
                  ? "등록된 일정이 없습니다 · 날짜를 클릭해 추가하세요"
                  : "공유된 일정이 없습니다"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <CalendarEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedDate={selectedDate}
        editing={editing}
      />
    </div>
  );
}
