import type { Rank } from "./RankForm";

type RankDetailProps = { rank: Rank; onClose: () => void };

export default function RankDetail({ rank, onClose }: RankDetailProps) {
  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Chi tiết cấp bậc</h2>
        <button onClick={onClose} className="text-2xl text-gray-500">×</button>
      </div>
      <dl className="divide-y rounded-lg border">
        <div className="grid grid-cols-3 gap-3 p-3"><dt className="font-medium">Tên</dt><dd className="col-span-2">{rank.name}</dd></div>
        <div className="grid grid-cols-3 gap-3 p-3"><dt className="font-medium">Nhóm</dt><dd className="col-span-2">{rank.group}</dd></div>
        <div className="grid grid-cols-3 gap-3 p-3"><dt className="font-medium">Thứ tự</dt><dd className="col-span-2">{rank.rankOrder}</dd></div>
      </dl>
    </div>
  );
}
