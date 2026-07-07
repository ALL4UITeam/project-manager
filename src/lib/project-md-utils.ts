import type {
  AllocatedMdPart,
  Project,
  ProjectAllocatedMd,
  WeeklyTask,
  WorkPart,
} from "@/types";
import {
  ALLOCATED_MD_PARTS,
  DEFAULT_ALLOCATED_MD,
  WORK_PARTS,
} from "@/types";

export function normalizeAllocatedMd(
  md?: Partial<ProjectAllocatedMd> | null
): ProjectAllocatedMd {
  return {
    기획: md?.기획 ?? 0,
    디자인: md?.디자인 ?? 0,
    퍼블리싱: md?.퍼블리싱 ?? 0,
    기타: md?.기타 ?? 0,
  };
}

export function normalizeProjectMdFields(project: Project): Project {
  return {
    ...project,
    allocatedMd: normalizeAllocatedMd(project.allocatedMd),
  };
}

export function sumAllocatedMd(md: ProjectAllocatedMd): number {
  return ALLOCATED_MD_PARTS.reduce((s, part) => s + md[part], 0);
}

export function getActualMdByPart(
  tasks: WeeklyTask[],
  projectId?: string
): Record<AllocatedMdPart, number> {
  const filtered = projectId
    ? tasks.filter((t) => t.projectId === projectId)
    : tasks;

  const byWorkPart = WORK_PARTS.reduce(
    (acc, part) => {
      acc[part] = filtered
        .filter((t) => t.part === part && t.taskType === "THIS_WEEK")
        .reduce((s, t) => s + t.md, 0);
      return acc;
    },
    {} as Record<WorkPart, number>
  );

  return {
    기획: byWorkPart["기획"],
    디자인: byWorkPart["디자인"],
    퍼블리싱: byWorkPart["퍼블리싱"],
    기타: 0,
  };
}

export function formatMdPair(actual: number, allocated: number): string {
  return `${actual.toFixed(1)} / ${allocated.toFixed(1)}`;
}

export function mdUsagePct(actual: number, allocated: number): number {
  if (allocated <= 0) return actual > 0 ? 100 : 0;
  return Math.min(100, (actual / allocated) * 100);
}
