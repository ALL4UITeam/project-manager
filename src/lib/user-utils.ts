import {
  PART_LABELS,
  USER_PARTS_ORDERED,
  type User,
} from "@/types";

export type AccountUserGroup = {
  key: string;
  label: string;
  users: User[];
};

/** 계정 관리 — 파트별 그룹, 외부협력은 맨 아래 */
export function groupUsersForAccounts(users: User[]): AccountUserGroup[] {
  const internal = users.filter((user) => user.role !== "EXTERNAL");
  const external = users
    .filter((user) => user.role === "EXTERNAL")
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));

  const groups: AccountUserGroup[] = USER_PARTS_ORDERED.map((part) => ({
    key: part,
    label: PART_LABELS[part],
    users: internal
      .filter((user) => user.part === part)
      .sort((a, b) => a.name.localeCompare(b.name, "ko")),
  })).filter((group) => group.users.length > 0);

  if (external.length > 0) {
    groups.push({
      key: "EXTERNAL",
      label: "외부협력",
      users: external,
    });
  }

  return groups;
}
