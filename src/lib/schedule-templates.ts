import { addWeeks, format, parseISO } from "date-fns";
import type { ScheduleRow, WorkPart } from "@/types";

export type ScheduleTemplateId = "mobile" | "pc-web";

export interface ScheduleTemplateItem {
  part: WorkPart;
  taskName: string;
  startWeekOffset: number;
  durationWeeks: number;
}

export const SCHEDULE_TEMPLATES: Record<
  ScheduleTemplateId,
  { service: string; items: ScheduleTemplateItem[] }
> = {
  mobile: {
    service: "Mobile",
    items: [
      { part: "기획", taskName: "분석", startWeekOffset: 0, durationWeeks: 1 },
      {
        part: "기획",
        taskName: "메인/공통 설계",
        startWeekOffset: 1,
        durationWeeks: 2,
      },
      {
        part: "기획",
        taskName: "상세설계",
        startWeekOffset: 3,
        durationWeeks: 2,
      },
      { part: "기획", taskName: "수정", startWeekOffset: 5, durationWeeks: 1 },
      { part: "기획", taskName: "검수", startWeekOffset: 6, durationWeeks: 1 },
      { part: "디자인", taskName: "메인", startWeekOffset: 2, durationWeeks: 2 },
      {
        part: "디자인",
        taskName: "콘텐츠",
        startWeekOffset: 4,
        durationWeeks: 2,
      },
      { part: "디자인", taskName: "수정", startWeekOffset: 6, durationWeeks: 1 },
      { part: "디자인", taskName: "검수", startWeekOffset: 7, durationWeeks: 1 },
      {
        part: "퍼블리싱",
        taskName: "공통/메인",
        startWeekOffset: 5,
        durationWeeks: 2,
      },
      {
        part: "퍼블리싱",
        taskName: "수정",
        startWeekOffset: 7,
        durationWeeks: 1,
      },
      {
        part: "퍼블리싱",
        taskName: "검수",
        startWeekOffset: 8,
        durationWeeks: 1,
      },
    ],
  },
  "pc-web": {
    service: "PC Web",
    items: [
      {
        part: "기획",
        taskName: "공통 설계",
        startWeekOffset: 0,
        durationWeeks: 2,
      },
      {
        part: "기획",
        taskName: "상세설계",
        startWeekOffset: 2,
        durationWeeks: 2,
      },
      { part: "기획", taskName: "수정/개선", startWeekOffset: 4, durationWeeks: 1 },
      { part: "기획", taskName: "검수", startWeekOffset: 5, durationWeeks: 1 },
      { part: "디자인", taskName: "메인", startWeekOffset: 2, durationWeeks: 2 },
      {
        part: "디자인",
        taskName: "콘텐츠",
        startWeekOffset: 4,
        durationWeeks: 2,
      },
      { part: "디자인", taskName: "수정/개선", startWeekOffset: 6, durationWeeks: 1 },
      { part: "디자인", taskName: "검수", startWeekOffset: 7, durationWeeks: 1 },
      {
        part: "퍼블리싱",
        taskName: "공통/메인",
        startWeekOffset: 5,
        durationWeeks: 2,
      },
      {
        part: "퍼블리싱",
        taskName: "수정",
        startWeekOffset: 7,
        durationWeeks: 1,
      },
      {
        part: "퍼블리싱",
        taskName: "검수",
        startWeekOffset: 8,
        durationWeeks: 1,
      },
    ],
  },
};

export const SCHEDULE_TEMPLATE_LABELS: Record<ScheduleTemplateId, string> = {
  mobile: "Mobile WBS",
  "pc-web": "PC Web WBS",
};

export function buildRowsFromTemplate(
  projectId: string,
  templateId: ScheduleTemplateId,
  anchorDate: string,
  startSortOrder = 0
): Omit<ScheduleRow, "id">[] {
  const template = SCHEDULE_TEMPLATES[templateId];
  const anchor = parseISO(anchorDate);

  return template.items.map((item, index) => {
    const start = addWeeks(anchor, item.startWeekOffset);
    const end = addWeeks(start, item.durationWeeks - 1);
    return {
      projectId,
      service: template.service,
      part: item.part,
      taskName: item.taskName,
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
      sortOrder: startSortOrder + index,
    };
  });
}
