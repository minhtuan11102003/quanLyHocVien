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
      ...sdData.map((x: any) => ({
        id: x.id,
        name: x.nameSuDoan,
        parentId: x.idQuanKhu,
        type: "Sư đoàn",
        source: "suDoan",
      })),
      ...ldData.map((x: any) => ({
        id: x.id,
        name: x.nameLuDoan,
        parentId: x.idQuanKhu,
        type: "Lữ đoàn",
        source: "luDoan",
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
    <div className="p-4">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Tốt nghiệp & điều chỉnh công tác</h1>
        <p className="mt-1 text-gray-500">
          Ghi nhận học viên tốt nghiệp, về đơn vị cũ hoặc chuyển sang đơn vị
          mới.
        </p>
      </div>
      <form
        onSubmit={submit}
        className="mb-6 max-w-3xl space-y-4 rounded-xl border bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-bold">Lập quyết định</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc mã số..."
          className="w-full rounded-lg border px-3 py-2.5"
        />
        <select
          required
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full rounded-lg border px-3 py-2.5"
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
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <div>
              <b>Đơn vị hiện tại:</b> {regionName(student.quanKhuId)} /{" "}
              {unitName(student.donViCap2Id)}
            </div>
          </div>
        )}
        <div className="flex gap-5">
          <label className="flex items-center gap-2">
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
          <label className="flex items-center gap-2">
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
              className="w-full rounded-lg border px-3 py-2.5"
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
              className="w-full rounded-lg border px-3 py-2.5 disabled:bg-gray-100"
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
        <div className="flex justify-end">
          <button
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-white disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Xác nhận tốt nghiệp & công tác"}
          </button>
        </div>
      </form>
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-[900px] w-full">
          <thead className="bg-gray-100">
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
      </div>
    </div>
  );
}
