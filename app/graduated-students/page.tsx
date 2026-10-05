"use client";
import { useEffect, useMemo, useState } from "react";
import { DataPagination, usePagination } from "@/components/DataPagination";
import type {
  Student,
  ClassItem,
  NganhDaoTao,
  QuanKhu,
} from "@/app/types/student";
type Unit = { id: string; name: string; type: string; source: string };
type UnitRecord = { id: string; nameSuDoan?: string; nameLuDoan?: string };
export default function GraduatedStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [majors, setMajors] = useState<NganhDaoTao[]>([]);
  const [regions, setRegions] = useState<QuanKhu[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState("all");
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3001/students"),
      fetch("http://localhost:3001/classes"),
      fetch("http://localhost:3001/majors"),
      fetch("http://localhost:3001/quanKhu"),
      fetch("http://localhost:3001/suDoan"),
      fetch("http://localhost:3001/luDoan"),
    ])
      .then(async ([s, c, m, q, sd, ld]) => {
        const [a, b, d, e, f, g] = await Promise.all([
          s.json(),
          c.json(),
          m.json(),
          q.json(),
          sd.json(),
          ld.json(),
        ]);
        setStudents(a);
        setClasses(b);
        setMajors(d);
        setRegions(e);
        setUnits([
          ...(f as UnitRecord[]).map((x) => ({
            id: x.id,
            name: x.nameSuDoan || "",
            type: "Sư đoàn",
            source: "suDoan",
          })),
          ...(g as UnitRecord[]).map((x) => ({
            id: x.id,
            name: x.nameLuDoan || "",
            type: "Lữ đoàn",
            source: "luDoan",
          })),
        ]);
      })
      .catch(console.error);
  }, []);
  const visible = useMemo(
    () =>
      students.filter(
        (s) =>
          s.graduationStatus === "graduated" &&
          (classId === "all" || String(s.classId) === classId) &&
          `${s.name} ${s.maSoHV}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [students, classId, search],
  );
  const unit = (id?: string) => {
    const x = units.find((u) => `${u.source}:${u.id}` === id || u.id === id);
    return x ? `${x.type} ${x.name}` : "Chưa cập nhật";
  };
  const pagination = usePagination(visible);
  return (
    <div className="page-shell">
      <div className="mb-5">
        <p className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-blue-600">Hồ sơ đào tạo</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Học viên tốt nghiệp</h1>
        <p className="mt-1 text-sm text-slate-500">Danh sách học viên đã được Nhà trường phê duyệt tốt nghiệp hoặc điều chuyển.</p>
      </div>
      <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">Hiển thị {visible.length} học viên tốt nghiệp thuộc phạm vi dữ liệu bạn được phép xem.</div>
      <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên hoặc mã số..."
          className="field-control min-w-60 flex-1"
        />
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="field-control w-auto min-w-[180px]"
        >
          <option value="all">Tất cả lớp</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="table-shell max-h-[calc(100vh-300px)]">
        <table className="min-w-[1200px] w-full">
          <thead>
            <tr>
              <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Mã số</th>
              <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Họ tên</th>
              <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Ngành</th>
              <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Lớp</th>
              <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Quân khu gốc</th>
              <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Đơn vị gốc</th>
              <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Tốt nghiệp</th>
            </tr>
          </thead>
          <tbody>
            {pagination.currentItems.map((s) => (
              <tr key={s.id} className="transition hover:bg-slate-50">
                <td className="p-3">{s.maSoHV}</td>
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3">
                  {(() => { const major = majors.find((m) => m.id === s.majorId); return major ? `${major.name}${major.shortName ? ` (${major.shortName})` : ""}` : "-"; })()}
                </td>
                <td className="p-3">
                  {classes.find((c) => String(c.id) === String(s.classId))
                    ?.name || "-"}
                </td>
                <td className="p-3">
                  {regions.find(
                    (q) => q.id === s.originQuanKhuId || q.id === s.quanKhuId,
                  )?.nameQuanKhu || "-"}
                </td>
                <td className="p-3">
                  {unit(s.originDonViCap2Id || s.donViCap2Id)}
                </td>
                <td className="p-3">
                  {s.graduatedAt
                    ? new Date(s.graduatedAt).toLocaleDateString("vi-VN")
                    : "-"}
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Chưa có học viên tốt nghiệp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <DataPagination {...pagination} totalItems={visible.length} label="học viên / trang" />
    </div>
  );
}
