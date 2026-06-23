"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  mockUsers,
  mockProjects,
  mockWeeklyTasks,
  mockMilestones,
  mockMeetingNotes,
  mockProjectIssues,
  mockProjectRemarks,
  mockProjectResourceLinks,
} from "@/data/mock-data";
import { getWeekStartFromDate } from "@/lib/week-utils";
import { generateShareToken } from "@/lib/meeting-utils";
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
  meetingMode: boolean;
  projectFilter: string;
  setMeetingMode: (value: boolean) => void;
  setProjectFilter: (value: string) => void;
  login: (email: string, password: string) => boolean;
  loginAs: (userId: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  addProject: (project: Omit<Project, "id">) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addWeeklyTask: (task: Omit<WeeklyTask, "id">) => void;
  updateWeeklyTask: (id: string, data: Partial<WeeklyTask>) => void;
  deleteWeeklyTask: (id: string) => void;
  addProjectIssue: (issue: Omit<ProjectIssue, "id" | "weekStart" | "userId">) => void;
  getIssuesByProject: (projectId: string) => ProjectIssue[];
  getIssuesByWeek: (weekStart: string) => ProjectIssue[];
  addProjectRemark: (remark: Omit<ProjectRemark, "id" | "userId">) => void;
  getRemarksByProject: (projectId: string) => ProjectRemark[];
  getRemarksByWeek: (weekStart: string) => ProjectRemark[];
  addProjectResourceLink: (
    link: Omit<ProjectResourceLink, "id">
  ) => void;
  deleteProjectResourceLink: (id: string) => void;
  getResourceLinksByProject: (projectId: string) => ProjectResourceLink[];
  canEditPartLinks: (part: WorkPart) => boolean;
  addMeetingNote: (
    note: Omit<MeetingNote, "id" | "authorId" | "shareToken">
  ) => MeetingNote;
  updateMeetingNote: (id: string, data: Partial<MeetingNote>) => void;
  deleteMeetingNote: (id: string) => void;
  getMeetingNoteByShareToken: (token: string) => MeetingNote | undefined;
  setMeetingNoteLinkShare: (id: string, enabled: boolean) => void;
  canEditMeetingNote: () => boolean;
  addUser: (user: Omit<User, "id">) => void;
  updateUserRole: (id: string, role: UserRole) => void;
  updateUserPart: (id: string, part: UserPart) => void;
  getUserById: (id: string) => User | undefined;
  getProjectById: (id: string) => Project | undefined;
  filteredProjects: Project[];
  filteredWeeklyTasks: WeeklyTask[];
  canAccess: (menu: MenuKey) => boolean;
  canEditProject: () => boolean;
  canEditAssignee: () => boolean;
  canViewAllReports: () => boolean;
  canEditTask: (userId: string) => boolean;
  canAddIssue: () => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

const MENU_ACCESS: Record<UserRole, MenuKey[]> = {
  MASTER: ["projects", "reports", "calendar", "md", "accounts", "meetings"],
  LEADER: ["projects", "reports", "calendar", "md", "meetings"],
  MEMBER: ["projects", "reports", "calendar"],
  EXTERNAL: ["calendar"],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [weeklyTasks, setWeeklyTasks] =
    useState<WeeklyTask[]>(mockWeeklyTasks);
  const [milestones] = useState<CalendarMilestone[]>(mockMilestones);
  const [meetingNotes, setMeetingNotes] =
    useState<MeetingNote[]>(mockMeetingNotes);
  const [projectIssues, setProjectIssues] =
    useState<ProjectIssue[]>(mockProjectIssues);
  const [projectRemarks, setProjectRemarks] =
    useState<ProjectRemark[]>(mockProjectRemarks);
  const [projectResourceLinks, setProjectResourceLinks] = useState<
    ProjectResourceLink[]
  >(mockProjectResourceLinks);
  const [meetingMode, setMeetingMode] = useState(false);
  const [projectFilter, setProjectFilter] = useState("all");

  const login = useCallback(
    (email: string, password: string) => {
      const user = users.find(
        (u) => u.email === email && u.password === password
      );
      if (user) {
        setCurrentUser(user);
        return true;
      }
      return false;
    },
    [users]
  );

  const loginAs = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (user) setCurrentUser(user);
    },
    [users]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    setMeetingMode(false);
    setProjectFilter("all");
  }, []);

  const switchRole = useCallback(
    (role: UserRole) => {
      const user = users.find((u) => u.role === role);
      if (user) setCurrentUser(user);
    },
    [users]
  );

  const addProject = useCallback((project: Omit<Project, "id">) => {
    setProjects((prev) => [
      ...prev,
      { ...project, id: `p-${Date.now()}` },
    ]);
  }, []);

  const updateProject = useCallback((id: string, data: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addWeeklyTask = useCallback((task: Omit<WeeklyTask, "id">) => {
    setWeeklyTasks((prev) => [
      ...prev,
      { ...task, id: `t-${Date.now()}` },
    ]);
  }, []);

  const updateWeeklyTask = useCallback(
    (id: string, data: Partial<WeeklyTask>) => {
      setWeeklyTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
    },
    []
  );

  const deleteWeeklyTask = useCallback((id: string) => {
    setWeeklyTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addProjectIssue = useCallback(
    (issue: Omit<ProjectIssue, "id" | "weekStart" | "userId">) => {
      if (!currentUser) return;
      const weekStart = getWeekStartFromDate(issue.date);
      setProjectIssues((prev) => [
        ...prev,
        {
          ...issue,
          id: `i-${Date.now()}`,
          userId: currentUser.id,
          weekStart,
        },
      ]);
    },
    [currentUser]
  );

  const getIssuesByProject = useCallback(
    (projectId: string) =>
      projectIssues
        .filter((i) => i.projectId === projectId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [projectIssues]
  );

  const getIssuesByWeek = useCallback(
    (weekStart: string) =>
      projectIssues
        .filter((i) => i.weekStart === weekStart)
        .sort((a, b) => a.projectId.localeCompare(b.projectId)),
    [projectIssues]
  );

  const addProjectRemark = useCallback(
    (remark: Omit<ProjectRemark, "id" | "userId">) => {
      if (!currentUser) return;
      setProjectRemarks((prev) => [
        ...prev,
        {
          ...remark,
          id: `r-${Date.now()}`,
          userId: currentUser.id,
        },
      ]);
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
    (link: Omit<ProjectResourceLink, "id">) => {
      setProjectResourceLinks((prev) => [
        ...prev,
        { ...link, id: `lnk-${Date.now()}` },
      ]);
    },
    []
  );

  const deleteProjectResourceLink = useCallback((id: string) => {
    setProjectResourceLinks((prev) => prev.filter((l) => l.id !== id));
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
      if (["MASTER", "LEADER"].includes(currentUser.role)) return true;
      return USER_PART_TO_WORK[currentUser.part] === part;
    },
    [currentUser]
  );

  const addMeetingNote = useCallback(
    (note: Omit<MeetingNote, "id" | "authorId" | "shareToken">) => {
      if (!currentUser) {
        throw new Error("로그인이 필요합니다");
      }
      const created: MeetingNote = {
        ...note,
        id: `mn-${Date.now()}`,
        authorId: currentUser.id,
        shareToken: generateShareToken(),
      };
      setMeetingNotes((prev) => [...prev, created]);
      return created;
    },
    [currentUser]
  );

  const updateMeetingNote = useCallback(
    (id: string, data: Partial<MeetingNote>) => {
      setMeetingNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...data } : n))
      );
    },
    []
  );

  const deleteMeetingNote = useCallback((id: string) => {
    setMeetingNotes((prev) => prev.filter((n) => n.id !== id));
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
    setMeetingNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, linkShareEnabled: enabled } : n
      )
    );
  }, []);

  const canEditMeetingNote = useCallback(() => {
    if (!currentUser) return false;
    return currentUser.role !== "EXTERNAL";
  }, [currentUser]);

  const addUser = useCallback((user: Omit<User, "id">) => {
    setUsers((prev) => [...prev, { ...user, id: `u-${Date.now()}` }]);
  }, []);

  const updateUserRole = useCallback((id: string, role: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role } : u))
    );
    setCurrentUser((prev) =>
      prev?.id === id ? { ...prev, role } : prev
    );
  }, []);

  const updateUserPart = useCallback((id: string, part: UserPart) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, part } : u))
    );
    setCurrentUser((prev) =>
      prev?.id === id ? { ...prev, part } : prev
    );
  }, []);

  const getUserById = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users]
  );

  const getProjectById = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects]
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
    return ["MASTER", "LEADER"].includes(currentUser.role);
  }, [currentUser]);

  const canViewAllReports = useCallback(() => {
    if (!currentUser) return false;
    return ["MASTER", "LEADER"].includes(currentUser.role);
  }, [currentUser]);

  const canEditTask = useCallback(
    (userId: string) => {
      if (!currentUser) return false;
      if (["MASTER", "LEADER"].includes(currentUser.role)) return true;
      return currentUser.id === userId;
    },
    [currentUser]
  );

  const canEditAssignee = useCallback(() => {
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
      addProjectIssue,
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
      updateUserRole,
      updateUserPart,
      getUserById,
      getProjectById,
      filteredProjects,
      filteredWeeklyTasks,
      canAccess,
      canEditProject,
      canEditAssignee,
      canViewAllReports,
      canEditTask,
      canAddIssue,
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
      addProjectIssue,
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
      updateUserRole,
      updateUserPart,
      getUserById,
      getProjectById,
      filteredProjects,
      filteredWeeklyTasks,
      canAccess,
      canEditProject,
      canEditAssignee,
      canViewAllReports,
      canEditTask,
      canAddIssue,
      canEditMeetingNote,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export type { WorkPart, TaskType, TaskStatus };
