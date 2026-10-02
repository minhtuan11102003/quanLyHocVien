/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import { getSession, type SessionUser } from "@/components/AuthGate";

type ApprovalStatus = "pending" | "approved" | "rejected";
type Item = { studentId: string; type: "return" | "transfer"; target: { region: string; unit: string } };
type Request = { id: string; items: Item[]; status: ApprovalStatus; approvalStage: "battalion" | "school" | "completed"; submittedAt: string; reviewerNote?: string };
type Student = { id: string; name: string; maSoHV: string };
const API = "http://localhost:3001";
const tabs: { key: ApprovalStatus; label: string; active: string }[] = [
  { key: "pending", label: "Chờ duyệt", active: "bg-amber-600 text-white shadow-sm" },
  { key: "approved", label: "Đã duyệt", active: "bg-emerald-600 text-white shadow-sm" },
  { key: "rejected", label: "Đã từ chối", active: "bg-red-600 text-white shadow-sm" },
];

export default function GraduationApprovalPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [status, setStatus] = useState<ApprovalStatus>("pending");
  const [note, setNote] = useState<Record<string, string>>({});
  const load = async () => {
    const [requestResponse, studentResponse] = await Promise.all([fetch(`${API}/graduationRequests`), fetch(`${API}/students`)]);
    if (requestResponse.ok) setRequests(await requestResponse.json());
    if (studentResponse.ok) setStudents(await studentResponse.json());
  };
  useEffect(() => { setSession(getSession()); load().catch(console.error); }, []);
  const process = async (request: Request, action: "forward" | "approved" | "rejected") => {
    const body = action === "forward" ? { approvalStage: "school" } : { status: action, reviewerNote: note[request.id] || "" };
    const response = await fetch(`${API}/graduationRequests/${request.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) return alert((await response.json().catch(() => null))?.error || "Không thể xử lý hồ sơ");
    await load();
  };
  const counts = useMemo(() => ({ pending: requests.filter((request) => request.status === "pending").length, approved: requests.filter((request) => request.status === "approved").length, rejected: requests.filter((request) => request.status === "rejected").length }), [requests]);
  const visible = requests.filter((request) => request.status === status);
  const canReview = ["school", "admin"].includes(session?.role || "");
  const stageLabel = (request: Request) => request.status === "approved" ? "Đã duyệt" : request.status === "rejected" ? "Đã từ chối" : request.approvalStage === "battalion" ? "Chờ Tiểu đoàn" : "Chờ Nhà trường/Admin";
  const statusStyle = (request: Request) => request.status === "approved" ? "bg-emerald-100 text-emerald-800" : request.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800";

  return <div className="page-shell space-y-5">
    <header className="rounded-3xl bg-gradient-to-br from-amber-600 to-orange-700 p-6 text-white"><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-100">Quy trình phê duyệt</p><h1 className="mt-2 text-2xl font-bold">Phê duyệt tốt nghiệp & điều chuyển</h1><p className="mt-2 text-sm text-amber-50">Đại đội gửi → Tiểu đoàn chuyển → Nhà trường phê duyệt cuối; Admin có thể xử lý trực tiếp mọi hồ sơ.</p></header>
    <nav className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm" aria-label="Lọc trạng thái hồ sơ">
      {tabs.map((tab) => <button key={tab.key} type="button" onClick={() => setStatus(tab.key)} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${status === tab.key ? tab.active : "text-slate-600 hover:bg-slate-100"}`}>{tab.label}<span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${status === tab.key ? "bg-white/20" : "bg-slate-100"}`}>{counts[tab.key]}</span></button>)}
    </nav>
    <section className="overflow-hidden rounded-3xl border bg-white shadow-sm"><div className="border-b p-5"><h2 className="font-bold text-slate-900">{tabs.find((tab) => tab.key === status)?.label} ({visible.length})</h2></div><div className="overflow-auto"><table className="min-w-[860px] w-full"><thead className="bg-slate-50"><tr><th className="p-3 text-left">Thời gian gửi</th><th className="p-3 text-left">Học viên & quyết định</th><th className="p-3 text-left">Giai đoạn</th><th className="p-3 text-left">Trạng thái</th><th className="p-3 text-left">Thao tác</th></tr></thead><tbody>{visible.map((request) => {
      const canReviewRequest = canReview && request.status === "pending" && (session?.role === "admin" || request.approvalStage === "school");
      return <tr key={request.id} className="border-t align-top"><td className="p-3 text-xs text-slate-500">{new Date(request.submittedAt).toLocaleString("vi-VN")}</td><td className="p-3">{request.items.map((item) => { const student = students.find((entry) => String(entry.id) === String(item.studentId)); return <div key={item.studentId} className="mb-2 last:mb-0"><b>{student?.name || "Học viên đã bị xoá"}</b><span className="ml-2 text-xs text-slate-500">{student?.maSoHV || item.studentId}</span><span className="ml-2 text-xs text-slate-600">{item.type === "transfer" ? "Điều chuyển đơn vị mới" : "Về đơn vị cũ"}</span></div>; })}</td><td className="p-3 text-sm text-slate-600">{stageLabel(request)}</td><td className="p-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle(request)}`}>{request.status === "pending" ? "Chờ duyệt" : stageLabel(request)}</span></td><td className="p-3"><div className="flex flex-wrap gap-2">{session?.role === "battalion" && request.approvalStage === "battalion" && request.status === "pending" && <button onClick={() => process(request, "forward")} className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium text-white">Gửi Nhà trường</button>}{canReviewRequest && <><input value={note[request.id] || ""} onChange={(event) => setNote({ ...note, [request.id]: event.target.value })} className="w-40 rounded-lg border px-2 py-1 text-sm" placeholder="Ghi chú (nếu có)" /><button onClick={() => process(request, "rejected")} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white">Từ chối</button><button onClick={() => process(request, "approved")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white">Duyệt</button></>}</div>{request.reviewerNote && <p className="mt-2 max-w-xs whitespace-pre-wrap text-xs text-amber-700">Ghi chú: {request.reviewerNote}</p>}</td></tr>;
    })}{!visible.length && <tr><td colSpan={5} className="p-10 text-center text-slate-500">Không có hồ sơ thuộc trạng thái này.</td></tr>}</tbody></table></div></section>
  </div>;
}
