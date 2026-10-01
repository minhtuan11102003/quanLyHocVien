/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useMemo, useState } from "react";
import RankApprovalTabs, {
  type ApprovalStatus,
} from "@/components/RankApprovalTabs";
import RankApprovalDetail from "@/components/RankApprovalDetail";
import { getSession, type SessionUser } from "@/components/AuthGate";

type Student = { id: string; name: string; maSoHV: string; capBac: string; daiDoiId?: string };
type CompanyUnit = { id: string; idTieuDoan?: string };
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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<RankRequest | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [requestCategory, setRequestCategory] =
    useState<(typeof categories)[number]>("Học viên");
  const [reason, setReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [session, setSession] = useState<SessionUser | null>(null);

  const load = async () => {
    const [r, s, ranksRes, companiesRes] = await Promise.all([
      fetch("http://localhost:3001/rankRequests"),
      fetch("http://localhost:3001/students"),
      fetch("http://localhost:3001/ranks"),
      fetch("http://localhost:3001/daiDoi"),
    ]);
    if (r.ok) setRequests(await r.json());
    if (s.ok) setStudents(await s.json());
    if (ranksRes.ok) setRanks(await ranksRes.json());
    if (companiesRes.ok) {
      const value = await companiesRes.json();
      setCompanies(Array.isArray(value) ? value : []);
    }
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
    const stageVisible = session?.role === "admin" || (session?.role === "battalion" && stage === "battalion" && belongsToBattalion(r)) || (session?.role === "school" && stage === "school") || (session?.role === "company" && r.submittedBy === session.id);
    return r.status === status && stageVisible && (category === "all" || r.category === category) && (!search || `${r.studentName} ${r.maSoHV}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  });
  const eligibleStudents = students.filter((student) => session?.role !== "company" || student.daiDoiId === session.unitId);
  const selectedStudent = eligibleStudents.find((s) => s.id === studentId);
  const currentRank = selectedStudent
    ? ranks.find((rank) => rank.name === selectedStudent.capBac)
    : undefined;
  const nextRank = currentRank
    ? ranks
        .filter((rank) => rank.rankOrder > currentRank.rankOrder)
        .sort((a, b) => a.rankOrder - b.rankOrder)[0]
    : undefined;

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
    if (!selectedStudent || !nextRank || !reason.trim())
      return alert("Chọn học viên đủ điều kiện và nhập căn cứ nâng cấp.");
    const payload: RankRequest = {
      id: crypto.randomUUID(),
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      maSoHV: selectedStudent.maSoHV,
      category: requestCategory,
      currentRank: selectedStudent.capBac,
      proposedRank: nextRank.name,
      reason: reason.trim(),
      submittedAt: new Date().toISOString(),
      status: "pending",
      approvalStage: "battalion",
      submittedBy: session?.id,
      submittedByRole: session?.role,
    };
    const res = await fetch("http://localhost:3001/rankRequests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return alert("Không thể tạo hồ sơ");
    setShowCreate(false);
    setStudentId("");
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
    <div className="p-4">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Phê duyệt nâng cấp bậc</h1>
          <p className="mt-1 text-gray-500">
            Quy trình xét duyệt HSQ, binh sĩ và học viên
          </p>
        </div>
        {canCreateRequest && <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-3 text-white"
        >
          + Lập hồ sơ
        </button>}
      </div>
      <div className="mb-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{session?.role === "company" ? "Đại đội: hồ sơ của bạn sẽ chờ Tiểu đoàn chuyển lên Nhà trường." : session?.role === "battalion" ? "Tiểu đoàn: chỉ hiển thị hồ sơ chờ chuyển lên Nhà trường; không có quyền phê duyệt." : session?.role === "school" ? "Nhà trường: đây là cấp phê duyệt cuối cùng." : "Admin: có thể xem và xử lý toàn bộ luồng."}</div>
      <RankApprovalTabs active={status} counts={counts} onChange={setStatus} />
      <div className="my-4 flex flex-wrap gap-3 rounded-xl border bg-white p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm học viên hoặc mã số..."
          className="min-w-60 flex-1 rounded-lg border px-3 py-2"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border px-3 py-2"
        >
          <option value="all">Tất cả đối tượng</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={() => setSelectedIds(visible.map((item) => item.id))}
          className="rounded-lg border px-3 py-2"
        >
          Chọn tất cả
        </button>
        {status === "pending" && (
          <button
            onClick={approveBulk}
            className="rounded-lg bg-green-600 px-3 py-2 text-white"
          >
            {session?.role === "battalion" ? "Gửi Nhà trường" : "Phê duyệt cuối"} ({visibleSelected.length})
          </button>
        )}
        {status === "approved" && (
          <button
            onClick={exportBulk}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-white"
          >
            Xuất quyết định ({visibleSelected.length})
          </button>
        )}
      </div>
      <div className="max-h-[calc(100vh-230px)] overflow-auto rounded-xl border bg-white">
        <table className="min-w-[900px] w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">
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
              <th className="p-3 text-left">Học viên</th>
              <th className="p-3 text-left">Đối tượng</th>
              <th className="p-3 text-left">Cấp bậc</th>
              <th className="p-3 text-left">Ngày gửi</th>
              <th className="p-3 text-left">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelected(item.id)}
                  />
                </td>
                <td className="p-3">
                  {item.studentName}
                  <div className="text-xs text-gray-500">{item.maSoHV}</div>
                </td>
                <td className="p-3">{item.category}</td>
                <td className="p-3">
                  {item.currentRank} → {item.proposedRank}
                </td>
                <td className="p-3">
                  {new Date(item.submittedAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => setSelected(item)}
                    className="rounded bg-gray-700 px-3 py-1.5 text-white"
                  >
                    Xem / xử lý
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  Không có hồ sơ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full rounded border p-2"
            >
              <option value="">-- Chọn học viên --</option>
              {eligibleStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.capBac}
                </option>
              ))}
            </select>
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
            <p className="text-sm text-gray-600">
              Cấp đề nghị:{" "}
              <b>
                {selectedStudent
                  ? `${selectedStudent.capBac} → ${nextRank?.name ?? "Không có bậc kế tiếp"}`
                  : "-"}
              </b>
            </p>
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
        className="w-full max-w-2xl rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
