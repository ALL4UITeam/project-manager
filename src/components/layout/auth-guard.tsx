"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldX } from "lucide-react";
import { useApp, type MenuKey } from "@/context/app-context";
import { DashboardLayout } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

const PATH_MENU: Record<string, MenuKey> = {
  "/projects": "projects",
  "/reports": "reports",
  "/calendar": "calendar",
  "/md": "md",
  "/accounts": "accounts",
  "/meetings": "meetings",
  "/dashboard": "projects",
  "/mm": "md",
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, canAccess } = useApp();

  const menuKey = Object.entries(PATH_MENU).find(([path]) =>
    pathname.startsWith(path)
  )?.[1];

  const hasAccess = menuKey ? canAccess(menuKey) : true;

  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (menuKey && !canAccess(menuKey)) {
      router.replace(
        currentUser.role === "EXTERNAL" ? "/calendar" : "/projects"
      );
    }
  }, [currentUser, pathname, router, canAccess, menuKey]);

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <ShieldX className="h-14 w-14 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">접근 권한이 없습니다</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            현재 권한으로는 이 메뉴에 접근할 수 없습니다.
          </p>
          <Button
            className="mt-6"
            onClick={() =>
              router.push(
                currentUser.role === "EXTERNAL" ? "/calendar" : "/projects"
              )
            }
          >
            허용된 페이지로 이동
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
