/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/components/AuthGate";
import { GraduationCompanyRequest } from "@/components/graduation/GraduationCompanyRequest";
import { GraduationDecisionHistory } from "@/components/graduation/GraduationDecisionHistory";
import { GraduationReturnList } from "@/components/graduation/GraduationReturnList";
import { GraduationTransferList } from "@/components/graduation/GraduationTransferList";

type Student = {
  id: string;
  name: string;
  maSoHV: string;
  classId: string;
  daiDoiId?: string;
  quanKhuId?: string;
  donViCap2Id?: string;
  graduationStatus?: string;
  originQuanKhuId?: string;
  originDonViCap2Id?: string;
};
type ClassItem = { id: string; name: string; daiDoiId?: string };
type Company = { id: string; nameDaiDoi: string };
type Region = { id: string; nameQuanKhu: string };
type Unit = {
  id: string;
  name: string;
  parentId: string;
  type: string;
  source: "suDoan" | "luDoan";
};
type UnitRecord = {
  id: string;
  idQuanKhu: string;
  nameSuDoan?: string;
  nameLuDoan?: string;
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
type GraduationRequest = { status: string; items: { studentId: string }[] };
type Destination = { region: string; unit: string };
type Decision = Destination & { transfer: boolean };
const API = "http://localhost:3001";

export default function GraduationPage() {
  const [session] = useState(() => getSession());
  const companyLocked = session?.role === "company";
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [history, setHistory] = useState<Transfer[]>([]);
  const [requests, setRequests] = useState<GraduationRequest[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"return" | "transfer">("return");
  const [section, setSection] = useState<"request" | "history">("request");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [saving, setSaving] = useState(false);
  const load = async () => {
    const responses = await Promise.all(
      [
        "students",
        "classes",
        "daiDoi",
        "quanKhu",
        "suDoan",
        "luDoan",
        "graduationTransfers",
        "graduationRequests",
      ].map((path) => fetch(`${API}/${path}`)),
    );
    const values = await Promise.all(
      responses.map(async (response) => (response.ok ? response.json() : [])),
    );
    setStudents(values[0]);
    setClasses(values[1]);
    setCompanies(values[2]);
    if (companyLocked) setCompanyId(String(session?.unitId || ""));
    setRegions(values[3]);
    setHistory(values[6]);
    setRequests(values[7]);
    setUnits([
      ...(values[4] as UnitRecord[]).map((item) => ({
        id: item.id,
        name: item.nameSuDoan || "Chưa đặt tên",
        parentId: item.idQuanKhu,
        type: "Sư đoàn",
        source: "suDoan" as const,
      })),
      ...(values[5] as UnitRecord[]).map((item) => ({
        id: item.id,
        name: item.nameLuDoan || "Chưa đặt tên",
        parentId: item.idQuanKhu,
        type: "Lữ đoàn",
        source: "luDoan" as const,
      })),
    ]);
  };
  // Tải dữ liệu khi mở màn hình.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load().catch(console.error);
  }, []);
  const oldDestination = (student: Student): Destination => ({
    region: student.originQuanKhuId || student.quanKhuId || "",
    unit: student.originDonViCap2Id || student.donViCap2Id || "",
  });
  const decisionFor = (id: string): Decision =>
    decisions[id] || { transfer: false, region: "", unit: "" };
  const setDecision = (id: string, patch: Partial<Decision>) =>
    setDecisions((current) => ({
      ...current,
      [id]: { ...decisionFor(id), ...current[id], ...patch },
    }));
  const regionName = (id?: string) =>
    regions.find((item) => item.id === id)?.nameQuanKhu || "Chưa cập nhật";
  const unitName = (id?: string) => {
    const item = units.find(
      (unit) => `${unit.source}:${unit.id}` === id || unit.id === id,
    );
    return item ? `${item.type} ${item.name}` : "Chưa cập nhật";
  };
  const availableClasses = useMemo(
    () =>
      classes.filter(
        (item) => !companyId || String(item.daiDoiId) === String(companyId),
      ),
    [classes, companyId],
  );
  const pendingStudentIds = useMemo(
    () =>
      new Set(
        requests
          .filter((request) => request.status === "pending")
          .flatMap((request) =>
            request.items.map((item) => String(item.studentId)),
          ),
      ),
    [requests],
  );
  const eligible = useMemo(
    () =>
      students.filter(
        (student) =>
          student.graduationStatus !== "graduated" &&
          !pendingStudentIds.has(String(student.id)) &&
          (!companyId || String(student.daiDoiId) === String(companyId)) &&
          (!classId || String(student.classId) === String(classId)),
      ),
    [students, companyId, classId, pendingStudentIds],
  );
  const visible = useMemo(() => {
    const key = search.trim().toLocaleLowerCase();
    return eligible.filter(
      (student) =>
        !key ||
        `${student.name} ${student.maSoHV}`.toLocaleLowerCase().includes(key),
    );
  }, [eligible, search]);
  const selected = eligible.filter((student) =>
    selectedIds.includes(student.id),
  );
  const toggle = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  const toggleAll = () =>
    setSelectedIds((current) =>
      visible.length && visible.every((student) => current.includes(student.id))
        ? current.filter((id) => !visible.some((student) => student.id === id))
        : [...new Set([...current, ...visible.map((student) => student.id)])],
    );
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected.length) return alert("Hãy tick ít nhất một học viên.");
    if (
      selected.some((student) => {
        const decision = decisionFor(student.id);
        return mode === "transfer" && (!decision.region || !decision.unit);
      })
    )
      return alert(
        "Vui lòng chọn đầy đủ đơn vị mới cho các học viên điều chuyển.",
      );
    setSaving(true);
    const items = selected.map((student) => {
      const decision = decisionFor(student.id);
      const target = mode === "transfer" ? decision : oldDestination(student);
      return {
        studentId: student.id,
        type: mode,
        target,
      };
    });
    try {
      const response = await fetch(`${API}/graduationRequests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể gửi hồ sơ");
      setSelectedIds([]);
      setDecisions({});
      alert(
        "Đã gửi hồ sơ chờ Tiểu đoàn phê duyệt. Học viên chưa được ghi nhận tốt nghiệp cho đến khi Nhà trường duyệt.",
      );
      await load();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Không thể gửi hồ sơ");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="page-shell space-y-5">
      <header className="rounded-3xl bg-gradient-to-br from-emerald-700 to-teal-700 p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-100">
          Điều hành đào tạo
        </p>
        <h1 className="mt-2 text-2xl font-bold">Tốt nghiệp & điều chuyển</h1>
        <p className="mt-2 text-sm text-emerald-50">Tách riêng danh sách về đơn vị cũ và danh sách điều chuyển đơn vị mới.</p>
      </header>
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <button type="button" onClick={() => setSection("request")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold ${section === "request" ? "bg-emerald-600 text-white" : "text-slate-600"}`}>Đại đội yêu cầu</button>
        <button type="button" onClick={() => setSection("history")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold ${section === "history" ? "bg-blue-600 text-white" : "text-slate-600"}`}>Lịch sử quyết định</button>
      </div>
      {section === "request" ? <GraduationCompanyRequest onSubmit={submit}>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="field-label">
            Đại đội
            <select
              value={companyId}
              onChange={(event) => {
                setCompanyId(event.target.value);
                setClassId("");
                setSelectedIds([]);
              }}
              className="field-control mt-1"
            >
              <option value="">Tất cả Đại đội</option>
              {companies.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nameDaiDoi}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Lớp học
            <select
              value={classId}
              disabled={!companyId}
              onChange={(event) => {
                setClassId(event.target.value);
                setSelectedIds([]);
              }}
              className="field-control mt-1"
            >
              <option value="">Tất cả lớp</option>
              {availableClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Tìm học viên
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="field-control mt-1"
              placeholder="Tên hoặc mã học viên..."
            />
          </label>
        </div>
        <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => { setMode("return"); setSelectedIds([]); }}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold ${mode === "return" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600"}`}
          >
            Tốt nghiệp về đơn vị cũ
          </button>
          <button
            type="button"
            onClick={() => { setMode("transfer"); setSelectedIds([]); }}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold ${mode === "transfer" ? "bg-sky-600 text-white shadow-sm" : "text-slate-600"}`}
          >
            Điều chuyển đơn vị mới
          </button>
        </div>
        <section className="overflow-hidden rounded-2xl border">
          <div className="flex justify-between gap-3 border-b bg-slate-50 p-3">
            <span className="text-sm font-semibold">
              Học viên chưa tốt nghiệp: {visible.length}
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-sm font-semibold text-emerald-700"
            >
              {visible.length &&
              visible.every((student) => selectedIds.includes(student.id))
                ? "Bỏ chọn tất cả"
                : mode === "return" ? "Chọn tất cả (về đơn vị cũ)" : "Chọn tất cả điều chuyển"}
            </button>
          </div>
          <div className="max-h-[min(52vh,620px)] overflow-y-auto overscroll-contain">
            {mode === "return" ? (
              <GraduationReturnList
                students={visible}
                selectedIds={selectedIds}
                onToggle={toggle}
                regionName={regionName}
                unitName={unitName}
                oldDestination={oldDestination}
              />
            ) : (
              <GraduationTransferList
                students={visible}
                selectedIds={selectedIds}
                destinations={Object.fromEntries(Object.entries(decisions).map(([id, value]) => [id, { region: value.region, unit: value.unit }]))}
                onToggle={toggle}
                onDestinationChange={(id, patch) => setDecision(id, { ...patch, transfer: true })}
                regions={regions}
                units={units}
              />
            )}
            {!visible.length && (
              <p className="p-6 text-center text-sm text-slate-500">
                Không có học viên chưa tốt nghiệp phù hợp.
              </p>
            )}
          </div>
        </section>
        <div className="flex items-center justify-between border-t pt-4">
          <span className="text-sm">
            Đã chọn: <b>{selected.length}</b> học viên · {mode === "return" ? "về đơn vị cũ" : "điều chuyển đơn vị mới"}
          </span>
          <button
            disabled={saving || !selected.length}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : `Gửi ${selected.length} học viên chờ duyệt`}
          </button>
        </div>
      </GraduationCompanyRequest> : <GraduationDecisionHistory history={history} regionName={regionName} unitName={unitName} />}
    </div>
  );
}
