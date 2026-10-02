"use client";

import { type Permission, type Role, roles } from "@/components/permission-types";

export default function RolePermissionManagement({ permissions, draft, saving, onToggle, onSave }: { permissions: Permission[]; draft: Record<string, Role[]>; saving: boolean; onToggle: (permissionId: string, role: Role) => void; onSave: () => void }) {
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5"><div><h2 className="text-lg font-bold text-slate-900">Vai trò & quyền chức năng</h2><p className="mt-1 text-sm text-slate-500">Quyền được áp dụng đồng nhất cho mọi tài khoản cùng vai trò.</p></div><button onClick={onSave} disabled={saving} className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Lưu quyền</button></div>
    <div className="overflow-auto"><table className="min-w-[900px] w-full border-collapse"><thead className="bg-slate-100"><tr><th className="px-5 py-3 text-left text-sm font-semibold text-slate-600">Chức năng</th>{roles.map((role) => <th key={role.id} className="px-3 py-3 text-center text-sm font-semibold text-slate-600">{role.label}</th>)}</tr></thead><tbody>{permissions.map((permission) => <tr key={permission.id} className="border-t border-slate-200 hover:bg-slate-50"><td className="px-5 py-4 font-medium text-slate-900">{permission.name}</td>{roles.map((role) => <td key={role.id} className="px-3 py-4 text-center"><input aria-label={`${permission.name} - ${role.label}`} type="checkbox" checked={(draft[permission.id] || []).includes(role.id)} onChange={() => onToggle(permission.id, role.id)} className="h-5 w-5 rounded border-slate-300 text-sky-600" /></td>)}</tr>)}{!permissions.length && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Chưa có quyền chức năng.</td></tr>}</tbody></table></div>
  </section>;
}
