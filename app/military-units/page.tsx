/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { DataPagination, usePagination } from "@/components/DataPagination";

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
      ...sdData.map(
        (x: {
          id: string;
          nameSuDoan: string;
          idQuanKhu: string;
          description?: string;
        }) => ({
          id: x.id,
          name: x.nameSuDoan,
          parentId: x.idQuanKhu,
          type: "Sư đoàn" as const,
          source: "suDoan" as const,
          description: x.description,
        }),
      ),
      ...ldData.map(
        (x: {
          id: string;
          nameLuDoan: string;
          idQuanKhu: string;
          description?: string;
        }) => ({
          id: x.id,
          name: x.nameLuDoan,
          parentId: x.idQuanKhu,
          type: "Lữ đoàn" as const,
          source: "luDoan" as const,
          description: x.description,
        }),
      ),
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
  const pagination = usePagination<Region | Unit>(tab === "regions" ? visibleRegions : visibleUnits);

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
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white shadow-lg md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
              Hệ thống tổ chức
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              Quản lý Quân khu và đơn vị
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-sm font-medium text-emerald-50">
              {tab === "regions"
                ? `${regions.length} Quân khu`
                : `${units.length} đơn vị`}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Quân khu</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {regions.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Sư đoàn / Lữ đoàn</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {units.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Hiện đang xem</p>
            <p className="mt-2 text-xl font-bold text-emerald-600">
              {tab === "regions" ? "Quân khu" : "Đơn vị"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTab("regions");
                  setSearch("");
                }}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  tab === "regions"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Quân khu ({regions.length})
              </button>
              <button
                onClick={() => {
                  setTab("units");
                  setSearch("");
                }}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  tab === "units"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Sư đoàn/Lữ đoàn ({units.length})
              </button>
            </div>
            <button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              + Thêm {tab === "regions" ? "Quân khu" : "đơn vị"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="min-w-60 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            {tab === "units" && (
              <select
                value={parent}
                onChange={(e) => setParent(e.target.value)}
                className="min-w-[220px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-auto">
            <table className="min-w-[760px] w-full border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  {tab === "regions" ? (
                    <>
                      <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                        Tên Quân khu
                      </th>
                      <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                        Mã
                      </th>
                      <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                        Mô tả
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                        Tên đơn vị
                      </th>
                      <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                        Loại
                      </th>
                      <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                        Quân khu
                      </th>
                    </>
                  )}
                  <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      Đang tải...
                    </td>
                  </tr>
                ) : tab === "regions" ? (
                  pagination.currentItems.filter((item): item is Region => "nameQuanKhu" in item).map((item) => (
                    <tr
                      key={`qk:${item.id}`}
                      className="border-t border-slate-200 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {item.nameQuanKhu}
                      </td>
                      <td className="px-5 py-4 text-slate-700">{item.code}</td>
                      <td className="px-5 py-4 text-slate-700">
                        {item.description || "-"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditing(item);
                              setOpen(true);
                            }}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => remove(item)}
                            className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  pagination.currentItems.filter((item): item is Unit => "source" in item).map((item) => (
                    <tr
                      key={`${item.source}:${item.id}`}
                      className="border-t border-slate-200 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 font-medium text-slate-900">
                        {item.name}
                      </td>
                      <td className="px-5 py-4 text-slate-700">{item.type}</td>
                      <td className="px-5 py-4 text-slate-700">
                        {regions.find((x) => x.id === item.parentId)
                          ?.nameQuanKhu || "-"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditing(item);
                              setOpen(true);
                            }}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => remove(item)}
                            className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {!loading &&
                  (tab === "regions" ? visibleRegions : visibleUnits).length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-8 text-center text-slate-500"
                      >
                        Không có dữ liệu
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
          <DataPagination {...pagination} totalItems={(tab === "regions" ? visibleRegions : visibleUnits).length} label={`${tab === "regions" ? "Quân khu" : "đơn vị"} / trang`} />
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
  const current = item;
  const [name, setName] = useState(
    current && "nameQuanKhu" in current
      ? current.nameQuanKhu
      : current && "name" in current
        ? current.name
        : "",
  );
  const [code, setCode] = useState(
    current && "code" in current ? current.code : "",
  );
  const [type, setType] = useState<"Sư đoàn" | "Lữ đoàn">(
    current && "type" in current ? current.type : "Sư đoàn",
  );
  const [parentId, setParentId] = useState(
    current && "parentId" in current ? current.parentId : regions[0]?.id || "",
  );
  const [description, setDescription] = useState(
    current && "description" in current ? current.description || "" : "",
  );
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
    <ModalShell
      title={`${current ? "Chỉnh sửa" : "Thêm"} ${isRegion ? "Quân khu" : "đơn vị"}`}
      description={isRegion ? "Thiết lập thông tin khu vực quản lý." : "Gắn đơn vị với quân khu quản lý tương ứng."}
      onClose={onClose}
      className="max-w-lg"
    >
      <form
        onSubmit={submit}
        className="space-y-4"
      >
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
              onChange={(e) => setType(e.target.value as "Sư đoàn" | "Lữ đoàn")}
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
    </ModalShell>
  );
}
