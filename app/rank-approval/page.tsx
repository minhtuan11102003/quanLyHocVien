/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useEffect, useMemo, useState } from "react";
import RankApprovalTabs, {
  type ApprovalStatus,
} from "@/components/RankApprovalTabs";
import RankApprovalDetail from "@/components/RankApprovalDetail";

type Student = { id: string; name: string; maSoHV: string; capBac: string };
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
};
const categories = ["HSQ, binh sĩ", "Học viên"] as const;

export default function RankApprovalPage() {
  const [status, setStatus] = useState<ApprovalStatus>("pending");
  const [requests, setRequests] = useState<RankRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<RankRequest | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [requestCategory, setRequestCategory] =
    useState<(typeof categories)[number]>("Học viên");
  const [reason, setReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const load = async () => {
    const [r, s, ranksRes] = await Promise.all([
      fetch("http://localhost:3001/rankRequests"),
      fetch("http://localhost:3001/students"),
      fetch("http://localhost:3001/ranks"),
    ]);
    if (r.ok) setRequests(await r.json());
    if (s.ok) setStudents(await s.json());
    if (ranksRes.ok) setRanks(await ranksRes.json());
  };
  useEffect(() => {
    load().catch(console.error);
  }, []);

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
  const visible = requests.filter(
    (r) =>
      r.status === status &&
      (category === "all" || r.category === category) &&
      (!search ||
        `${r.studentName} ${r.maSoHV}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase())),
  );
  const selectedStudent = students.find((s) => s.id === studentId);
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
    if (!visibleSelected.length) return alert("Hãy chọn hồ sơ cần duyệt.");
    if (!window.confirm(`Duyệt ${visibleSelected.length} hồ sơ đã chọn?`))
      return;
    await Promise.all(
      visibleSelected.map(async (item) => {
        await fetch(`http://localhost:3001/rankRequests/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "approved",
            reviewedAt: new Date().toISOString(),
          }),
        });
        await fetch(`http://localhost:3001/students/${item.studentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ capBac: item.proposedRank }),
        });
      }),
    );
    setSelectedIds([]);
    await load();
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
    const res = await fetch(`http://localhost:3001/rankRequests/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "pending",
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

  const action = async (nextStatus: ApprovalStatus, note: string) => {
    if (
      (nextStatus === "revision_requested" || nextStatus === "rejected") &&
      !note.trim()
    )
      return alert("Vui lòng nhập ghi chú xử lý.");
    if (!selected) return;
    const res = await fetch(
      `http://localhost:3001/rankRequests/${selected.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          reviewerNote: note.trim(),
          reviewedAt: new Date().toISOString(),
        }),
      },
    );
    if (!res.ok) return alert("Không thể cập nhật hồ sơ");
    if (nextStatus === "approved")
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
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-3 text-white"
        >
          + Lập hồ sơ
        </button>
      </div>
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
            Duyệt tất cả ({visibleSelected.length})
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
              {students.map((s) => (
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
