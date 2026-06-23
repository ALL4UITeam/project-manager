"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users, User, Building2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

const ROLE_ICONS: Record<UserRole, typeof Shield> = {
  MASTER: Shield,
  LEADER: Users,
  MEMBER: User,
  EXTERNAL: Building2,
};

const QUICK_ROLES: UserRole[] = ["MASTER", "LEADER", "MEMBER", "EXTERNAL"];

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAs, currentUser } = useApp();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(email, password);
    if (ok) {
      const user = quickLoginAccounts.find((u) => u.email === email);
      router.push(user?.role === "EXTERNAL" ? "/calendar" : "/projects");
    } else {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    const user = quickLoginAccounts.find((u) => u.role === role);
    if (user) {
      loginAs(user.id);
      router.push(role === "EXTERNAL" ? "/calendar" : "/projects");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
            A4
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            프로젝트 현황 & 주간 보고
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All4Land 파트별 업무 관리 시스템
          </p>
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/60">
          <CardHeader>
            <CardTitle>로그인</CardTitle>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">
                로그인
              </Button>
            </form>

            <div className="mt-6">
              <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                빠른 로그인 (테스트)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ROLES.map((role) => {
                  const Icon = ROLE_ICONS[role];
                  const account = quickLoginAccounts.find(
                    (u) => u.role === role
                  );
                  return (
                    <Button
                      key={role}
                      variant="outline"
                      className="h-auto flex-col gap-1 py-3"
                      onClick={() => handleQuickLogin(role)}
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {ROLE_LABELS[role]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {account?.name}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <p>팀원 테스트: changi@all4land.com / member123 (김찬기·기획)</p>
          <p>팀장 테스트: wonwoo@all4land.com / lead123 (조원우·PM)</p>
        </div>
      </div>
    </div>
  );
}
