"use client";

import { useEffect, useMemo, useState } from "react";

type Region = {
  id: string;
  nameQuanKhu: string;
  code: string;
  description?: string;
};
type Unit = {
  id: string;
  name: string;
  parentId: string;
  type: "Sư đoàn" | "Lữ đoàn";
  source: "suDoan" | "luDoan";
  description?: string;
};
const API = "http://localhost:3001";

export default function MilitaryUnitsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tab, setTab] = useState<"regions" | "units">("regions");
  const [search, setSearch] = useState("");
  const [parent, setParent] = useState("all");
  const [editing, setEditing] = useState<Region | Unit | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [qk, sd, ld] = await Promise.all([
      fetch(`${API}/quanKhu`),
      fetch(`${API}/suDoan`),
      fetch(`${API}/luDoan`),
    ]);
    const [qkData, sdData, ldData] = await Promise.all([
      qk.json(),
      sd.json(),
      ld.json(),
    ]);
    setRegions(qkData);
    setUnits([
      ...sdData.map((x: any) => ({
        id: x.id,
        name: x.nameSuDoan,
        parentId: x.idQuanKhu,
        type: "Sư đoàn",
        source: "suDoan",
        description: x.description,
      })),
      ...ldData.map((x: any) => ({
        id: x.id,
        name: x.nameLuDoan,
        parentId: x.idQuanKhu,
        type: "Lữ đoàn",
        source: "luDoan",
        description: x.description,
      })),
    ]);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const visibleRegions = useMemo(
    () =>
      regions.filter((x) =>
        `${x.nameQuanKhu} ${x.code}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [regions, search],
  );
  const visibleUnits = useMemo(
    () =>
      units.filter(
        (x) =>
          (parent === "all" || x.parentId === parent) &&
          `${x.name} ${x.type}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [units, parent, search],
  );

  const remove = async (item: Region | Unit) => {
    const isRegion = "nameQuanKhu" in item;
    if (
      !confirm(
        `Xóa ${isRegion ? item.nameQuanKhu : `${item.type} ${item.name}`}?`,
      )
    )
      return;
    const endpoint = isRegion ? "quanKhu" : item.source;
    await fetch(`${API}/${endpoint}/${item.id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="p-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Quân khu và đơn vị</h1>
          <p className="mt-1 text-gray-500">
            Quản lý Quân khu, Sư đoàn và Lữ đoàn theo quan hệ cha - con.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white"
        >
          + Thêm {tab === "regions" ? "Quân khu" : "đơn vị"}
        </button>
      </div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => {
            setTab("regions");
            setSearch("");
          }}
          className={`rounded-lg px-4 py-2 ${tab === "regions" ? "bg-blue-600 text-white" : "border"}`}
        >
          Quân khu ({regions.length})
        </button>
        <button
          onClick={() => {
            setTab("units");
            setSearch("");
          }}
          className={`rounded-lg px-4 py-2 ${tab === "units" ? "bg-blue-600 text-white" : "border"}`}
        >
          Sư đoàn/Lữ đoàn ({units.length})
        </button>
      </div>
      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm..."
          className="min-w-60 flex-1 rounded-lg border px-4 py-2.5"
        />
        {tab === "units" && (
          <select
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            className="rounded-lg border px-4 py-2.5"
          >
            <option value="all">Tất cả Quân khu</option>
            {regions.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nameQuanKhu}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="max-h-[calc(100vh-230px)] overflow-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-[760px] w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              {tab === "regions" ? (
                <>
                  <th className="px-5 py-3 text-left">Tên Quân khu</th>
                  <th className="px-5 py-3 text-left">Mã</th>
                  <th className="px-5 py-3 text-left">Mô tả</th>
                </>
              ) : (
                <>
                  <th className="px-5 py-3 text-left">Tên đơn vị</th>
                  <th className="px-5 py-3 text-left">Loại</th>
                  <th className="px-5 py-3 text-left">Quân khu</th>
                </>
              )}
              <th className="px-5 py-3 text-left">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center">
                  Đang tải...
                </td>
              </tr>
            ) : (
              (tab === "regions" ? visibleRegions : visibleUnits).map(
                (item: any) => (
                  <tr
                    key={`${item.source || "qk"}:${item.id}`}
                    className="border-t hover:bg-gray-50"
                  >
                    {tab === "regions" ? (
                      <>
                        <td className="px-5 py-3 font-medium">
                          {item.nameQuanKhu}
                        </td>
                        <td className="px-5 py-3">{item.code}</td>
                        <td className="px-5 py-3">{item.description || "-"}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3 font-medium">{item.name}</td>
                        <td className="px-5 py-3">{item.type}</td>
                        <td className="px-5 py-3">
                          {regions.find((x) => x.id === item.parentId)
                            ?.nameQuanKhu || "-"}
                        </td>
                      </>
                    )}
                    <td className="flex gap-2 px-5 py-3">
                      <button
                        onClick={() => {
                          setEditing(item);
                          setOpen(true);
                        }}
                        className="rounded bg-blue-600 px-3 py-1.5 text-white"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => remove(item)}
                        className="rounded bg-red-600 px-3 py-1.5 text-white"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ),
              )
            )}
            {!loading &&
              (tab === "regions" ? visibleRegions : visibleUnits).length ===
                0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
      {open && (
        <UnitModal
          tab={tab}
          regions={regions}
          item={editing}
          onClose={() => setOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function UnitModal({
  tab,
  regions,
  item,
  onClose,
  onSaved,
}: {
  tab: "regions" | "units";
  regions: Region[];
  item: Region | Unit | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const isRegion = tab === "regions";
  const current = item as any;
  const [name, setName] = useState(current?.nameQuanKhu || current?.name || "");
  const [code, setCode] = useState(current?.code || "");
  const [type, setType] = useState<"Sư đoàn" | "Lữ đoàn">(
    current?.type || "Sư đoàn",
  );
  const [parentId, setParentId] = useState(
    current?.parentId || regions[0]?.id || "",
  );
  const [description, setDescription] = useState(current?.description || "");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isRegion
      ? "quanKhu"
      : type === "Sư đoàn"
        ? "suDoan"
        : "luDoan";
    const payload = isRegion
      ? {
          id: current?.id || `qk_${Date.now()}`,
          nameQuanKhu: name.trim(),
          code: code.trim(),
          description: description.trim(),
        }
      : {
          id:
            current?.id || `${type === "Sư đoàn" ? "sd" : "ld"}_${Date.now()}`,
          ...(type === "Sư đoàn"
            ? { nameSuDoan: name.trim() }
            : { nameLuDoan: name.trim() }),
          idQuanKhu: parentId,
          type,
          description: description.trim(),
        };
    await fetch(`${API}/${endpoint}${current?.id ? `/${current.id}` : ""}`, {
      method: current?.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await onSaved();
    onClose();
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6"
      >
        <h2 className="text-xl font-bold">
          {current ? "Sửa" : "Thêm"} {isRegion ? "Quân khu" : "đơn vị"}
        </h2>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isRegion ? "Tên Quân khu" : "Tên Sư đoàn/Lữ đoàn"}
          className="w-full rounded-lg border px-4 py-2.5"
        />
        {isRegion ? (
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Mã"
            className="w-full rounded-lg border px-4 py-2.5"
          />
        ) : (
          <>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-lg border px-4 py-2.5"
            >
              <option>Sư đoàn</option>
              <option>Lữ đoàn</option>
            </select>
            <select
              required
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5"
            >
              <option value="">-- Chọn Quân khu --</option>
              {regions.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nameQuanKhu}
                </option>
              ))}
            </select>
          </>
        )}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả"
          className="w-full rounded-lg border px-4 py-2.5"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2"
          >
            Hủy
          </button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-white">
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
}
