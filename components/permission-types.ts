export type Role = "admin" | "school" | "battalion" | "company";
export type Permission = { id: string; name: string; roles: Role[] };
export type ManagedUser = { id: string; username: string; name: string; role: Role; unitId?: string; permissions: string[]; active: boolean };
export type Battalion = { id: string; nameTieuDoan: string };
export type Company = { id: string; nameDaiDoi: string; idTieuDoan: string };
export type AccountForm = { name: string; username: string; password: string; role: Role; unitId: string };
export const roles: { id: Role; label: string }[] = [
  { id: "company", label: "Chỉ huy Đại đội" },
  { id: "battalion", label: "Chỉ huy Tiểu đoàn" },
  { id: "school", label: "Nhà trường" },
  { id: "admin", label: "Admin" },
];
export const emptyAccount: AccountForm = { name: "", username: "", password: "", role: "company", unitId: "" };
