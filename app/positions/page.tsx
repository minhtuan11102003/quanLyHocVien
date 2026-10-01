/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState } from "react";
import { ModalShell } from "@/components/ui/modal-shell";

type Position = { id: string; name: string };
const API = "http://localhost:3001";

export default function PositionsPage() {
  const [items, setItems] = useState<Position[]>([]);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<Position | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const r = await fetch(`${API}/chucVu`);
    const x = await r.json();
    setItems(Array.isArray(x) ? x : []);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (x: Position) => {
    const students = await (await fetch(`${API}/students`)).json();
    if (students.some((s: { chucVu?: string | null }) => s.chucVu === x.name)) {
      return alert("Không thể xóa chức vụ đang được học viên sử dụng.");
    }
    if (!confirm(`Xóa chức vụ ${x.name}?`)) return;
    await fetch(`${API}/chucVu/${x.id}`, { method: "DELETE" });
    load();
  };

  const visible = items.filter((x) =>
    x.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-violet-600 to-indigo-700 p-5 text-white shadow-lg md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-100">
              Danh mục chức vụ
            </p>
            <h1 className="mt-2 text-2xl font-bold">Quản lý chức vụ</h1>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-sm font-medium text-violet-50">
              {items.length} chức vụ trong hệ thống
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm chức vụ..."
              className="min-w-60 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            <button
              onClick={() => {
                setEdit(null);
                setOpen(true);
              }}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              + Thêm chức vụ
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-auto">
            <table className="min-w-[600px] w-full border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Tên chức vụ
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((x) => (
                  <tr
                    key={x.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        {x.name}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEdit(x);
                            setOpen(true);
                          }}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => remove(x)}
                          className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-slate-500">
                      Không có chức vụ nào phù hợp
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {open && (
          <ModalShell title={`${edit ? "Chỉnh sửa" : "Thêm"} chức vụ`} description="Tên chức vụ sẽ được dùng khi tạo và cập nhật hồ sơ học viên." onClose={() => setOpen(false)} className="max-w-md">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const name = String(new FormData(e.currentTarget).get("name"));
              await fetch(`${API}/chucVu${edit ? `/${edit.id}` : ""}`, {
                method: edit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: edit?.id || crypto.randomUUID(),
                  name,
                }),
              });
              setOpen(false);
              load();
            }}
            className="space-y-4"
          >
              <input
                name="name"
                required
                defaultValue={edit?.name}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                placeholder="Tên chức vụ"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button className="rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">
                  Lưu
                </button>
              </div>
          </form>
          </ModalShell>
        )}
      </div>
    </div>
  );
}
