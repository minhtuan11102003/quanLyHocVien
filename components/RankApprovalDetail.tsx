"use client";
import { useState } from "react";
import type { ApprovalStatus } from "./RankApprovalTabs";

type Request = {
  id: string;
  studentName: string;
  maSoHV: string;
  category: string;
  currentRank: string;
  proposedRank: string;
  reason: string;
  submittedAt: string;
  reviewerNote?: string;
  status: ApprovalStatus;
};

export default function RankApprovalDetail({ item, onClose, onAction, onResubmit }: {
  item: Request;
  onClose: () => void;
  onAction: (status: ApprovalStatus, note: string) => void;
  onResubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState(item.reason);
  const [note, setNote] = useState("");
  const isPending = item.status === "pending";
  const isRevision = item.status === "revision_requested";
  const canReview = isPending || isRevision;

  return <div className="space-y-4 p-5">
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Chi tiết hồ sơ nâng cấp bậc</h2><button type="button" onClick={onClose} className="text-2xl text-gray-500">×</button></div>
    <dl className="divide-y rounded-lg border text-sm">
      <div className="grid grid-cols-3 gap-3 p-3"><dt className="font-medium">Học viên</dt><dd className="col-span-2">{item.studentName} ({item.maSoHV})</dd></div>
      <div className="grid grid-cols-3 gap-3 p-3"><dt className="font-medium">Đối tượng</dt><dd className="col-span-2">{item.category}</dd></div>
      <div className="grid grid-cols-3 gap-3 p-3"><dt className="font-medium">Cấp hiện tại</dt><dd className="col-span-2">{item.currentRank}</dd></div>
      <div className="grid grid-cols-3 gap-3 p-3"><dt className="font-medium">Đề nghị</dt><dd className="col-span-2">{item.proposedRank}</dd></div>
      <div className="grid grid-cols-3 gap-3 p-3"><dt className="font-medium">Trạng thái</dt><dd className="col-span-2">{item.status}</dd></div>
      {item.reviewerNote && <div className="grid grid-cols-3 gap-3 bg-amber-50 p-3"><dt className="font-medium">Yêu cầu chỉnh sửa</dt><dd className="col-span-2 whitespace-pre-wrap">{item.reviewerNote}</dd></div>}
    </dl>
    {isRevision ? <div><label className="mb-1 block text-sm font-medium">Lý do/căn cứ cần chỉnh sửa</label><textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-lg border p-3" rows={4} /></div> : <div className="rounded-lg border p-3 text-sm"><p className="mb-1 font-medium">Lý do/căn cứ</p><p className="whitespace-pre-wrap">{item.reason}</p></div>}
    {isPending && <div><label className="mb-1 block text-sm font-medium">Ghi chú xử lý</label><textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-lg border p-3" rows={3} placeholder="Bắt buộc khi yêu cầu sửa hoặc từ chối" /></div>}
    {canReview && <div className="flex flex-wrap justify-end gap-2">
      {isRevision ? <><button type="button" onClick={() => { if (!reason.trim()) return alert("Vui lòng cập nhật lý do/căn cứ."); onResubmit(reason.trim()); }} className="rounded-lg bg-blue-600 px-3 py-2 text-white">Lưu và gửi lại chờ duyệt</button><button type="button" onClick={() => { if (!note.trim()) return alert("Vui lòng nhập lý do từ chối."); onAction("rejected", note.trim()); }} className="rounded-lg bg-red-600 px-3 py-2 text-white">Từ chối</button></> : <><button type="button" onClick={() => { if (!note.trim()) return alert("Vui lòng nhập ghi chú yêu cầu sửa."); onAction("revision_requested", note.trim()); }} className="rounded-lg bg-amber-500 px-3 py-2 text-white">Yêu cầu sửa</button><button type="button" onClick={() => { if (!note.trim()) return alert("Vui lòng nhập ghi chú từ chối."); onAction("rejected", note.trim()); }} className="rounded-lg bg-red-600 px-3 py-2 text-white">Từ chối</button><button type="button" onClick={() => onAction("approved", note.trim())} className="rounded-lg bg-green-600 px-3 py-2 text-white">Duyệt</button></>}
    </div>}
  </div>;
}
