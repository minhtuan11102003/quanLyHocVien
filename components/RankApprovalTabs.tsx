"use client";

export type ApprovalStatus =
  | "pending"
  | "revision_requested"
  | "approved"
  | "rejected";

const tabs: { key: ApprovalStatus; label: string }[] = [
  { key: "pending", label: "Chờ duyệt" },
  { key: "revision_requested", label: "Yêu cầu sửa" },
  { key: "approved", label: "Đã duyệt" },
  { key: "rejected", label: "Đã từ chối" },
];

export default function RankApprovalTabs({
  active,
  counts,
  onChange,
}: {
  active: ApprovalStatus;
  counts: Record<ApprovalStatus, number>;
  onChange: (status: ApprovalStatus) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-2 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`rounded-lg px-4 py-2 font-medium transition ${active === tab.key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-blue-50"}`}
        >
          {tab.label}{" "}
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-xs ${active === tab.key ? "bg-white/20" : "bg-gray-100"}`}
          >
            {counts[tab.key]}
          </span>
        </button>
      ))}
    </div>
  );
}
