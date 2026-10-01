/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useState } from "react";
import { DataPagination, usePagination } from "@/components/DataPagination";
type Major = { id: string; name: string; shortName: string };
type ClassRecord = { majorId: string };
export default function MajorManagement({
  onChanged,
}: {
  onChanged: () => Promise<void>;
}) {
  const [items, setItems] = useState<Major[]>([]);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<Major | null>(null);
  const [open, setOpen] = useState(false);
  const load = async () =>
    setItems(await (await fetch("http://localhost:3001/majors")).json());
  useEffect(() => {
    load();
  }, []);
  const remove = async (x: Major) => {
    const classes = await (await fetch("http://localhost:3001/classes")).json();
    if ((classes as ClassRecord[]).some((c) => String(c.majorId) === String(x.id)))
      return alert(
        "Không thể xóa chuyên ngành vì vẫn còn lớp học thuộc chuyên ngành này.",
      );
    if (!confirm(`Xóa chuyên ngành ${x.name}?`)) return;
    await fetch(`http://localhost:3001/majors/${x.id}`, { method: "DELETE" });
    await load();
    await onChanged();
  };
  const visible = items.filter((x) =>
    `${x.name} ${x.shortName}`.toLowerCase().includes(search.toLowerCase()),
  );
  const pagination = usePagination(visible);
  return (
    <div>
      <div className="mb-4 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm chuyên ngành..."
          className="flex-1 rounded-lg border px-3 py-2.5"
        />
        <button
          onClick={() => {
            setEdit(null);
            setOpen(true);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          + Thêm chuyên ngành
        </button>
      </div>
      <div className="overflow-auto rounded-xl border bg-white">
        <table className="min-w-[650px] w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Tên chuyên ngành</th>
              <th className="p-3 text-left">Mã viết tắt</th>
              <th className="p-3 text-left">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pagination.currentItems.map((x) => (
              <tr key={x.id} className="border-t">
                <td className="p-3">{x.name}</td>
                <td className="p-3">{x.shortName}</td>
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
          </tbody>
        </table>
      </div>
      <div className="rounded-b-xl border border-t-0 bg-white"><DataPagination {...pagination} totalItems={visible.length} label="chuyên ngành / trang" /></div>
      {open && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            await fetch(
              `http://localhost:3001/majors${edit ? `/${edit.id}` : ""}`,
              {
                method: edit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: edit?.id || crypto.randomUUID(),
                  name: String(fd.get("name")),
                  shortName: String(fd.get("shortName")),
                }),
              },
            );
            setOpen(false);
            await load();
            await onChanged();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-md space-y-3 rounded-xl bg-white p-6">
            <h2 className="text-xl font-bold">
              {edit ? "Sửa" : "Thêm"} chuyên ngành
            </h2>
            <input
              name="name"
              required
              defaultValue={edit?.name}
              placeholder="Tên chuyên ngành"
              className="w-full rounded border p-2.5"
            />
            <input
              name="shortName"
              required
              defaultValue={edit?.shortName}
              placeholder="Mã viết tắt"
              className="w-full rounded border p-2.5"
            />
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
