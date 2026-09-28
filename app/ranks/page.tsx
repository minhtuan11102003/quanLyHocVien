/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import RankDetail from "@/components/RankDetail";
import RankForm, { type Rank } from "@/components/RankForm";

type GroupFilter = "all" | Rank["group"];

export default function RankManagementPage() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<GroupFilter>("all");
  const [formRank, setFormRank] = useState<Rank | undefined>();
  const [detailRank, setDetailRank] = useState<Rank | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRanks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:3001/ranks");
      if (!response.ok) throw new Error("Không thể tải danh sách cấp bậc");
      setRanks(await response.json());
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu. Hãy kiểm tra json-server ở cổng 3001.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanks();
  }, []);

  const visibleRanks = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi-VN");
    return ranks
      .filter((rank) => group === "all" || rank.group === group)
      .filter(
        (rank) =>
          !keyword || rank.name.toLocaleLowerCase("vi-VN").includes(keyword),
      )
      .sort((a, b) => a.rankOrder - b.rankOrder);
  }, [group, ranks, search]);

  const removeRank = async (rank: Rank) => {
    if (!window.confirm(`Bạn có chắc muốn xóa cấp bậc “${rank.name}”?`)) return;
    try {
      const response = await fetch(`http://localhost:3001/ranks/${rank.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Không thể xóa cấp bậc");
      await fetchRanks();
    } catch (err) {
      console.error(err);
      alert("Không thể xóa cấp bậc. Vui lòng thử lại.");
    }
  };

  const openAdd = () => {
    setFormRank(undefined);
    setIsFormOpen(true);
  };

  const openEdit = (rank: Rank) => {
    setFormRank(rank);
    setIsFormOpen(true);
  };

  return (
    <div className="p-4">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý cấp bậc</h1>
          <p className="mt-1 text-gray-500">
            Tổng số:{" "}
            <span className="font-bold text-blue-600">{ranks.length}</span> cấp
            bậc
          </p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
        >
          + Thêm cấp bậc
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên cấp bậc..."
          className="min-w-60 flex-1 rounded-lg border px-4 py-2.5"
        />
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value as GroupFilter)}
          className="rounded-lg border px-4 py-2.5"
        >
          <option value="all">Tất cả nhóm</option>
          <option value="Hạ sĩ quan, binh sĩ">Hạ sĩ quan, binh sĩ</option>
          <option value="Sĩ quan, Quân nhân chuyên nghiệp">
            Sĩ quan, QNCN
          </option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-5 py-3 text-left">Thứ tự</th>
              <th className="px-5 py-3 text-left">Cấp bậc</th>
              <th className="px-5 py-3 text-left">Nhóm</th>
              <th className="px-5 py-3 text-left">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-red-600">
                  {error}
                </td>
              </tr>
            ) : visibleRanks.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Không tìm thấy cấp bậc
                </td>
              </tr>
            ) : (
              visibleRanks.map((rank) => (
                <tr key={rank.id} className="border-t hover:bg-gray-50">
                  <td className="px-5 py-3">{rank.rankOrder}</td>
                  <td className="px-5 py-3 font-medium">{rank.name}</td>
                  <td className="px-5 py-3">{rank.group}</td>
                  <td className="flex gap-2 px-5 py-3">
                    <button
                      onClick={() => setDetailRank(rank)}
                      className="rounded bg-gray-600 px-3 py-1.5 text-white"
                    >
                      Chi tiết
                    </button>
                    <button
                      onClick={() => openEdit(rank)}
                      className="rounded bg-blue-600 px-3 py-1.5 text-white"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => removeRank(rank)}
                      className="rounded bg-red-600 px-3 py-1.5 text-white"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <Modal onClose={() => setIsFormOpen(false)}>
          <RankForm
            key={formRank?.id ?? "new"}
            rank={formRank}
            onClose={() => setIsFormOpen(false)}
            onSaved={fetchRanks}
          />
        </Modal>
      )}
      {detailRank && (
        <Modal onClose={() => setDetailRank(undefined)}>
          <RankDetail
            rank={detailRank}
            onClose={() => setDetailRank(undefined)}
          />
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
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
