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
} from "date-fns";
import { ko } from "date-fns/locale";
import { useApp } from "@/context/app-context";
import {
  CALENDAR_EVENT_LABELS,
  type CalendarEventType,
  type CalendarMilestone,
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
import { CalendarEventDialog } from "@/components/calendar/calendar-event-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MILESTONE_STYLES: Record<CalendarEventType, string> = {
  "draft-deadline": "bg-emerald-100 text-emerald-800 border-emerald-200",
  report: "bg-blue-100 text-blue-800 border-blue-200",
  general: "bg-slate-100 text-slate-700 border-slate-200",
};

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
    <div className="space-y-6">
      <PageHeader
        icon={CalendarIcon}
        iconClassName="bg-emerald-500/10 text-emerald-600 ring-emerald-500/15"
        title="일정 관리"
        description={
          canEdit
            ? "날짜를 클릭하면 일정 등록 팝업이 열립니다 · 등록한 일정만 표시됩니다"
            : "공유된 일정만 조회할 수 있습니다"
        }
      >
        {!isExternal && <GlobalProjectFilter />}
        {canEdit && (
          <Button
            onClick={() => openCreate(new Date())}
            className="shadow-sm shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            일정 등록
          </Button>
        )}
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "month" | "week")}
        >
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
              <Badge
                variant="outline"
                className={cn("text-[10px]", MILESTONE_STYLES[type])}
              >
                {CALENDAR_EVENT_LABELS[type]}
              </Badge>
            </div>
          )
        )}
      </div>

      <Card className="glass-card border-0">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="flex items-center gap-2 font-display text-lg">
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
                const today = new Date();
                setCurrentDate(today);
                setWeekStart(getWeekStart(today));
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
                  const inMonth = isInCurrentMonth(day, currentDate);
                  const today = isToday(day);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => openCreate(day)}
                      className={cn(
                        "min-h-[120px] border-b border-r border-border p-1.5 text-left transition-colors",
                        !inMonth && "bg-muted/20",
                        today && "bg-primary/5",
                        canEdit &&
                          "cursor-pointer hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-inset",
                        !canEdit && "cursor-default"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                          today &&
                            "bg-primary font-bold text-primary-foreground",
                          !inMonth && "text-muted-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {ms.length === 0 && canEdit && inMonth && (
                          <p className="px-0.5 text-[10px] text-muted-foreground/50">
                            + 클릭하여 등록
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
                                "truncate rounded border px-1 py-0.5 text-[9px] font-medium transition-opacity hover:opacity-80",
                                MILESTONE_STYLES[m.type],
                                canEdit && "cursor-pointer"
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
                                <span className="font-numeric mr-0.5 opacity-80">
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
            <div className="grid grid-cols-5 gap-3">
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
                      "min-h-[140px] rounded-xl border p-3 text-left transition-colors",
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
                    <div className="mt-2 space-y-1">
                      {ms.length === 0 && canEdit && (
                        <p className="text-[10px] text-muted-foreground/50">
                          + 등록
                        </p>
                      )}
                      {ms.map((m) => (
                        <Badge
                          key={m.id}
                          variant="outline"
                          className={cn(
                            "block w-full truncate text-left text-[9px]",
                            MILESTONE_STYLES[m.type]
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
            <div className="mt-6 rounded-xl border border-dashed border-border/80 bg-muted/20 py-10 text-center">
              <CalendarIcon className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                {canEdit
                  ? "등록된 일정이 없습니다"
                  : "공유된 일정이 없습니다"}
              </p>
              {canEdit && (
                <p className="mt-1 text-xs text-muted-foreground/80">
                  달력 날짜를 클릭하거나 상단 「일정 등록」 버튼을 눌러 추가하세요
                </p>
              )}
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
