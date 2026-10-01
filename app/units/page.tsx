/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
type Battalion = { id: string; nameTieuDoan: string };
type Company = { id: string; nameDaiDoi: string; idTieuDoan: string };
type EditItem = Battalion | Company | null;
const API = "http://localhost:3001";
export default function UnitsPage() {
  const [tab, setTab] = useState<"td" | "dd">("td");
  const [td, setTd] = useState<Battalion[]>([]);
  const [dd, setDd] = useState<Company[]>([]);
  const [edit, setEdit] = useState<EditItem>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    try {
      setError("");
      const [tdRes, ddRes] = await Promise.all([
        fetch(`${API}/tieuDoan`),
        fetch(`${API}/daiDoi`),
      ]);
      const ddData = ddRes.ok ? await ddRes.json() : [];
      let tdData: Battalion[] = [];
      if (tdRes.ok) {
        const value = await tdRes.json();
        tdData = Array.isArray(value) ? value : [];
      }
      if (!tdData.length && Array.isArray(ddData)) {
        const parents = [
          ...new Set(ddData.map((x: Company) => String(x.idTieuDoan))),
        ];
        tdData = parents.map((id, index) => ({
          id,
          nameTieuDoan: `Tiểu đoàn ${index + 1}`,
        }));
      }
      setTd(Array.isArray(tdData) ? tdData : []);
      setDd(Array.isArray(ddData) ? ddData : []);
    } catch (e) {
      console.error(e);
      setTd([]);
      setDd([]);
      setError(
        "Không thể tải dữ liệu đơn vị. Hãy kiểm tra JSON Server ở cổng 3001.",
      );
    }
  };
  useEffect(() => {
    load();
  }, []);
  const remove = async (x: Battalion | Company) => {
    if (tab === "td" && dd.some((y) => y.idTieuDoan === x.id))
      return alert("Không thể xóa Tiểu đoàn vì còn Đại đội trực thuộc.");
    if (tab === "dd") {
      const c = await (await fetch(`${API}/classes`)).json();
      if (
        c.some(
          (z: { daiDoiId?: string | number }) =>
            String(z.daiDoiId) === String(x.id),
        )
      )
        return alert("Không thể xóa Đại đội vì còn lớp học trực thuộc.");
    }
    if (!confirm("Xác nhận xóa?")) return;
    await fetch(`${API}/${tab === "td" ? "tieuDoan" : "daiDoi"}/${x.id}`, {
      method: "DELETE",
    });
    load();
  };
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-cyan-600 to-sky-700 p-5 text-white shadow-lg md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Đơn vị trực thuộc
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              Quản lý Tiểu đoàn và Đại đội
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-sm font-medium text-cyan-50">
              {tab === "td" ? `${td.length} Tiểu đoàn` : `${dd.length} Đại đội`}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Tiểu đoàn</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {td.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Đại đội</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {dd.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Cấp quản lý</p>
            <p className="mt-2 text-xl font-bold text-sky-600">
              {tab === "td" ? "Tiểu đoàn" : "Đại đội"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setTab("td")}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  tab === "td"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Tiểu đoàn ({td.length})
              </button>
              <button
                onClick={() => setTab("dd")}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  tab === "dd"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Đại đội ({dd.length})
              </button>
            </div>
            <button
              onClick={() => {
                setEdit(null);
                setOpen(true);
              }}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              + Thêm {tab === "td" ? "Tiểu đoàn" : "Đại đội"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-auto">
            <table className="min-w-[700px] w-full border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Tên đơn vị
                  </th>
                  {tab === "dd" && (
                    <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                      Tiểu đoàn quản lý
                    </th>
                  )}
                  <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {(tab === "td" ? td : dd).map((x: Battalion | Company) => (
                  <tr
                    key={x.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                        {tab === "td"
                          ? (x as Battalion).nameTieuDoan
                          : (x as Company).nameDaiDoi}
                      </span>
                    </td>
                    {tab === "dd" && (
                      <td className="px-5 py-4 text-slate-700">
                        {td.find((y) => y.id === (x as Company).idTieuDoan)
                          ?.nameTieuDoan || "-"}
                      </td>
                    )}
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
                {(tab === "td" ? td : dd).length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">
                      Chưa có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {open && (
          <ModalShell title={`${edit ? "Chỉnh sửa" : "Thêm"} ${tab === "td" ? "Tiểu đoàn" : "Đại đội"}`} description="Kiểm tra đơn vị cấp trên trước khi lưu." onClose={() => setOpen(false)} className="max-w-md">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const endpoint = tab === "td" ? "tieuDoan" : "daiDoi";
              const body =
                tab === "td"
                  ? {
                      id: edit?.id || crypto.randomUUID(),
                      nameTieuDoan: String(f.get("name")),
                    }
                  : {
                      id: edit?.id || crypto.randomUUID(),
                      nameDaiDoi: String(f.get("name")),
                      idTieuDoan: String(f.get("parent")),
                    };
              await fetch(`${API}/${endpoint}${edit ? `/${edit.id}` : ""}`, {
                method: edit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });
              setOpen(false);
              load();
            }}
            className="space-y-4"
          >
              <input
                name="name"
                required
                defaultValue={
                  edit && "nameTieuDoan" in edit
                    ? edit.nameTieuDoan
                    : edit && "nameDaiDoi" in edit
                      ? edit.nameDaiDoi
                      : ""
                }
                placeholder="Tên đơn vị"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {tab === "dd" && (
                <select
                  name="parent"
                  required
                  defaultValue={
                    edit && "idTieuDoan" in edit ? edit.idTieuDoan : ""
                  }
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">-- Chọn Tiểu đoàn --</option>
                  {td.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nameTieuDoan}
                    </option>
                  ))}
                </select>
              )}
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
