"use client";

import { useState } from "react";
import { Plus, Shield, Users, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  FormDialogHeader,
  FormDialogSection,
  FormField,
  formInputClassName,
} from "@/components/shared/form-dialog";
import { useApp } from "@/context/app-context";
import {
  ROLE_LABELS,
  PART_LABELS,
  type UserRole,
  type UserPart,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AccountManagement() {
  const { users, addUser, updateUserRole, updateUserPart, currentUser } =
    useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER" as UserRole,
    part: "PLANNING" as UserPart,
  });

  if (currentUser?.role !== "MASTER") {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">접근 권한이 없습니다</p>
        <p className="text-sm text-muted-foreground">
          계정 관리는 MASTER 권한만 접근할 수 있습니다.
        </p>
      </div>
    );
  }

  const handleCreate = () => {
    addUser(form);
    setForm({
      name: "",
      email: "",
      password: "",
      role: "MEMBER",
      part: "PLANNING",
    });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Users}
        iconClassName="bg-cyan-500/10 text-cyan-600 ring-cyan-500/15"
        title="계정 발급 및 권한 관리"
        description="이름 · 소속 파트 · 권한을 지정하여 Mock 계정을 발급합니다"
      >
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          신규 계정 발급
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
          const count = users.filter((u) => u.role === role).length;
          return (
            <Card key={role} className="glass-card border-0">
              <CardContent className="pt-6">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {ROLE_LABELS[role]}
                </p>
                <p className="font-numeric mt-1 text-2xl font-semibold">{count}명</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">발급된 계정 목록</CardTitle>
          <CardDescription>총 {users.length}명</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>소속 파트</TableHead>
                <TableHead>권한</TableHead>
                <TableHead>파트 변경</TableHead>
                <TableHead>권한 변경</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{PART_LABELS[user.part]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.part}
                      onValueChange={(v) =>
                        updateUserPart(user.id, v as UserPart)
                      }
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PART_LABELS) as UserPart[]).map(
                          (part) => (
                            <SelectItem key={part} value={part}>
                              {PART_LABELS[part]}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(v) =>
                        updateUserRole(user.id, v as UserRole)
                      }
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(ROLE_LABELS) as UserRole[]).map(
                          (role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <FormDialogHeader
            icon={UserPlus}
            accent="cyan"
            title="신규 계정 발급"
            description="이름 · 이메일 · 파트 · 권한을 설정해 Mock 계정을 생성합니다."
          />
          <DialogBody className="space-y-4">
            <FormDialogSection title="계정 정보">
              <FormField label="이름" required>
                <Input
                  className={formInputClassName()}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="홍길동"
                />
              </FormField>
              <FormField label="이메일" required>
                <Input
                  type="email"
                  className={formInputClassName()}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@all4land.com"
                />
              </FormField>
              <FormField label="초기 비밀번호" required>
                <Input
                  type="password"
                  className={formInputClassName()}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </FormField>
            </FormDialogSection>

            <FormDialogSection title="권한 설정">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="소속 파트" required>
                  <Select
                    value={form.part}
                    onValueChange={(v) =>
                      setForm({ ...form, part: v as UserPart })
                    }
                  >
                    <SelectTrigger className={formInputClassName()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PART_LABELS) as UserPart[]).map((part) => (
                        <SelectItem key={part} value={part}>
                          {PART_LABELS[part]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="권한" required>
                  <Select
                    value={form.role}
                    onValueChange={(v) =>
                      setForm({ ...form, role: v as UserRole })
                    }
                  >
                    <SelectTrigger className={formInputClassName()}>
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
                </FormField>
              </div>
            </FormDialogSection>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" className="min-w-24" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button
              className="min-w-28 shadow-sm shadow-primary/20"
              onClick={handleCreate}
              disabled={!form.name || !form.email || !form.password}
            >
              계정 생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
