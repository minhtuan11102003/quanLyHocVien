"use client";
import { useEffect, useState } from "react";
type Battalion = { id: string; nameTieuDoan: string };
type Company = { id: string; nameDaiDoi: string; idTieuDoan: string };
const API = "http://localhost:3001";
export default function UnitsPage() {
  const [tab, setTab] = useState<"td" | "dd">("td");
  const [td, setTd] = useState<Battalion[]>([]);
  const [dd, setDd] = useState<Company[]>([]);
  const [edit, setEdit] = useState<any>(null);
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
  const remove = async (x: any) => {
    if (tab === "td" && dd.some((y) => y.idTieuDoan === x.id))
      return alert("Không thể xóa Tiểu đoàn vì còn Đại đội trực thuộc.");
    if (tab === "dd") {
      const c = await (await fetch(`${API}/classes`)).json();
      if (c.some((z: any) => String(z.daiDoiId) === String(x.id)))
        return alert("Không thể xóa Đại đội vì còn lớp học trực thuộc.");
    }
    if (!confirm("Xác nhận xóa?")) return;
    await fetch(`${API}/${tab === "td" ? "tieuDoan" : "daiDoi"}/${x.id}`, {
      method: "DELETE",
    });
    load();
  };
  return (
    <div className="p-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Tiểu đoàn và Đại đội</h1>
          <p className="text-gray-500">
            Đại đội là đơn vị quản lý trực tiếp lớp học.
          </p>
        </div>
        <button
          onClick={() => {
            setEdit(null);
            setOpen(true);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-white"
        >
          + Thêm {tab === "td" ? "Tiểu đoàn" : "Đại đội"}
        </button>
      </div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </div>
      )}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("td")}
          className={`rounded-lg px-4 py-2 ${tab === "td" ? "bg-blue-600 text-white" : "border"}`}
        >
          Tiểu đoàn ({td.length})
        </button>
        <button
          onClick={() => setTab("dd")}
          className={`rounded-lg px-4 py-2 ${tab === "dd" ? "bg-blue-600 text-white" : "border"}`}
        >
          Đại đội ({dd.length})
        </button>
      </div>
      <div className="overflow-auto rounded-xl border bg-white">
        <table className="min-w-[700px] w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Tên đơn vị</th>
              {tab === "dd" && (
                <th className="p-3 text-left">Tiểu đoàn quản lý</th>
              )}
              <th className="p-3 text-left">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {(tab == "td" ? td : dd).map((x: any) => (
              <tr key={x.id} className="border-t">
                <td className="p-3 font-medium">
                  {tab === "td" ? x.nameTieuDoan : x.nameDaiDoi}
                </td>
                {tab === "dd" && (
                  <td className="p-3">
                    {td.find((y) => y.id === x.idTieuDoan)?.nameTieuDoan || "-"}
                  </td>
                )}
                <td className="flex gap-2 p-3">
                  <button
                    onClick={() => {
                      setEdit(x);
                      setOpen(true);
                    }}
                    className="rounded bg-blue-600 px-3 py-1 text-white"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => remove(x)}
                    className="rounded bg-red-600 px-3 py-1 text-white"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {(tab === "td" ? td : dd).length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center">
                  Chưa có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {open && (
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-6">
            <h2 className="text-xl font-bold">
              {edit ? "Sửa" : "Thêm"} {tab === "td" ? "Tiểu đoàn" : "Đại đội"}
            </h2>
            <input
              name="name"
              required
              defaultValue={edit?.nameTieuDoan || edit?.nameDaiDoi}
              placeholder="Tên đơn vị"
              className="w-full rounded border p-2.5"
            />
            {tab === "dd" && (
              <select
                name="parent"
                required
                defaultValue={edit?.idTieuDoan || ""}
                className="w-full rounded border p-2.5"
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
                className="rounded border px-4 py-2"
              >
                Hủy
              </button>
              <button className="rounded bg-blue-600 px-4 py-2 text-white">
                Lưu
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
