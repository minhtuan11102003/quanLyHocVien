"use client";
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
export default function RankApprovalDetail({
  item,
  onClose,
  onAction,
}: {
  item: Request;
  onClose: () => void;
  onAction: (status: ApprovalStatus, note: string) => void;
}) {
  const canReview =
    item.status === "pending" || item.status === "revision_requested";
  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Chi tiết hồ sơ nâng cấp bậc</h2>
        <button onClick={onClose} className="text-2xl text-gray-500">
          ×
        </button>
      </div>
      <dl className="divide-y rounded-lg border text-sm">
        <div className="grid grid-cols-3 gap-3 p-3">
          <dt className="font-medium">Học viên</dt>
          <dd className="col-span-2">
            {item.studentName} ({item.maSoHV})
          </dd>
        </div>
        <div className="grid grid-cols-3 gap-3 p-3">
          <dt className="font-medium">Đối tượng</dt>
          <dd className="col-span-2">{item.category}</dd>
        </div>
        <div className="grid grid-cols-3 gap-3 p-3">
          <dt className="font-medium">Cấp hiện tại</dt>
          <dd className="col-span-2">{item.currentRank}</dd>
        </div>
        <div className="grid grid-cols-3 gap-3 p-3">
          <dt className="font-medium">Đề nghị</dt>
          <dd className="col-span-2">{item.proposedRank}</dd>
        </div>
        <div className="grid grid-cols-3 gap-3 p-3">
          <dt className="font-medium">Lý do/căn cứ</dt>
          <dd className="col-span-2 whitespace-pre-wrap">{item.reason}</dd>
        </div>
      </dl>
      {canReview && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            Ghi chú xử lý
          </label>
          <textarea
            id="rank-review-note"
            className="w-full rounded-lg border p-3"
            rows={3}
            placeholder="Bắt buộc khi yêu cầu sửa hoặc từ chối"
          />
        </div>
      )}
      {canReview && (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={() =>
              onAction(
                "revision_requested",
                (
                  document.getElementById(
                    "rank-review-note",
                  ) as HTMLTextAreaElement
                )?.value ?? "",
              )
            }
            className="rounded-lg bg-amber-500 px-3 py-2 text-white"
          >
            Yêu cầu sửa
          </button>
          <button
            onClick={() =>
              onAction(
                "rejected",
                (
                  document.getElementById(
                    "rank-review-note",
                  ) as HTMLTextAreaElement
                )?.value ?? "",
              )
            }
            className="rounded-lg bg-red-600 px-3 py-2 text-white"
          >
            Từ chối
          </button>
          <button
            onClick={() =>
              onAction(
                "approved",
                (
                  document.getElementById(
                    "rank-review-note",
                  ) as HTMLTextAreaElement
                )?.value ?? "",
              )
            }
            className="rounded-lg bg-green-600 px-3 py-2 text-white"
          >
            Duyệt
          </button>
        </div>
      )}
    </div>
  );
}
