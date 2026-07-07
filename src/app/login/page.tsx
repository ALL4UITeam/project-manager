"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  User,
  Building2,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { quickLoginAccounts } from "@/data/mock-data";
import { ROLE_LABELS, type UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<UserRole, typeof Shield> = {
  MASTER: Shield,
  LEADER: Users,
  MEMBER: User,
  EXTERNAL: Building2,
};

const QUICK_ROLES: UserRole[] = ["MASTER", "LEADER", "MEMBER", "EXTERNAL"];

const ROLE_ACCENTS: Record<UserRole, string> = {
  MASTER: "from-violet-500/10 to-indigo-500/10 hover:from-violet-500/15 hover:to-indigo-500/15 border-violet-200/60",
  LEADER: "from-sky-500/10 to-cyan-500/10 hover:from-sky-500/15 hover:to-cyan-500/15 border-sky-200/60",
  MEMBER: "from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/15 hover:to-teal-500/15 border-emerald-200/60",
  EXTERNAL: "from-amber-500/10 to-orange-500/10 hover:from-amber-500/15 hover:to-orange-500/15 border-amber-200/60",
};

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAs, currentUser, users } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser) {
      router.replace(
        currentUser.role === "EXTERNAL" ? "/calendar" : "/projects"
      );
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await login(email, password);
    if (user) {
      router.push(user.role === "EXTERNAL" ? "/calendar" : "/projects");
    } else {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    const user = users.find((u) => u.role === role);
    if (user) {
      loginAs(user.id);
      router.push(role === "EXTERNAL" ? "/calendar" : "/projects");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 app-surface" />
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-600 text-xl font-bold text-white shadow-xl shadow-primary/25 ring-4 ring-primary/10">
            A4
          </div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <LayoutDashboard className="h-3.5 w-3.5" />
            All4Land Workspace
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            프로젝트 & 주간 보고
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            파트별 업무 · M/D · 회의록 통합 관리
          </p>
        </div>

        <Card className="glass-card border-0 shadow-xl shadow-primary/8">
          <CardHeader>
            <CardTitle className="font-display text-lg">로그인</CardTitle>
            <CardDescription>
              실무 계정으로 로그인하거나 테스트 권한으로 바로 접속하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-10 bg-background/60"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  className="h-10 bg-background/60"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" className="h-10 w-full gap-2 font-medium">
                로그인
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-8">
              <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                빠른 로그인 (테스트)
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {QUICK_ROLES.map((role) => {
                  const Icon = ROLE_ICONS[role];
                  const account = quickLoginAccounts.find(
                    (u) => u.role === role
                  );
                  return (
                    <Button
                      key={role}
                      variant="outline"
                      className={cn(
                        "h-auto flex-col gap-1.5 border bg-gradient-to-br py-3.5 transition-all",
                        ROLE_ACCENTS[role]
                      )}
                      onClick={() => handleQuickLogin(role)}
                    >
                      <Icon className="h-4 w-4 text-primary" strokeWidth={2.25} />
                      <span className="text-sm font-semibold">
                        {ROLE_LABELS[role]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {account?.name}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-1.5 text-center font-numeric text-[11px] text-muted-foreground">
          <p>팀원: changi@all4land.com / member123</p>
          <p>팀장: ilho@all4land.com / lead123</p>
          <p>퍼블: seungjun@all4land.com / member123</p>
        </div>
      </div>
    </div>
  );
}
