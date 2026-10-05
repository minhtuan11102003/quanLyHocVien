/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import { getSession, type SessionUser } from "@/components/AuthGate";

type ApprovalStatus = "pending" | "approved" | "rejected";
type Item = { studentId: string; type: "return" | "transfer"; target: { region: string; unit: string } };
type Request = { id: string; items: Item[]; status: ApprovalStatus; approvalStage: "battalion" | "school" | "completed"; submittedAt: string; reviewerNote?: string };
type Student = { id: string; name: string; maSoHV: string };
const API = "http://localhost:3001";
const tabs: { key: ApprovalStatus; label: string }[] = [{ key: "pending", label: "Chờ duyệt" }, { key: "approved", label: "Đã duyệt" }, { key: "rejected", label: "Đã từ chối" }];

export default function GraduationApprovalPage() {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [status, setStatus] = useState<ApprovalStatus>("pending");
  const [note, setNote] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
  const studentText = (request: Request) => request.items.map((item) => { const student = students.find((entry) => String(entry.id) === String(item.studentId)); return `${student?.name || "Học viên đã bị xoá"} ${student?.maSoHV || item.studentId}`; }).join(" ");
  const visible = requests.filter((request) => request.status === status && (!search.trim() || studentText(request).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())));
  const allSelected = visible.length > 0 && visible.every((request) => selectedIds.includes(request.id));
  const canReview = ["school", "admin"].includes(session?.role || "");
  const stageLabel = (request: Request) => request.status === "approved" ? "Nhà trường đã duyệt" : request.status === "rejected" ? "Đã từ chối" : request.approvalStage === "battalion" ? "Chờ Tiểu đoàn" : "Tiểu đoàn đã chuyển · chờ Nhà trường";

  return <div className="page-shell">
    <div className="mb-5"><p className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-blue-600">Quy trình xét duyệt</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">Phê duyệt tốt nghiệp & điều chuyển</h1><p className="mt-1 text-sm text-slate-500">Đại đội gửi → Tiểu đoàn chuyển → Nhà trường phê duyệt cuối; Admin có thể xử lý trực tiếp.</p></div>
    <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">{session?.role === "company" ? "Đại đội: theo dõi yêu cầu của đơn vị mình." : session?.role === "battalion" ? "Tiểu đoàn: kiểm tra và chuyển yêu cầu thuộc đơn vị lên Nhà trường." : "Nhà trường/Admin: phê duyệt hoặc từ chối hồ sơ cuối cùng."}</div>
    <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">{tabs.map((tab) => <button key={tab.key} type="button" onClick={() => { setStatus(tab.key); setSelectedIds([]); }} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${status === tab.key ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}>{tab.label}<span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${status === tab.key ? "bg-white/20" : "bg-slate-100"}`}>{counts[tab.key]}</span></button>)}</div>
    <div className="my-4 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm học viên hoặc mã số..." className="field-control min-w-60 flex-1" /><button onClick={() => setSelectedIds(allSelected ? [] : visible.map((request) => request.id))} className={`min-w-[180px] rounded-xl px-4 py-2.5 text-sm font-semibold transition ${allSelected ? "border border-blue-200 bg-blue-50 text-blue-700" : "border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"}`}>{allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}</button></div>
    <div className="table-shell max-h-[calc(100vh-300px)]"><table className="min-w-[960px] w-full"><thead><tr><th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"><input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? [] : visible.map((request) => request.id))} /></th><th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Học viên & quyết định</th><th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Tiến độ</th><th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Ngày gửi</th><th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Thao tác</th></tr></thead><tbody>{visible.map((request) => { const canReviewRequest = canReview && request.status === "pending" && (session?.role === "admin" || request.approvalStage === "school"); return <tr key={request.id} className="transition hover:bg-slate-50 align-top"><td className="p-3"><input type="checkbox" checked={selectedIds.includes(request.id)} onChange={() => setSelectedIds((current) => current.includes(request.id) ? current.filter((id) => id !== request.id) : [...current, request.id])} /></td><td className="p-3 text-sm">{request.items.map((item) => { const student = students.find((entry) => String(entry.id) === String(item.studentId)); return <div key={item.studentId} className="mb-2 last:mb-0"><b>{student?.name || "Học viên đã bị xoá"}</b><span className="ml-2 text-xs text-slate-500">{student?.maSoHV || item.studentId}</span><span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{item.type === "transfer" ? "Điều chuyển đơn vị mới" : "Về đơn vị cũ"}</span></div>; })}</td><td className="p-3 text-sm text-slate-700">{stageLabel(request)}</td><td className="p-3 text-sm text-slate-700">{new Date(request.submittedAt).toLocaleDateString("vi-VN")}</td><td className="p-3"><div className="flex max-w-sm flex-wrap gap-2">{session?.role === "battalion" && request.approvalStage === "battalion" && request.status === "pending" && <button onClick={() => process(request, "forward")} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">Gửi Nhà trường</button>}{canReviewRequest && <><input value={note[request.id] || ""} onChange={(event) => setNote({ ...note, [request.id]: event.target.value })} className="field-control w-44 py-1.5 text-sm" placeholder="Ghi chú (nếu có)" /><button onClick={() => process(request, "rejected")} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">Từ chối</button><button onClick={() => process(request, "approved")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white">Duyệt</button></>}</div>{request.reviewerNote && <p className="mt-2 max-w-xs whitespace-pre-wrap text-xs text-amber-700">Ghi chú: {request.reviewerNote}</p>}</td></tr>; })}{!visible.length && <tr><td colSpan={5} className="p-10 text-center text-slate-500">Không có hồ sơ thuộc trạng thái này.</td></tr>}</tbody></table></div>
  </div>;
}
