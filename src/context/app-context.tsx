"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { filterIssuesForReport } from "@/lib/issue-utils";
import type { ScheduleTemplateId } from "@/lib/schedule-templates";
import { normalizeAllocatedMd } from "@/lib/project-md-utils";
import { generateShareToken } from "@/lib/meeting-utils";
import {
  apiFetch,
  getStoredUserId,
  setStoredUserId,
} from "@/lib/api-client";
import type { AppDataPayload } from "@/lib/db-mappers";
import type {
  User,
  UserRole,
  UserPart,
  Project,
  WeeklyTask,
  CalendarMilestone,
  MeetingNote,
  ProjectIssue,
  ProjectRemark,
  ProjectResourceLink,
  ScheduleRow,
  ScheduleNote,
  WorkPart,
  TaskType,
  TaskStatus,
} from "@/types";
import { USER_PART_TO_WORK } from "@/types";

export type MenuKey =
  | "projects"
  | "reports"
  | "calendar"
  | "md"
  | "accounts"
  | "meetings";

interface AppContextValue {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  weeklyTasks: WeeklyTask[];
  milestones: CalendarMilestone[];
  meetingNotes: MeetingNote[];
  projectIssues: ProjectIssue[];
  projectRemarks: ProjectRemark[];
  projectResourceLinks: ProjectResourceLink[];
  scheduleRows: ScheduleRow[];
  scheduleNotes: ScheduleNote[];
  isReady: boolean;
  loadError: string | null;
  meetingMode: boolean;
  projectFilter: string;
  setMeetingMode: (value: boolean) => void;
  setProjectFilter: (value: string) => void;
  login: (email: string, password: string) => Promise<User | null>;
  loginAs: (userId: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  addProject: (project: Omit<Project, "id">) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => void;
  addWeeklyTask: (task: Omit<WeeklyTask, "id">) => void;
  updateWeeklyTask: (id: string, data: Partial<WeeklyTask>) => void;
  deleteWeeklyTask: (id: string) => void;
  addMilestone: (milestone: Omit<CalendarMilestone, "id">) => CalendarMilestone;
  updateMilestone: (id: string, data: Partial<CalendarMilestone>) => void;
  deleteMilestone: (id: string) => void;
  canEditCalendar: () => boolean;
  addScheduleRow: (row: Omit<ScheduleRow, "id">) => ScheduleRow;
  updateScheduleRow: (id: string, data: Partial<ScheduleRow>) => void;
  deleteScheduleRow: (id: string) => void;
  getScheduleRowsByProject: (projectId: string) => ScheduleRow[];
  setScheduleRowsForProject: (projectId: string, rows: ScheduleRow[]) => void;
  applyScheduleTemplate: (
    projectId: string,
    templateId: ScheduleTemplateId,
    anchorDate: string
  ) => void;
  addScheduleNote: (note: Omit<ScheduleNote, "id">) => ScheduleNote;
  updateScheduleNote: (id: string, data: Partial<ScheduleNote>) => void;
  deleteScheduleNote: (id: string) => void;
  getScheduleNotesByProject: (projectId: string) => ScheduleNote[];
  addProjectIssue: (issue: Omit<ProjectIssue, "id" | "weekStart" | "userId">) => void;
  updateProjectIssue: (
    id: string,
    data: Partial<Pick<ProjectIssue, "status" | "content" | "weekStart">>
  ) => void;
  getIssuesByProject: (projectId: string) => ProjectIssue[];
  getIssuesByWeek: (reportWeekStart: string) => ProjectIssue[];
  addProjectRemark: (remark: Omit<ProjectRemark, "id" | "userId">) => void;
  getRemarksByProject: (projectId: string) => ProjectRemark[];
  getRemarksByWeek: (weekStart: string) => ProjectRemark[];
  addProjectResourceLink: (
    link: Omit<ProjectResourceLink, "id" | "userId">
  ) => void;
  deleteProjectResourceLink: (id: string) => void;
  getResourceLinksByProject: (projectId: string) => ProjectResourceLink[];
  canEditPartLinks: (part: WorkPart) => boolean;
  addMeetingNote: (
    note: Omit<MeetingNote, "id" | "authorId" | "shareToken">
  ) => Promise<MeetingNote>;
  updateMeetingNote: (id: string, data: Partial<MeetingNote>) => void;
  deleteMeetingNote: (id: string) => void;
  getMeetingNoteByShareToken: (token: string) => MeetingNote | undefined;
  setMeetingNoteLinkShare: (id: string, enabled: boolean) => void;
  canEditMeetingNote: () => boolean;
  addUser: (user: Omit<User, "id">) => void;
  updateUser: (
    id: string,
    data: Partial<Pick<User, "name" | "email" | "role" | "part">> & {
      password?: string;
    }
  ) => void;
  deleteUser: (id: string) => void;
  updateUserRole: (id: string, role: UserRole) => void;
  updateUserPart: (id: string, part: UserPart) => void;
  getUserById: (id: string) => User | undefined;
  getProjectById: (id: string) => Project | undefined;
  getProjectByScheduleShareToken: (token: string) => Project | undefined;
  setProjectScheduleLinkShare: (projectId: string, enabled: boolean) => void;
  filteredProjects: Project[];
  filteredWeeklyTasks: WeeklyTask[];
  canAccess: (menu: MenuKey) => boolean;
  canEditProject: () => boolean;
  canEditAssignee: () => boolean;
  canViewAllReports: () => boolean;
  canEditTask: (userId: string) => boolean;
  canAddIssue: () => boolean;
  canManageAccounts: () => boolean;
  canMasterManageUsers: () => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const MENU_ACCESS: Record<UserRole, MenuKey[]> = {
  MASTER: ["projects", "reports", "calendar", "md", "accounts", "meetings"],
  LEADER: ["projects", "reports", "calendar", "md", "accounts", "meetings"],
  MEMBER: ["projects", "reports", "calendar", "md", "meetings"],
  EXTERNAL: ["calendar"],
};

const STAFF_ROLES: UserRole[] = ["MASTER", "LEADER", "MEMBER"];

function isStaffRole(role: UserRole | undefined): role is UserRole {
  return !!role && STAFF_ROLES.includes(role);
}

function applyData(setters: {
  setUsers: (v: User[]) => void;
  setProjects: (v: Project[]) => void;
  setWeeklyTasks: (v: WeeklyTask[]) => void;
  setMilestones: (v: CalendarMilestone[]) => void;
  setMeetingNotes: (v: MeetingNote[]) => void;
  setProjectIssues: (v: ProjectIssue[]) => void;
  setProjectRemarks: (v: ProjectRemark[]) => void;
  setProjectResourceLinks: (v: ProjectResourceLink[]) => void;
  setScheduleRows: (v: ScheduleRow[]) => void;
  setScheduleNotes: (v: ScheduleNote[]) => void;
}) {
  return (data: AppDataPayload) => {
    setters.setUsers(data.users);
    setters.setProjects(data.projects);
    setters.setWeeklyTasks(data.weeklyTasks);
    setters.setMilestones(data.milestones);
    setters.setMeetingNotes(data.meetingNotes);
    setters.setProjectIssues(data.projectIssues);
    setters.setProjectRemarks(data.projectRemarks);
    setters.setProjectResourceLinks(data.projectResourceLinks);
    setters.setScheduleRows(data.scheduleRows);
    setters.setScheduleNotes(data.scheduleNotes);
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isShareRoute = pathname?.startsWith("/share") ?? false;
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTask[]>([]);
  const [milestones, setMilestones] = useState<CalendarMilestone[]>([]);
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);
  const [projectIssues, setProjectIssues] = useState<ProjectIssue[]>([]);
  const [projectRemarks, setProjectRemarks] = useState<ProjectRemark[]>([]);
  const [projectResourceLinks, setProjectResourceLinks] = useState<
    ProjectResourceLink[]
  >([]);
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);
  const [scheduleNotes, setScheduleNotes] = useState<ScheduleNote[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [meetingMode, setMeetingMode] = useState(false);
  const [projectFilter, setProjectFilter] = useState("all");

  const hydrateData = applyData({
    setUsers,
    setProjects,
    setWeeklyTasks,
    setMilestones,
    setMeetingNotes,
    setProjectIssues,
    setProjectRemarks,
    setProjectResourceLinks,
    setScheduleRows,
    setScheduleNotes,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<AppDataPayload>("/api/data");
        if (cancelled) return;
        hydrateData(data);
        const storedId = getStoredUserId();
        if (storedId) {
          const user = data.users.find((u) => u.id === storedId);
          if (user) setCurrentUser(user);
        }
        setLoadError(null);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "데이터를 불러오지 못했습니다");
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { user } = await apiFetch<{ user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setCurrentUser(user);
      setStoredUserId(user.id);
      return user;
    } catch {
      return null;
    }
  }, []);

  const loginAs = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (user) {
        setCurrentUser(user);
        setStoredUserId(user.id);
      }
    },
    [users]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setStoredUserId(null);
    setMeetingMode(false);
    setProjectFilter("all");
  }, []);

  const switchRole = useCallback(
    (role: UserRole) => {
      const user = users.find((u) => u.role === role);
      if (user) {
        setCurrentUser(user);
        setStoredUserId(user.id);
      }
    },
    [users]
  );

  const addProject = useCallback((project: Omit<Project, "id">) => {
    const payload = {
      ...project,
      allocatedMd: normalizeAllocatedMd(project.allocatedMd),
    };
    return apiFetch<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }).then((created) => {
      setProjects((prev) => [...prev, created]);
      return created;
    });
  }, []);

  const updateProject = useCallback((id: string, data: Partial<Project>) => {
    return apiFetch<Project>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }).then((updated) => {
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    void apiFetch(`/api/projects/${id}`, { method: "DELETE" });
  }, []);

  const addWeeklyTask = useCallback((task: Omit<WeeklyTask, "id">) => {
    void apiFetch<WeeklyTask>("/api/weekly-tasks", {
      method: "POST",
      body: JSON.stringify(task),
    }).then((created) => setWeeklyTasks((prev) => [...prev, created]));
  }, []);

  const updateWeeklyTask = useCallback(
    (id: string, data: Partial<WeeklyTask>) => {
      setWeeklyTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
      void apiFetch<WeeklyTask>(`/api/weekly-tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }).then((updated) =>
        setWeeklyTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
      );
    },
    []
  );

  const deleteWeeklyTask = useCallback((id: string) => {
    setWeeklyTasks((prev) => prev.filter((t) => t.id !== id));
    void apiFetch(`/api/weekly-tasks/${id}`, { method: "DELETE" });
  }, []);

  const addMilestone = useCallback((milestone: Omit<CalendarMilestone, "id">) => {
    const temp: CalendarMilestone = { ...milestone, id: `temp-${Date.now()}` };
    setMilestones((prev) => [...prev, temp]);
    void apiFetch<CalendarMilestone>("/api/milestones", {
      method: "POST",
      body: JSON.stringify(milestone),
    }).then((created) =>
      setMilestones((prev) =>
        prev.map((m) => (m.id === temp.id ? created : m))
      )
    );
    return temp;
  }, []);

  const updateMilestone = useCallback(
    (id: string, data: Partial<CalendarMilestone>) => {
      setMilestones((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...data } : m))
      );
      void apiFetch<CalendarMilestone>(`/api/milestones/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }).then((updated) =>
        setMilestones((prev) => prev.map((m) => (m.id === id ? updated : m)))
      );
    },
    []
  );

  const deleteMilestone = useCallback((id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    void apiFetch(`/api/milestones/${id}`, { method: "DELETE" });
  }, []);

  const canEditCalendar = useCallback(() => {
    if (!currentUser) return false;
    return currentUser.role !== "EXTERNAL";
  }, [currentUser]);

  const addScheduleRow = useCallback((row: Omit<ScheduleRow, "id">) => {
    const temp: ScheduleRow = { ...row, id: `temp-${Date.now()}` };
    setScheduleRows((prev) => [...prev, temp]);
    void apiFetch<ScheduleRow>("/api/schedule-rows", {
      method: "POST",
      body: JSON.stringify(row),
    }).then((created) =>
      setScheduleRows((prev) =>
        prev.map((r) => (r.id === temp.id ? created : r))
      )
    );
    return temp;
  }, []);

  const updateScheduleRow = useCallback(
    (id: string, data: Partial<ScheduleRow>) => {
      setScheduleRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data } : r))
      );
      void apiFetch<ScheduleRow>(`/api/schedule-rows/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }).then((updated) =>
        setScheduleRows((prev) => prev.map((r) => (r.id === id ? updated : r)))
      );
    },
    []
  );

  const deleteScheduleRow = useCallback((id: string) => {
    setScheduleRows((prev) => prev.filter((r) => r.id !== id));
    void apiFetch(`/api/schedule-rows/${id}`, { method: "DELETE" });
  }, []);

  const getScheduleRowsByProject = useCallback(
    (projectId: string) =>
      scheduleRows
        .filter((r) => r.projectId === projectId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [scheduleRows]
  );

  const setScheduleRowsForProject = useCallback(
    (projectId: string, rows: ScheduleRow[]) => {
      setScheduleRows((prev) => [
        ...prev.filter((row) => row.projectId !== projectId),
        ...rows,
      ]);
    },
    []
  );

  const applyScheduleTemplate = useCallback(
    (projectId: string, templateId: ScheduleTemplateId, anchorDate: string) => {
      void apiFetch<ScheduleRow[]>("/api/schedule-rows/template", {
        method: "POST",
        body: JSON.stringify({ projectId, templateId, anchorDate }),
      }).then((created) => setScheduleRows((prev) => [...prev, ...created]));
    },
    []
  );

  const addScheduleNote = useCallback((note: Omit<ScheduleNote, "id">) => {
    const temp: ScheduleNote = { ...note, id: `temp-${Date.now()}` };
    setScheduleNotes((prev) => [...prev, temp]);
    void apiFetch<ScheduleNote>("/api/schedule-notes", {
      method: "POST",
      body: JSON.stringify(note),
    }).then((created) =>
      setScheduleNotes((prev) =>
        prev.map((n) => (n.id === temp.id ? created : n))
      )
    );
    return temp;
  }, []);

  const updateScheduleNote = useCallback(
    (id: string, data: Partial<ScheduleNote>) => {
      setScheduleNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...data } : n))
      );
      void apiFetch<ScheduleNote>(`/api/schedule-notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }).then((updated) =>
        setScheduleNotes((prev) => prev.map((n) => (n.id === id ? updated : n)))
      );
    },
    []
  );

  const deleteScheduleNote = useCallback((id: string) => {
    setScheduleNotes((prev) => prev.filter((n) => n.id !== id));
    void apiFetch(`/api/schedule-notes/${id}`, { method: "DELETE" });
  }, []);

  const getScheduleNotesByProject = useCallback(
    (projectId: string) =>
      scheduleNotes
        .filter((n) => n.projectId === projectId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [scheduleNotes]
  );

  const addProjectIssue = useCallback(
    (issue: Omit<ProjectIssue, "id" | "weekStart" | "userId">) => {
      if (!currentUser) return;
      void apiFetch<ProjectIssue>("/api/project-issues", {
        method: "POST",
        body: JSON.stringify({ ...issue, userId: currentUser.id }),
      }).then((created) => setProjectIssues((prev) => [...prev, created]));
    },
    [currentUser]
  );

  const updateProjectIssue = useCallback(
    (
      id: string,
      data: Partial<Pick<ProjectIssue, "status" | "content" | "weekStart">>
    ) => {
      setProjectIssues((prev) =>
        prev.map((issue) => (issue.id === id ? { ...issue, ...data } : issue))
      );
      void apiFetch<ProjectIssue>(`/api/project-issues/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }).then((updated) =>
        setProjectIssues((prev) =>
          prev.map((issue) => (issue.id === id ? updated : issue))
        )
      );
    },
    []
  );

  const getIssuesByProject = useCallback(
    (projectId: string) =>
      projectIssues
        .filter((i) => i.projectId === projectId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [projectIssues]
  );

  const getIssuesByWeek = useCallback(
    (reportWeekStart: string) =>
      filterIssuesForReport(projectIssues, reportWeekStart).sort((a, b) => {
        if (a.status !== b.status) return a.status === "진행" ? -1 : 1;
        return b.date.localeCompare(a.date);
      }),
    [projectIssues]
  );

  const addProjectRemark = useCallback(
    (remark: Omit<ProjectRemark, "id" | "userId">) => {
      if (!currentUser) return;
      void apiFetch<ProjectRemark>("/api/project-remarks", {
        method: "POST",
        body: JSON.stringify({ ...remark, userId: currentUser.id }),
      }).then((created) => setProjectRemarks((prev) => [...prev, created]));
    },
    [currentUser]
  );

  const getRemarksByProject = useCallback(
    (projectId: string) =>
      projectRemarks
        .filter((r) => r.projectId === projectId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [projectRemarks]
  );

  const getRemarksByWeek = useCallback(
    (weekStart: string) =>
      projectRemarks
        .filter((r) => r.weekStart === weekStart)
        .sort((a, b) => a.projectId.localeCompare(b.projectId)),
    [projectRemarks]
  );

  const addProjectResourceLink = useCallback(
    (link: Omit<ProjectResourceLink, "id" | "userId">) => {
      if (!currentUser) return;
      void apiFetch<ProjectResourceLink>("/api/project-resource-links", {
        method: "POST",
        body: JSON.stringify({ ...link, userId: currentUser.id }),
      }).then((created) =>
        setProjectResourceLinks((prev) => [...prev, created])
      );
    },
    [currentUser]
  );

  const deleteProjectResourceLink = useCallback((id: string) => {
    setProjectResourceLinks((prev) => prev.filter((l) => l.id !== id));
    void apiFetch(`/api/project-resource-links/${id}`, { method: "DELETE" });
  }, []);

  const getResourceLinksByProject = useCallback(
    (projectId: string) =>
      projectResourceLinks
        .filter((l) => l.projectId === projectId)
        .sort((a, b) => a.part.localeCompare(b.part) || a.label.localeCompare(b.label)),
    [projectResourceLinks]
  );

  const canEditPartLinks = useCallback(
    (part: WorkPart) => {
      if (!currentUser) return false;
      if (currentUser.role === "EXTERNAL") return false;
      if (isStaffRole(currentUser.role)) return true;
      return USER_PART_TO_WORK[currentUser.part] === part;
    },
    [currentUser]
  );

  const addMeetingNote = useCallback(
    (note: Omit<MeetingNote, "id" | "authorId" | "shareToken">) => {
      if (!currentUser) {
        return Promise.reject(new Error("로그인이 필요합니다"));
      }
      return apiFetch<MeetingNote>("/api/meeting-notes", {
        method: "POST",
        body: JSON.stringify({ ...note, authorId: currentUser.id }),
      }).then((created) => {
        setMeetingNotes((prev) => [...prev, created]);
        return created;
      });
    },
    [currentUser]
  );

  const updateMeetingNote = useCallback(
    (id: string, data: Partial<MeetingNote>) => {
      setMeetingNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...data } : n))
      );
      void apiFetch<MeetingNote>(`/api/meeting-notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }).then((updated) =>
        setMeetingNotes((prev) => prev.map((n) => (n.id === id ? updated : n)))
      );
    },
    []
  );

  const deleteMeetingNote = useCallback((id: string) => {
    setMeetingNotes((prev) => prev.filter((n) => n.id !== id));
    void apiFetch(`/api/meeting-notes/${id}`, { method: "DELETE" });
  }, []);

  const getMeetingNoteByShareToken = useCallback(
    (token: string) => {
      const note = meetingNotes.find((n) => n.shareToken === token);
      if (!note?.linkShareEnabled) return undefined;
      return note;
    },
    [meetingNotes]
  );

  const setMeetingNoteLinkShare = useCallback((id: string, enabled: boolean) => {
    updateMeetingNote(id, { linkShareEnabled: enabled });
  }, [updateMeetingNote]);

  const canEditMeetingNote = useCallback(() => {
    if (!currentUser) return false;
    return currentUser.role !== "EXTERNAL";
  }, [currentUser]);

  const addUser = useCallback((user: Omit<User, "id">) => {
    void apiFetch<User>("/api/users", {
      method: "POST",
      body: JSON.stringify(user),
    }).then((created) => setUsers((prev) => [...prev, created]));
  }, []);

  const applyUserUpdate = useCallback((id: string, updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    setCurrentUser((prev) => (prev?.id === id ? updated : prev));
  }, []);

  const updateUser = useCallback(
    (
      id: string,
      data: Partial<Pick<User, "name" | "email" | "role" | "part">> & {
        password?: string;
      }
    ) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...data, password: "" } : u))
      );
      void apiFetch<User>(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      })
        .then((updated) => applyUserUpdate(id, updated))
        .catch(() => {
          void apiFetch<AppDataPayload>("/api/data").then(hydrateData);
        });
    },
    [applyUserUpdate, hydrateData]
  );

  const deleteUser = useCallback(
    (id: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      if (currentUser?.id === id) {
        setCurrentUser(null);
        setStoredUserId(null);
      }
      void apiFetch(`/api/users/${id}`, { method: "DELETE" }).catch(() => {
        void apiFetch<AppDataPayload>("/api/data").then(hydrateData);
      });
    },
    [currentUser, hydrateData]
  );

  const updateUserRole = useCallback((id: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    setCurrentUser((prev) => (prev?.id === id ? { ...prev, role } : prev));
    void apiFetch<User>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }).then((updated) => {
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setCurrentUser((prev) => (prev?.id === id ? updated : prev));
    });
  }, []);

  const updateUserPart = useCallback((id: string, part: UserPart) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, part } : u)));
    setCurrentUser((prev) => (prev?.id === id ? { ...prev, part } : prev));
    void apiFetch<User>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ part }),
    }).then((updated) => {
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setCurrentUser((prev) => (prev?.id === id ? updated : prev));
    });
  }, []);

  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  );

  const getProjectById = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects]
  );

  const getProjectByScheduleShareToken = useCallback(
    (token: string) => {
      const project = projects.find((p) => p.scheduleShareToken === token);
      if (!project?.scheduleLinkShareEnabled) return undefined;
      return project;
    },
    [projects]
  );

  const setProjectScheduleLinkShare = useCallback(
    (projectId: string, enabled: boolean) => {
      const project = projects.find((p) => p.id === projectId);
      const token = project?.scheduleShareToken ?? generateShareToken();
      updateProject(projectId, {
        scheduleShareToken: token,
        scheduleLinkShareEnabled: enabled,
      });
    },
    [projects, updateProject]
  );

  const filteredProjects = useMemo(() => {
    if (projectFilter === "all") return projects;
    return projects.filter((p) => p.id === projectFilter);
  }, [projects, projectFilter]);

  const filteredWeeklyTasks = useMemo(() => {
    if (projectFilter === "all") return weeklyTasks;
    return weeklyTasks.filter((t) => t.projectId === projectFilter);
  }, [weeklyTasks, projectFilter]);

  const canAccess = useCallback(
    (menu: MenuKey) => {
      if (!currentUser) return false;
      return MENU_ACCESS[currentUser.role].includes(menu);
    },
    [currentUser]
  );

  const canEditProject = useCallback(() => {
    if (!currentUser) return false;
    return isStaffRole(currentUser.role);
  }, [currentUser]);

  const canViewAllReports = useCallback(() => {
    if (!currentUser) return false;
    return isStaffRole(currentUser.role);
  }, [currentUser]);

  const canEditTask = useCallback(
    (userId: string) => {
      if (!currentUser) return false;
      if (isStaffRole(currentUser.role)) return true;
      return currentUser.id === userId;
    },
    [currentUser]
  );

  const canEditAssignee = useCallback(() => {
    if (!currentUser) return false;
    return isStaffRole(currentUser.role);
  }, [currentUser]);

  const canManageAccounts = useCallback(() => {
    if (!currentUser) return false;
    return ["MASTER", "LEADER"].includes(currentUser.role);
  }, [currentUser]);

  const canMasterManageUsers = useCallback(() => {
    if (!currentUser) return false;
    return currentUser.role === "MASTER";
  }, [currentUser]);

  const canAddIssue = useCallback(() => {
    if (!currentUser) return false;
    return currentUser.role !== "EXTERNAL";
  }, [currentUser]);

  const value = useMemo(
    () => ({
      currentUser,
      users,
      projects,
      weeklyTasks,
      milestones,
      meetingNotes,
      projectIssues,
      projectRemarks,
      projectResourceLinks,
      scheduleRows,
      scheduleNotes,
      isReady,
      loadError,
      meetingMode,
      projectFilter,
      setMeetingMode,
      setProjectFilter,
      login,
      loginAs,
      logout,
      switchRole,
      addProject,
      updateProject,
      deleteProject,
      addWeeklyTask,
      updateWeeklyTask,
      deleteWeeklyTask,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      canEditCalendar,
      addScheduleRow,
      updateScheduleRow,
      deleteScheduleRow,
      getScheduleRowsByProject,
      setScheduleRowsForProject,
      applyScheduleTemplate,
      addScheduleNote,
      updateScheduleNote,
      deleteScheduleNote,
      getScheduleNotesByProject,
      addProjectIssue,
      updateProjectIssue,
      getIssuesByProject,
      getIssuesByWeek,
      addProjectRemark,
      getRemarksByProject,
      getRemarksByWeek,
      addProjectResourceLink,
      deleteProjectResourceLink,
      getResourceLinksByProject,
      canEditPartLinks,
      addMeetingNote,
      updateMeetingNote,
      deleteMeetingNote,
      getMeetingNoteByShareToken,
      setMeetingNoteLinkShare,
      canEditMeetingNote,
      addUser,
      updateUser,
      deleteUser,
      updateUserRole,
      updateUserPart,
      getUserById,
      getProjectById,
      getProjectByScheduleShareToken,
      setProjectScheduleLinkShare,
      filteredProjects,
      filteredWeeklyTasks,
      canAccess,
      canEditProject,
      canEditAssignee,
      canViewAllReports,
      canEditTask,
      canAddIssue,
      canManageAccounts,
      canMasterManageUsers,
    }),
    [
      currentUser,
      users,
      projects,
      weeklyTasks,
      milestones,
      meetingNotes,
      projectIssues,
      projectRemarks,
      projectResourceLinks,
      scheduleRows,
      scheduleNotes,
      isReady,
      loadError,
      meetingMode,
      projectFilter,
      login,
      loginAs,
      logout,
      switchRole,
      addProject,
      updateProject,
      deleteProject,
      addWeeklyTask,
      updateWeeklyTask,
      deleteWeeklyTask,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      canEditCalendar,
      addScheduleRow,
      updateScheduleRow,
      deleteScheduleRow,
      getScheduleRowsByProject,
      setScheduleRowsForProject,
      applyScheduleTemplate,
      addScheduleNote,
      updateScheduleNote,
      deleteScheduleNote,
      getScheduleNotesByProject,
      addProjectIssue,
      updateProjectIssue,
      getIssuesByProject,
      getIssuesByWeek,
      addProjectRemark,
      getRemarksByProject,
      getRemarksByWeek,
      addProjectResourceLink,
      deleteProjectResourceLink,
      getResourceLinksByProject,
      canEditPartLinks,
      addMeetingNote,
      updateMeetingNote,
      deleteMeetingNote,
      getMeetingNoteByShareToken,
      setMeetingNoteLinkShare,
      canEditMeetingNote,
      addUser,
      updateUser,
      deleteUser,
      updateUserRole,
      updateUserPart,
      getUserById,
      getProjectById,
      getProjectByScheduleShareToken,
      setProjectScheduleLinkShare,
      filteredProjects,
      filteredWeeklyTasks,
      canAccess,
      canEditProject,
      canEditAssignee,
      canViewAllReports,
      canEditTask,
      canAddIssue,
      canManageAccounts,
      canMasterManageUsers,
    ]
  );

  if (!isReady && !isShareRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (loadError && !isShareRoute) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-lg font-semibold text-destructive">DB 연결 실패</p>
        <p className="max-w-md text-sm text-muted-foreground">{loadError}</p>
        <p className="text-xs text-muted-foreground">
          .env 의 DATABASE_URL 과 DB 서버 상태를 확인하세요.
        </p>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export type { WorkPart, TaskType, TaskStatus };
