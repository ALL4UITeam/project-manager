"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderKanban,
  ClipboardList,
  Calendar,
  BarChart3,
  Users,
  FileText,
  LogOut,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useApp, type MenuKey } from "@/context/app-context";
import { ROLE_LABELS, PART_LABELS, type UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS: {
  key: MenuKey;
  label: string;
  href: string;
  icon: typeof FolderKanban;
  accent: string;
}[] = [
  {
    key: "projects",
    label: "프로젝트 현황",
    href: "/projects",
    icon: FolderKanban,
    accent: "bg-sky-400/15 text-sky-300 group-data-[active=true]/nav:text-sky-200",
  },
  {
    key: "reports",
    label: "주간 업무 보고",
    href: "/reports",
    icon: ClipboardList,
    accent: "bg-violet-400/15 text-violet-300 group-data-[active=true]/nav:text-violet-200",
  },
  {
    key: "calendar",
    label: "일정 관리",
    href: "/calendar",
    icon: Calendar,
    accent: "bg-emerald-400/15 text-emerald-300 group-data-[active=true]/nav:text-emerald-200",
  },
  {
    key: "md",
    label: "M/D 현황",
    href: "/md",
    icon: BarChart3,
    accent: "bg-amber-400/15 text-amber-300 group-data-[active=true]/nav:text-amber-200",
  },
  {
    key: "meetings",
    label: "회의록",
    href: "/meetings",
    icon: FileText,
    accent: "bg-rose-400/15 text-rose-300 group-data-[active=true]/nav:text-rose-200",
  },
  {
    key: "accounts",
    label: "계정 관리",
    href: "/accounts",
    icon: Users,
    accent: "bg-cyan-400/15 text-cyan-300 group-data-[active=true]/nav:text-cyan-200",
  },
];

const PAGE_TITLES: Record<string, string> = {
  "/projects": "프로젝트 현황",
  "/reports": "주간 업무 보고",
  "/calendar": "일정 관리",
  "/md": "M/D 공수 현황",
  "/meetings": "회의록",
  "/accounts": "계정 관리",
};

export function AppSidebar() {
  const pathname = usePathname();
  const { canAccess } = useApp();
  const visibleItems = NAV_ITEMS.filter((item) => canAccess(item.key));

  return (
    <aside className="relative flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.35_0.08_265/0.35),transparent_55%)]" />
      <div className="relative flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-violet-500 text-sm font-bold text-white shadow-lg shadow-primary/30">
          A4
        </div>
        <div>
          <p className="font-display text-sm font-bold tracking-tight text-white">
            All4Land
          </p>
          <p className="text-[11px] text-sidebar-foreground/60">
            Project Workspace
          </p>
        </div>
      </div>
      <nav className="relative flex flex-1 flex-col gap-1 p-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">
          Menu
        </p>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              data-active={active}
              className={cn(
                "group/nav relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-white shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
              )}
            >
              {active && (
                <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary" />
              )}
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  item.accent,
                  !active && "opacity-80 group-hover/nav:opacity-100"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="relative border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent/50 px-3 py-2.5 ring-1 ring-sidebar-border/80">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <p className="text-[11px] leading-snug text-sidebar-foreground/70">
            파트별 업무 · M/D · 회의록 통합 관리
          </p>
        </div>
      </div>
    </aside>
  );
}

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout, switchRole } = useApp();
  if (!currentUser) return null;

  const pageTitle =
    Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] ??
    "All4Land";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-card/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="font-display text-sm font-semibold text-foreground">
          {pageTitle}
        </span>
        <span className="hidden text-border sm:inline">/</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {currentUser.name}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 md:flex">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Demo
          </span>
          <Select
            value={currentUser.role}
            onValueChange={(v) => switchRole(v as UserRole)}
          >
            <SelectTrigger className="h-7 w-28 border-0 bg-transparent text-xs shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 rounded-xl px-2 hover:bg-muted/60"
            >
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-violet-500/20 font-display text-xs font-bold text-primary">
                  {currentUser.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none">
                  {currentUser.name}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {PART_LABELS[currentUser.part]}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span className="font-display font-semibold">
                  {currentUser.name}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {currentUser.email}
                </span>
                <Badge variant="secondary" className="mt-1 w-fit">
                  {ROLE_LABELS[currentUser.role]}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="app-surface flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
