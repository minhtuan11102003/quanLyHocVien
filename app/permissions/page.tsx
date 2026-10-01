"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/components/AuthGate";

type Role = "admin" | "school" | "battalion" | "company";

type Permission = {
  id: string;
  name: string;
  roles: Role[];
};

type User = {
  id: string;
  username: string;
  name: string;
  role: Role;
  permissions: string[];
  active: boolean;
};

const API = "http://localhost:3001";

const roles: { id: Role; label: string }[] = [
  { id: "company", label: "Chỉ huy Đại đội" },
  { id: "battalion", label: "Chỉ huy Tiểu đoàn" },
  { id: "school", label: "Nhà trường" },
  { id: "admin", label: "Admin" },
];

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [draft, setDraft] = useState<Record<string, Role[]>>({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const session = getSession();
  const isAdmin = session?.role === "admin";

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    Promise.all([fetch(`${API}/permissionCatalog`), fetch(`${API}/users`)])
      .then(async ([permissionRes, usersRes]) => {
        const permissionData = await permissionRes.json();
        const userData = await usersRes.json();

        const nextPermissions = Array.isArray(permissionData)
          ? permissionData
          : [];
        const nextUsers = Array.isArray(userData) ? userData : [];

        setPermissions(nextPermissions);
        setUsers(nextUsers);

        const map: Record<string, Role[]> = {};
        nextPermissions.forEach((item: Permission) => {
          map[item.id] = item.roles || [];
        });
        setDraft(map);
      })
      .catch(() => {
        setError("Không thể tải dữ liệu phân quyền.");
      });
  }, [isAdmin]);

  const toggle = (id: string, role: Role) => {
    setDraft((prev) => {
      const current = prev[id] || [];
      return {
        ...prev,
        [id]: current.includes(role)
          ? current.filter((item) => item !== role)
          : [...current, role],
      };
    });
  };

  const save = async () => {
    await Promise.all(
      permissions.map((permission) =>
        fetch(`${API}/permissionCatalog/${permission.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roles: draft[permission.id] || [],
          }),
        }),
      ),
    );

    await Promise.all(
      users.map((user) =>
        fetch(`${API}/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            permissions: permissions
              .filter((permission) =>
                (draft[permission.id] || []).includes(user.role),
              )
              .map((permission) => permission.id),
          }),
        }),
      ),
    );

    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          Chỉ Admin mới được quản lý chức năng.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-600 to-indigo-700 p-5 text-white shadow-lg md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
              Phân quyền hệ thống
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              Quản lý chức năng & tài khoản
            </h1>
          </div>
          <button
            onClick={save}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
          >
            Lưu phân quyền
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Tổng chức năng</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {permissions.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Vai trò</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {roles.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Tài khoản</p>
            <p className="mt-2 text-3xl font-bold text-sky-600">
              {users.length}
            </p>
          </div>
        </div>

        {saved && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Đã lưu phân quyền thành công.
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-auto">
            <table className="min-w-[900px] w-full border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Chức năng
                  </th>
                  {roles.map((role) => (
                    <th
                      key={role.id}
                      className="px-3 py-3 text-center text-sm font-semibold uppercase tracking-wide text-slate-600"
                    >
                      {role.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((permission) => (
                  <tr
                    key={permission.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 font-medium text-slate-900">
                      {permission.name}
                    </td>
                    {roles.map((role) => (
                      <td key={role.id} className="px-3 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={(draft[permission.id] || []).includes(
                            role.id,
                          )}
                          onChange={() => toggle(permission.id, role.id)}
                          className="h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <p className="font-semibold">Luồng đề xuất:</p>
          <p className="mt-1">
            Đại đội lập yêu cầu → Tiểu đoàn phê duyệt trung gian → Nhà trường
            phê duyệt cuối. Admin có toàn quyền và có thể bật/tắt từng quyền ở
            bảng trên.
          </p>
        </div>
      </div>
    </div>
  );
}
