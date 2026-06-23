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
}[] = [
  { key: "projects", label: "프로젝트 현황", href: "/projects", icon: FolderKanban },
  { key: "reports", label: "주간 업무 보고", href: "/reports", icon: ClipboardList },
  { key: "calendar", label: "일정 관리", href: "/calendar", icon: Calendar },
  { key: "md", label: "M/D 현황", href: "/md", icon: BarChart3 },
  { key: "meetings", label: "회의록", href: "/meetings", icon: FileText },
  { key: "accounts", label: "계정 관리", href: "/accounts", icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { canAccess } = useApp();
  const visibleItems = NAV_ITEMS.filter((item) => canAccess(item.key));

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          A4
        </div>
        <div>
          <p className="text-sm font-semibold">All4Land</p>
          <p className="text-xs text-muted-foreground">프로젝트 & 주간보고</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AppHeader() {
  const router = useRouter();
  const { currentUser, logout, switchRole } = useApp();
  if (!currentUser) return null;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <p className="text-sm text-muted-foreground">
        프로젝트 현황 및 파트별 주간 업무 보고 시스템
      </p>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">테스트 권한</span>
          <Select
            value={currentUser.role}
            onValueChange={(v) => switchRole(v as UserRole)}
          >
            <SelectTrigger className="h-8 w-32">
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
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {currentUser.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">
                  {PART_LABELS[currentUser.part]}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span>{currentUser.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {currentUser.email}
                </span>
                <Badge variant="secondary" className="w-fit">
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
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
