"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import { Plus, Shield, Users, UserPlus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  FormDialogHeader,
  FormDialogSection,
  FormField,
  formInputClassName,
} from "@/components/shared/form-dialog";
import { useApp } from "@/context/app-context";
import { groupUsersForAccounts } from "@/lib/user-utils";
import {
  ROLE_LABELS,
  PART_LABELS,
  USER_PARTS_ORDERED,
  USER_ROLES_ORDERED,
  type User,
  type UserRole,
  type UserPart,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
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

const emptyCreateForm = {
  name: "",
  email: "",
  password: "",
  role: "MEMBER" as UserRole,
  part: "PLANNING" as UserPart,
};

export function AccountManagement() {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    updateUserRole,
    updateUserPart,
    canManageAccounts,
    canMasterManageUsers,
  } = useApp();

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);

  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER" as UserRole,
    part: "PLANNING" as UserPart,
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const isMaster = canMasterManageUsers();
  const groupedUsers = useMemo(() => groupUsersForAccounts(users), [users]);
  const tableColSpan = isMaster ? 7 : 6;

  useEffect(() => {
    if (editOpen && editingUser) {
      setEditForm({
        name: editingUser.name,
        email: editingUser.email,
        password: "",
        role: editingUser.role,
        part: editingUser.part,
      });
    }
  }, [editOpen, editingUser]);

  if (!canManageAccounts()) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">접근 권한이 없습니다</p>
        <p className="text-sm text-muted-foreground">
          계정 관리는 Master·팀장 권한만 접근할 수 있습니다.
        </p>
      </div>
    );
  }

  const handleCreate = () => {
    addUser(createForm);
    setCreateForm(emptyCreateForm);
    setCreateOpen(false);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditOpen(true);
  };

  const handleEditSave = () => {
    if (!editingUser) return;
    updateUser(editingUser.id, {
      name: editForm.name,
      email: editForm.email,
      role: editForm.role,
      part: editForm.part,
      ...(editForm.password ? { password: editForm.password } : {}),
    });
    setEditOpen(false);
    setEditingUser(null);
  };

  const openDelete = (user: User) => {
    setDeletingUser(user);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) return;
    deleteUser(deletingUser.id);
    setDeleteOpen(false);
    setDeletingUser(null);
  };

  const canDeleteUser = (user: User) => {
    if (!isMaster) return false;
    if (user.id === currentUser?.id) return false;
    return true;
  };

  const renderUserRow = (user: User) => (
    <TableRow key={user.id}>
      <TableCell className="font-medium">{user.name}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
      <TableCell>
        <Badge variant="outline">{PART_LABELS[user.part]}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
      </TableCell>
      <TableCell>
        <Select
          value={user.part}
          onValueChange={(v) => updateUserPart(user.id, v as UserPart)}
        >
          <SelectTrigger className="h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {USER_PARTS_ORDERED.map((part) => (
              <SelectItem key={part} value={part}>
                {PART_LABELS[part]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={user.role}
          onValueChange={(v) => updateUserRole(user.id, v as UserRole)}
        >
          <SelectTrigger className="h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {USER_ROLES_ORDERED.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      {isMaster && (
        <TableCell>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openEdit(user)}
              title="계정 수정"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => openDelete(user)}
              disabled={!canDeleteUser(user)}
              title={
                user.id === currentUser?.id
                  ? "본인 계정은 삭제할 수 없습니다"
                  : "계정 삭제"
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );

  return (
    <div className="page-stack">
      <PageHeader
        icon={Users}
        iconClassName="bg-cyan-500/10 text-cyan-600 ring-cyan-500/15"
        title="계정 발급 및 권한 관리"
        description={
          isMaster
            ? "Master: 계정 생성 · 수정 · 삭제 · 권한/파트 변경"
            : "팀장: 권한 및 파트 변경"
        }
      >
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          신규 계정 발급
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">계정 목록</CardTitle>
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
                {isMaster && <TableHead className="w-28">관리</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedUsers.map((group) => (
                <Fragment key={group.key}>
                  <TableRow className="bg-muted/35 hover:bg-muted/35">
                    <TableCell
                      colSpan={tableColSpan}
                      className="py-2 text-sm font-semibold text-foreground"
                    >
                      {group.label}
                      <span className="ml-2 font-normal text-muted-foreground">
                        {group.users.length}명
                      </span>
                    </TableCell>
                  </TableRow>
                  {group.users.map((user) => renderUserRow(user))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 신규 생성 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <FormDialogHeader
            icon={UserPlus}
            accent="cyan"
            title="신규 계정 발급"
            description="이름 · 이메일 · 파트 · 권한을 설정해 계정을 생성합니다."
          />
          <DialogBody className="space-y-4">
            <FormDialogSection title="계정 정보">
              <FormField label="이름" required>
                <Input
                  className={formInputClassName()}
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="홍길동"
                />
              </FormField>
              <FormField label="이메일" required>
                <Input
                  type="email"
                  className={formInputClassName()}
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  placeholder="name@all4land.com"
                />
              </FormField>
              <FormField label="초기 비밀번호" required>
                <Input
                  type="password"
                  className={formInputClassName()}
                  value={createForm.password}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </FormField>
            </FormDialogSection>
            <FormDialogSection title="권한 설정">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="소속 파트" required>
                  <Select
                    value={createForm.part}
                    onValueChange={(v) =>
                      setCreateForm({ ...createForm, part: v as UserPart })
                    }
                  >
                    <SelectTrigger className={formInputClassName()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_PARTS_ORDERED.map((part) => (
                        <SelectItem key={part} value={part}>
                          {PART_LABELS[part]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="권한" required>
                  <Select
                    value={createForm.role}
                    onValueChange={(v) =>
                      setCreateForm({ ...createForm, role: v as UserRole })
                    }
                  >
                    <SelectTrigger className={formInputClassName()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES_ORDERED.map((role) => (
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
            <Button
              variant="outline"
              className="min-w-24"
              onClick={() => setCreateOpen(false)}
            >
              취소
            </Button>
            <Button
              className="min-w-28 shadow-sm shadow-primary/20"
              onClick={handleCreate}
              disabled={
                !createForm.name || !createForm.email || !createForm.password
              }
            >
              계정 생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Master 수정 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <FormDialogHeader
            icon={Pencil}
            accent="cyan"
            title="계정 수정"
            description={
              editingUser
                ? `${editingUser.name} (${editingUser.email})`
                : undefined
            }
          />
          <DialogBody className="space-y-4">
            <FormDialogSection title="계정 정보">
              <FormField label="이름" required>
                <Input
                  className={formInputClassName()}
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </FormField>
              <FormField label="이메일" required>
                <Input
                  type="email"
                  className={formInputClassName()}
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
              </FormField>
              <FormField
                label="비밀번호"
                hint="변경할 때만 입력 (비우면 유지)"
              >
                <Input
                  type="password"
                  className={formInputClassName()}
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  placeholder="새 비밀번호"
                />
              </FormField>
            </FormDialogSection>
            <FormDialogSection title="권한 설정">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="소속 파트" required>
                  <Select
                    value={editForm.part}
                    onValueChange={(v) =>
                      setEditForm({ ...editForm, part: v as UserPart })
                    }
                  >
                    <SelectTrigger className={formInputClassName()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_PARTS_ORDERED.map((part) => (
                        <SelectItem key={part} value={part}>
                          {PART_LABELS[part]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="권한" required>
                  <Select
                    value={editForm.role}
                    onValueChange={(v) =>
                      setEditForm({ ...editForm, role: v as UserRole })
                    }
                  >
                    <SelectTrigger className={formInputClassName()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES_ORDERED.map((role) => (
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
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={!editForm.name || !editForm.email}
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Master 삭제 확인 */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <FormDialogHeader
            icon={Trash2}
            accent="sky"
            title="계정 삭제"
            description="삭제한 계정은 복구할 수 없습니다."
          />
          <DialogBody>
            <p className="text-sm">
              <span className="font-semibold">{deletingUser?.name}</span>
              <span className="text-muted-foreground">
                {" "}
                ({deletingUser?.email}) 계정을 삭제할까요?
              </span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              업무·이슈·회의록에 연결된 계정은 삭제되지 않을 수 있습니다.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
