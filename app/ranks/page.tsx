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
      const [studentsResponse, requestsResponse] = await Promise.all([
        fetch("http://localhost:3001/students"),
        fetch("http://localhost:3001/rankRequests"),
      ]);
      const students = studentsResponse.ok ? await studentsResponse.json() : [];
      const requests = requestsResponse.ok ? await requestsResponse.json() : [];
      const usedByStudent =
        Array.isArray(students) &&
        students.some(
          (student: { capBac?: string }) => student.capBac === rank.name,
        );
      const usedByRequest =
        Array.isArray(requests) &&
        requests.some(
          (request: { currentRank?: string; proposedRank?: string }) =>
            request.currentRank === rank.name ||
            request.proposedRank === rank.name,
        );
      if (usedByStudent || usedByRequest) {
        alert(
          "Không thể xóa cấp bậc đang được học viên hoặc hồ sơ nâng cấp sử dụng.",
        );
        return;
      }
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
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-600 to-blue-700 p-5 text-white shadow-lg md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100">
              Danh mục hệ thống
            </p>
            <h1 className="mt-2 text-2xl font-bold">Quản lý cấp bậc</h1>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-sm font-medium text-indigo-50">
              {ranks.length} cấp bậc đang có
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Tổng cấp bậc</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {ranks.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Nhóm hiện tại</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {group === "all" ? "Tất cả" : group}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Kết quả</p>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {visibleRanks.length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên cấp bậc..."
              className="min-w-60 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <select
              value={group}
              onChange={(e) => setGroup(e.target.value as GroupFilter)}
              className="min-w-[220px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="all">Tất cả nhóm</option>
              <option value="Hạ sĩ quan, binh sĩ">Hạ sĩ quan, binh sĩ</option>
              <option value="Sĩ quan, Quân nhân chuyên nghiệp">
                Sĩ quan, QNCN
              </option>
            </select>
            <button
              onClick={openAdd}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              + Thêm cấp bậc
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-auto">
            <table className="min-w-[760px] w-full border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Thứ tự
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Cấp bậc
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Nhóm
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
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
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      Không tìm thấy cấp bậc
                    </td>
                  </tr>
                ) : (
                  visibleRanks.map((rank) => (
                    <tr
                      key={rank.id}
                      className="border-t border-slate-200 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 text-slate-600">
                        {rank.rankOrder}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          {rank.name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{rank.group}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setDetailRank(rank)}
                            className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                          >
                            Chi tiết
                          </button>
                          <button
                            onClick={() => openEdit(rank)}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => removeRank(rank)}
                            className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
        className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
