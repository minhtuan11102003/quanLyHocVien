/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useMemo, useState } from "react";
import RankApprovalTabs, {
  type ApprovalStatus,
} from "@/components/RankApprovalTabs";
import RankApprovalDetail from "@/components/RankApprovalDetail";
import { getSession, type SessionUser } from "@/components/AuthGate";
import { DataPagination, usePagination } from "@/components/DataPagination";

type Student = { id: string; name: string; maSoHV: string; capBac: string; majorId: string; classId: string; daiDoiId?: string; graduationStatus?: string };
type CompanyUnit = { id: string; nameDaiDoi?: string; idTieuDoan?: string };
type ClassItem = { id: string; name: string; majorId: string; daiDoiId?: string };
type Major = { id: string; name: string; shortName?: string };
type Rank = { id: string; name: string; rankOrder: number };
type RankRequest = {
  id: string;
  studentId: string;
  studentName: string;
  maSoHV: string;
  category: "HSQ, binh sĩ" | "Học viên";
  currentRank: string;
  proposedRank: string;
  reason: string;
  submittedAt: string;
  status: ApprovalStatus;
  reviewerNote?: string;
  approvalStage?: "battalion" | "school" | "completed";
  submittedBy?: string;
  submittedByRole?: SessionUser["role"];
};
const categories = ["HSQ, binh sĩ", "Học viên"] as const;

export default function RankApprovalPage() {
  const [status, setStatus] = useState<ApprovalStatus>("pending");
  const [requests, setRequests] = useState<RankRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [companies, setCompanies] = useState<CompanyUnit[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<RankRequest | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [majorId, setMajorId] = useState("");
  const [classId, setClassId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [candidateIds, setCandidateIds] = useState<string[]>([]);
  const [requestCategory, setRequestCategory] =
    useState<(typeof categories)[number]>("Học viên");
  const [reason, setReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [session, setSession] = useState<SessionUser | null>(null);

  const load = async () => {
    const [r, s, ranksRes, companiesRes, classesRes, majorsRes] = await Promise.all([
      fetch("http://localhost:3001/rankRequests"),
      fetch("http://localhost:3001/students"),
      fetch("http://localhost:3001/ranks"),
      fetch("http://localhost:3001/daiDoi"),
      fetch("http://localhost:3001/classes"),
      fetch("http://localhost:3001/majors"),
    ]);
    if (r.ok) setRequests(await r.json());
    if (s.ok) setStudents(await s.json());
    if (ranksRes.ok) setRanks(await ranksRes.json());
    if (companiesRes.ok) {
      const value = await companiesRes.json();
      setCompanies(Array.isArray(value) ? value : []);
    }
    if (classesRes.ok) setClasses(await classesRes.json());
    if (majorsRes.ok) setMajors(await majorsRes.json());
  };
  useEffect(() => {
    setSession(getSession());
    load().catch(console.error);
  }, []);

  const stageOf = (request: RankRequest) => request.approvalStage || (request.status === "approved" ? "completed" : "battalion");
  const hasPermission = (permission: string) => session?.role === "admin" || Boolean(session?.permissions?.includes(permission));
  const studentForRequest = (request: RankRequest) => students.find((student) => String(student.id) === String(request.studentId));
  const belongsToBattalion = (request: RankRequest) => {
    if (session?.role !== "battalion") return false;
    const student = studentForRequest(request);
    if (!student?.daiDoiId) return false;
    const company = companies.find((unit) => String(unit.id) === String(student.daiDoiId));
    return String(company?.idTieuDoan ?? "") === String(session.unitId ?? "");
  };
  const canReviewStage = (request: RankRequest) => session?.role === "admin" || (session?.role === "school" && stageOf(request) === "school" && hasPermission("approve_school"));
  const canForwardStage = (request: RankRequest) => session?.role === "battalion" && stageOf(request) === "battalion" && belongsToBattalion(request) && hasPermission("submit_school");
  const canCreateRequest = session?.role === "admin" || (session?.role === "company" && hasPermission("create_rank_request"));
  const stageLabel = (request: RankRequest) => request.status === "approved" ? "Nhà trường đã duyệt" : request.status === "revision_requested" ? "Yêu cầu chỉnh sửa" : request.status === "rejected" ? "Đã từ chối" : stageOf(request) === "battalion" ? "Chờ Tiểu đoàn" : stageOf(request) === "school" ? "Tiểu đoàn đã chuyển · chờ Nhà trường" : "Đã hoàn tất";

  const counts = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === "pending").length,
      revision_requested: requests.filter(
        (r) => r.status === "revision_requested",
      ).length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }),
    [requests],
  );
  const visible = requests.filter((r) => {
    const stage = stageOf(r);
    const stageVisible = session?.role === "admin" || (session?.role === "battalion" && belongsToBattalion(r)) || (session?.role === "school" && (stage === "school" || stage === "completed")) || (session?.role === "company" && r.submittedBy === session.id);
    return r.status === status && stageVisible && (category === "all" || r.category === category) && (!search || `${r.studentName} ${r.maSoHV}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  });
  const pagination = usePagination(visible);
  const eligibleStudents = students.filter((student) => student.graduationStatus !== "graduated" && (session?.role !== "company" || student.daiDoiId === session.unitId));
  const availableMajors = majors.filter((major) => classes.some((item) => String(item.majorId) === String(major.id) && (!companyId || String(item.daiDoiId) === String(companyId))));
  const availableClasses = classes.filter((item) => (!companyId || String(item.daiDoiId) === String(companyId)) && (!majorId || String(item.majorId) === String(majorId)));
  const filteredStudents = eligibleStudents.filter((student) => (!companyId || String(student.daiDoiId) === String(companyId)) && (!majorId || String(student.majorId) === String(majorId)) && (!classId || String(student.classId) === String(classId)) && (!studentSearch.trim() || `${student.name} ${student.maSoHV}`.toLocaleLowerCase().includes(studentSearch.trim().toLocaleLowerCase())));
  const selectedCandidates = filteredStudents.filter((student) => candidateIds.includes(student.id));

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  const visibleSelected = visible.filter((item) =>
    selectedIds.includes(item.id),
  );
  const approveBulk = async () => {
    if (!visibleSelected.length) return alert("Hãy chọn hồ sơ cần xử lý.");
    if (!visibleSelected.every((item) => canReviewStage(item) || canForwardStage(item))) return alert("Tài khoản không có quyền xử lý một hoặc nhiều hồ sơ.");
    if (visibleSelected.some((item) => canReviewStage(item) && stageOf(item) === "school" && !studentForRequest(item))) return alert("Có hồ sơ không còn học viên liên kết, không thể phê duyệt.");
    if (!window.confirm(`${session?.role === "battalion" ? "Gửi" : "Phê duyệt"} ${visibleSelected.length} hồ sơ đã chọn?`)) return;
    await Promise.all(visibleSelected.map(async (item) => {
      const forwarding = canForwardStage(item);
      const finalApproval = session?.role === "admin" || canReviewStage(item) && stageOf(item) === "school";
      await fetch(`http://localhost:3001/rankRequests/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: finalApproval ? "approved" : "pending", approvalStage: finalApproval ? "completed" : "school", reviewedAt: new Date().toISOString(), reviewedBy: session?.id, reviewedByRole: session?.role, forwardedAt: forwarding ? new Date().toISOString() : undefined }) });
      if (finalApproval) await fetch(`http://localhost:3001/students/${item.studentId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ capBac: item.proposedRank }) });
    }));
    setSelectedIds([]); await load();
  };
  const exportBulk = async () => {
    if (!visibleSelected.length)
      return alert("Hãy chọn hồ sơ đã duyệt để xuất.");
    const response = await fetch("/api/export-rank-decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requests: visibleSelected }),
    });
    if (!response.ok) return alert("Không thể xuất quyết định.");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(await response.blob());
    link.download = "quyet-dinh-thang-cap-tap-the.zip";
    link.click();
  };

  const createRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canCreateRequest) return alert("Chỉ Đại đội hoặc Admin được lập yêu cầu nâng quân hàm.");
    if (!selectedCandidates.length || !reason.trim()) return alert("Chọn ít nhất một học viên và nhập căn cứ nâng cấp.");
    const invalid = selectedCandidates.filter((student) => !ranks.some((rank) => rank.rankOrder > (ranks.find((rank) => rank.name === student.capBac)?.rankOrder ?? Number.MAX_SAFE_INTEGER)));
    if (invalid.length) return alert(`Không tìm thấy cấp bậc kế tiếp cho: ${invalid.map((student) => student.name).join(", ")}.`);
    const responses = await Promise.all(selectedCandidates.map((student) => {
      const currentRank = ranks.find((rank) => rank.name === student.capBac)!;
      const nextRank = ranks.filter((rank) => rank.rankOrder > currentRank.rankOrder).sort((a, b) => a.rankOrder - b.rankOrder)[0];
      const payload: RankRequest = { id: crypto.randomUUID(), studentId: student.id, studentName: student.name, maSoHV: student.maSoHV, category: requestCategory, currentRank: student.capBac, proposedRank: nextRank.name, reason: reason.trim(), submittedAt: new Date().toISOString(), status: "pending", approvalStage: "battalion", submittedBy: session?.id, submittedByRole: session?.role };
      return fetch("http://localhost:3001/rankRequests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }));
    if (responses.some((response) => !response.ok)) return alert("Có hồ sơ không thể tạo. Vui lòng kiểm tra lại dữ liệu.");
    setShowCreate(false);
    setCandidateIds([]); setCompanyId(""); setMajorId(""); setClassId(""); setStudentSearch("");
    setReason("");
    await load();
    setStatus("pending");
  };

  const resubmit = async (reasonText: string) => {
    if (!selected) return;
    if (session?.role !== "admin" && !(session?.role === "company" && selected.submittedBy === session.id)) return alert("Bạn không có quyền gửi lại hồ sơ này.");
    const res = await fetch(`http://localhost:3001/rankRequests/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "pending",
        approvalStage: selected.approvalStage || "battalion",
        reason: reasonText,
        reviewerNote: "",
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
      }),
    });
    if (!res.ok) return alert("Không thể gửi lại hồ sơ chờ duyệt");
    setSelected(null);
    setStatus("pending");
    await load();
  };

  const action = async (nextStatus: ApprovalStatus | "forward", note: string) => {
    if (
      (nextStatus === "revision_requested" || nextStatus === "rejected") &&
      !note.trim()
    )
      return alert("Vui lòng nhập ghi chú xử lý.");
    if (!selected) return;
    if (nextStatus === "approved" && !studentForRequest(selected)) return alert("Hồ sơ không còn học viên liên kết, không thể phê duyệt.");
    if (nextStatus === "forward") {
      if (!canForwardStage(selected)) return alert("Tiểu đoàn chỉ được chuyển hồ sơ thuộc Tiểu đoàn mình.");
      const forwarded = await fetch(`http://localhost:3001/rankRequests/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "pending", approvalStage: "school", forwardedAt: new Date().toISOString(), forwardedBy: session?.id, forwardedByRole: session?.role }) });
      if (!forwarded.ok) return alert("Không thể gửi hồ sơ lên Nhà trường");
      setSelected(null); await load(); return;
    }
    if (!canReviewStage(selected)) return alert("Chỉ Nhà trường hoặc Admin mới được phê duyệt hồ sơ.");
    const nextStage = nextStatus === "approved" ? ((session?.role === "admin" || stageOf(selected) === "school") ? "completed" : "school") : stageOf(selected);
    const res = await fetch(
      `http://localhost:3001/rankRequests/${selected.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          reviewerNote: note.trim(),
          approvalStage: nextStage,
          reviewedAt: new Date().toISOString(),
          reviewedBy: session?.id,
          reviewedByRole: session?.role,
        }),
      },
    );
    if (!res.ok) return alert("Không thể cập nhật hồ sơ");
    if (nextStatus === "approved" && nextStage === "completed")
      await fetch(`http://localhost:3001/students/${selected.studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capBac: selected.proposedRank }),
      });
    setSelected(null);
    await load();
  };

  return (
    <div className="page-shell">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-blue-600">Quy trình xét duyệt</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">Phê duyệt nâng cấp bậc</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quy trình xét duyệt HSQ, binh sĩ và học viên
          </p>
        </div>
        {canCreateRequest && <button
          onClick={() => setShowCreate(true)}
          className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Lập hồ sơ
        </button>}
      </div>
      <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">{session?.role === "company" ? "Đại đội: theo dõi hồ sơ của mình đang chờ Tiểu đoàn, đã chuyển Nhà trường hay đã duyệt." : session?.role === "battalion" ? "Tiểu đoàn: xem toàn bộ hồ sơ thuộc đơn vị; chỉ chuyển các hồ sơ đang chờ cấp mình lên Nhà trường." : session?.role === "school" ? "Nhà trường: xem hồ sơ đã được chuyển lên và kết quả phê duyệt cuối." : "Admin: có thể xem và xử lý toàn bộ luồng."}</div>
      <RankApprovalTabs active={status} counts={counts} onChange={setStatus} />
      <div className="my-4 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm học viên hoặc mã số..."
          className="field-control min-w-60 flex-1"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="field-control w-auto min-w-[180px]"
        >
          <option value="all">Tất cả đối tượng</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={() => setSelectedIds(visible.map((item) => item.id))}
          className="field-control w-auto min-w-[180px]"
        >
          Chọn tất cả
        </button>
        {status === "pending" && (
          <button
            onClick={approveBulk}
            className="rounded-xl bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {session?.role === "battalion" ? "Gửi Nhà trường" : "Phê duyệt cuối"} ({visibleSelected.length})
          </button>
        )}
        {status === "approved" && (
          <button
            onClick={exportBulk}
            className="rounded-xl bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Xuất quyết định ({visibleSelected.length})
          </button>
        )}
      </div>
      <div className="table-shell max-h-[calc(100vh-280px)]">
        <table className="min-w-[900px] w-full">
          <thead>
            <tr>
              <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <input
                  type="checkbox"
                  checked={
                    visible.length > 0 &&
                    visible.every((item) => selectedIds.includes(item.id))
                  }
                  onChange={() =>
                    setSelectedIds(
                      visible.every((item) => selectedIds.includes(item.id))
                        ? []
                        : visible.map((item) => item.id),
                    )
                  }
                />
              </th>
              <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Học viên</th>
              <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Đối tượng</th>
              <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Cấp bậc</th>
              <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Tiến độ</th>
              <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Ngày gửi</th>
              <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pagination.currentItems.map((item) => (
              <tr key={item.id} className="transition hover:bg-slate-50">
                <td className="p-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelected(item.id)}
                  />
                </td>
                <td className="p-3 text-sm text-slate-700">
                  {item.studentName}
                  <div className="text-xs text-gray-500">{item.maSoHV}</div>
                </td>
                <td className="p-3 text-sm text-slate-700">{item.category}</td>
                <td className="p-3 text-sm text-slate-700">
                  {item.currentRank} → {item.proposedRank}
                </td>
                <td className="p-3 text-sm text-slate-700">{stageLabel(item)}</td>
                <td className="p-3 text-sm text-slate-700">
                  {new Date(item.submittedAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="p-3 text-sm text-slate-700">
                  <button
                    onClick={() => setSelected(item)}
                    className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Xem / xử lý
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Không có hồ sơ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <DataPagination {...pagination} totalItems={visible.length} label="hồ sơ / trang" />
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <RankApprovalDetail
            item={selected}
            onClose={() => setSelected(null)}
            onAction={action}
            onResubmit={resubmit}
            canReview={canReviewStage(selected)}
            canForward={canForwardStage(selected)}
            canResubmit={session?.role === "company" && selected.submittedBy === session.id}
          />
        </Modal>
      )}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <form onSubmit={createRequest} className="space-y-4 p-5">
            <h2 className="text-xl font-bold">Lập hồ sơ nâng cấp</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setMajorId(""); setClassId(""); setCandidateIds([]); }} className="field-control"><option value="">-- Chọn Đại đội --</option>{companies.filter((company) => session?.role !== "company" || company.id === session.unitId).map((company) => <option key={company.id} value={company.id}>{company.nameDaiDoi || company.id}</option>)}</select>
              <select value={majorId} disabled={!companyId} onChange={(e) => { setMajorId(e.target.value); setClassId(""); setCandidateIds([]); }} className="field-control"><option value="">-- Chọn chuyên ngành --</option>{availableMajors.map((major) => <option key={major.id} value={major.id}>{major.name}{major.shortName ? ` (${major.shortName})` : ""}</option>)}</select>
              <select value={classId} disabled={!majorId} onChange={(e) => { setClassId(e.target.value); setCandidateIds([]); }} className="field-control"><option value="">Tất cả lớp học</option>{availableClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            </div>
            <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Tìm tên hoặc mã học viên..." className="field-control" />
            <div className="overflow-hidden rounded-xl border"><div className="flex items-center justify-between bg-slate-50 p-3"><span className="text-sm font-semibold">Học viên ({selectedCandidates.length}/{filteredStudents.length} đã chọn)</span><button type="button" onClick={() => setCandidateIds(filteredStudents.length && filteredStudents.every((student) => candidateIds.includes(student.id)) ? [] : filteredStudents.map((student) => student.id))} className="text-sm font-semibold text-blue-700">{filteredStudents.length && filteredStudents.every((student) => candidateIds.includes(student.id)) ? "Bỏ chọn tất cả" : "Chọn tất cả"}</button></div>{majorId ? <div className="max-h-56 overflow-y-auto">{filteredStudents.map((student) => { const current = ranks.find((rank) => rank.name === student.capBac); const next = current && ranks.filter((rank) => rank.rankOrder > current.rankOrder).sort((a, b) => a.rankOrder - b.rankOrder)[0]; return <label key={student.id} className="flex items-center gap-3 border-t p-3"><input type="checkbox" checked={candidateIds.includes(student.id)} disabled={!next} onChange={() => setCandidateIds((items) => items.includes(student.id) ? items.filter((id) => id !== student.id) : [...items, student.id])} /><span className="flex-1"><b>{student.name}</b><span className="ml-2 text-xs text-slate-500">{student.maSoHV}</span></span><span className="text-sm text-slate-600">{student.capBac} → {next?.name || "Không có bậc kế tiếp"}</span></label>; })}</div> : <p className="p-4 text-sm text-slate-500">Chọn Đại đội và Chuyên ngành để xem học viên.</p>}</div>
            <select
              value={requestCategory}
              onChange={(e) =>
                setRequestCategory(e.target.value as typeof requestCategory)
              }
              className="w-full rounded border p-2"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
              placeholder="Thời gian giữ cấp, kết quả học tập/rèn luyện, căn cứ hoặc thành tích..."
              className="w-full rounded border p-2"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded border px-3 py-2"
              >
                Hủy
              </button>
              <button className="rounded bg-blue-600 px-3 py-2 text-white">
                Gửi chờ duyệt
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
