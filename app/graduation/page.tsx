/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";

type Student = {
  id: string;
  name: string;
  maSoHV: string;
  classId: string;
  quanKhuId?: string;
  donViCap2Id?: string;
  graduationStatus?: string;
  originQuanKhuId?: string;
  originDonViCap2Id?: string;
};
type Region = { id: string; nameQuanKhu: string };
type Unit = {
  id: string;
  name: string;
  parentId: string;
  type: string;
  source: "suDoan" | "luDoan";
};
type UnitRecord = { id: string; idQuanKhu: string; nameSuDoan?: string; nameLuDoan?: string };
type Transfer = {
  id: string;
  studentId: string;
  studentName: string;
  maSoHV: string;
  type: "return" | "transfer";
  fromQuanKhuId: string;
  toQuanKhuId: string;
  fromDonViCap2Id: string;
  toDonViCap2Id: string;
  createdAt: string;
};
const API = "http://localhost:3001";

export default function GraduationPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [history, setHistory] = useState<Transfer[]>([]);
  const [studentId, setStudentId] = useState("");
  const [mode, setMode] = useState<"return" | "transfer">("return");
  const [targetRegion, setTargetRegion] = useState("");
  const [targetUnit, setTargetUnit] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [s, q, sd, ld, h] = await Promise.all([
      fetch(`${API}/students`),
      fetch(`${API}/quanKhu`),
      fetch(`${API}/suDoan`),
      fetch(`${API}/luDoan`),
      fetch(`${API}/graduationTransfers`),
    ]);
    const [studentData, regionData, sdData, ldData, historyData] =
      await Promise.all([
        s.json(),
        q.json(),
        sd.json(),
        ld.json(),
        h.ok ? h.json() : [],
      ]);
    setStudents(studentData);
    setRegions(regionData);
    setHistory(historyData);
    setUnits([
      ...(sdData as UnitRecord[]).map((x) => ({
        id: x.id,
        name: x.nameSuDoan || "Chưa đặt tên",
        parentId: x.idQuanKhu,
        type: "Sư đoàn",
        source: "suDoan" as const,
      })),
      ...(ldData as UnitRecord[]).map((x) => ({
        id: x.id,
        name: x.nameLuDoan || "Chưa đặt tên",
        parentId: x.idQuanKhu,
        type: "Lữ đoàn",
        source: "luDoan" as const,
      })),
    ]);
  };
  useEffect(() => {
    load().catch(console.error);
  }, []);

  const student = students.find((x) => x.id === studentId);
  const targetUnits = useMemo(
    () => units.filter((x) => x.parentId === targetRegion),
    [targetRegion, units],
  );
  const visibleStudents = students.filter((x) =>
    `${x.name} ${x.maSoHV}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  const regionName = (id?: string) =>
    regions.find((x) => x.id === id)?.nameQuanKhu || "Chưa cập nhật";
  const unitName = (id?: string) => {
    const item = units.find((x) => `${x.source}:${x.id}` === id || x.id === id);
    return item ? `${item.type} ${item.name}` : "Chưa cập nhật";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return alert("Vui lòng chọn học viên");
    if (mode === "transfer" && (!targetRegion || !targetUnit))
      return alert("Vui lòng chọn Quân khu và Sư đoàn/Lữ đoàn mới");
    const originRegion = student.originQuanKhuId || student.quanKhuId || "";
    const originUnit = student.originDonViCap2Id || student.donViCap2Id || "";
    const toRegion = mode === "return" ? originRegion : targetRegion;
    const toUnit = mode === "return" ? originUnit : targetUnit;
    setSaving(true);
    try {
      const studentRes = await fetch(`${API}/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graduationStatus: "graduated",
          graduatedAt: new Date().toISOString(),
          originQuanKhuId: originRegion,
          originDonViCap2Id: originUnit,
          quanKhuId: toRegion,
          donViCap2Id: toUnit,
        }),
      });
      if (!studentRes.ok) throw new Error("Không thể cập nhật học viên");
      const historyRes = await fetch(`${API}/graduationTransfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          studentId: student.id,
          studentName: student.name,
          maSoHV: student.maSoHV,
          type: mode,
          fromQuanKhuId: student.quanKhuId || "",
          toQuanKhuId: toRegion,
          fromDonViCap2Id: student.donViCap2Id || "",
          toDonViCap2Id: toUnit,
          createdAt: new Date().toISOString(),
        }),
      });
      if (!historyRes.ok) throw new Error("Không thể lưu lịch sử");
      alert(
        mode === "return"
          ? "Đã ghi nhận tốt nghiệp và về đơn vị cũ"
          : "Đã ghi nhận tốt nghiệp và điều chuyển công tác",
      );
      setStudentId("");
      setTargetRegion("");
      setTargetUnit("");
      await load();
    } catch (error) {
      console.error(error);
      alert("Không thể lưu quyết định công tác");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell space-y-5">
      <header className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-700 to-teal-700 p-6 text-white shadow-lg shadow-emerald-900/10">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-100">Điều hành đào tạo</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Tốt nghiệp & điều chỉnh công tác</h1>
        <p className="mt-2 max-w-2xl text-sm text-emerald-50">
          Ghi nhận học viên tốt nghiệp, về đơn vị cũ hoặc chuyển sang đơn vị
          mới.
        </p>
      </header>
      <form
        onSubmit={submit}
        className="max-w-4xl space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">Quyết định mới</p><h2 className="mt-1 text-xl font-bold text-slate-900">Lập quyết định tốt nghiệp</h2></div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc mã số..."
          className="field-control"
        />
        <select
          required
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="field-control"
        >
          <option value="">-- Chọn học viên --</option>
          {visibleStudents.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name} - {x.maSoHV}
              {x.graduationStatus === "graduated" ? " (đã tốt nghiệp)" : ""}
            </option>
          ))}
        </select>
        {student && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
            <div>
              <b>Đơn vị hiện tại:</b> {regionName(student.quanKhuId)} /{" "}
              {unitName(student.donViCap2Id)}
            </div>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${mode === "return" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-700"}`}>
            <input
              type="radio"
              checked={mode === "return"}
              onChange={() => {
                setMode("return");
                setTargetRegion("");
                setTargetUnit("");
              }}
            />{" "}
            Về đơn vị cũ
          </label>
          <label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${mode === "transfer" ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-700"}`}>
            <input
              type="radio"
              checked={mode === "transfer"}
              onChange={() => setMode("transfer")}
            />{" "}
            Điều chuyển đơn vị mới
          </label>
        </div>
        {mode === "transfer" && (
          <>
            <select
              required
              value={targetRegion}
              onChange={(e) => {
                setTargetRegion(e.target.value);
                setTargetUnit("");
              }}
              className="field-control"
            >
              <option value="">-- Chọn Quân khu mới --</option>
              {regions.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nameQuanKhu}
                </option>
              ))}
            </select>
            <select
              required
              disabled={!targetRegion}
              value={targetUnit}
              onChange={(e) => setTargetUnit(e.target.value)}
              className="field-control disabled:bg-slate-100"
            >
              <option value="">
                {targetRegion
                  ? "-- Chọn Sư đoàn/Lữ đoàn mới --"
                  : "-- Chọn Quân khu trước --"}
              </option>
              {targetUnits.map((x) => (
                <option
                  key={`${x.source}:${x.id}`}
                  value={`${x.source}:${x.id}`}
                >
                  {x.type} {x.name}
                </option>
              ))}
            </select>
          </>
        )}
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button
            disabled={saving}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Xác nhận tốt nghiệp & công tác"}
          </button>
        </div>
      </form>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-900">Lịch sử quyết định</h2><p className="mt-0.5 text-sm text-slate-500">Các quyết định đã được ghi nhận trong hệ thống.</p></div><div className="overflow-x-auto">
        <table className="min-w-[900px] w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Học viên</th>
              <th className="p-3 text-left">Hình thức</th>
              <th className="p-3 text-left">Đơn vị cũ</th>
              <th className="p-3 text-left">Đơn vị sau tốt nghiệp</th>
              <th className="p-3 text-left">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {history.map((x) => (
              <tr key={x.id} className="border-t">
                <td className="p-3">
                  {x.studentName}
                  <div className="text-xs text-gray-500">{x.maSoHV}</div>
                </td>
                <td className="p-3">
                  {x.type === "return" ? "Về đơn vị cũ" : "Điều chuyển"}
                </td>
                <td className="p-3">
                  {regionName(x.fromQuanKhuId)} / {unitName(x.fromDonViCap2Id)}
                </td>
                <td className="p-3">
                  {regionName(x.toQuanKhuId)} / {unitName(x.toDonViCap2Id)}
                </td>
                <td className="p-3">
                  {new Date(x.createdAt).toLocaleDateString("vi-VN")}
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  Chưa có quyết định
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div></section>
    </div>
  );
}
