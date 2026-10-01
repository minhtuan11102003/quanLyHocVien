/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import AddClassComponent from "@/components/AddClass";
import EditClassComponent from "@/components/EditClass";
import MajorManagement from "@/components/MajorManagement";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import { useEffect, useState } from "react";

type ClassItem = {
  id: string;
  majorId: string;
  name: string;
  daiDoiId: string;
};

type NganhDaoTao = {
  id: string;
  name: string;
  shortName: string;
};

type daiDoiQuanLy = {
  id: string;
  nameDaiDoi: string;
  idTieuDoan: string;
};

type PaginationItem = number | "...";

export default function ClassManagement() {
  // =========================
  // STATE
  // =========================

  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [nganhDaoTao, setNganhDaoTao] = useState<NganhDaoTao[]>([]);
  const [daiDoi, setDaiDoi] = useState<daiDoiQuanLy[]>([]);

  // Modal thêm
  const [isOpen, setIsOpen] = useState(false);

  // Modal sửa
  const [editClass, setEditClass] = useState<ClassItem | null>(null);

  // Ngành đang lọc
  const [selectedMajorId, setSelectedMajorId] = useState<string | "all">("all");
  const [selectedDaiDoiId, setSelectedDaiDoiId] = useState<string | "all">("all");

  // Tìm kiếm
  const [search, setSearch] = useState("");

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [tab, setTab] = useState<"classes" | "majors">("classes");

  // =========================
  // FETCH DATA
  // =========================

  const fetchData = async () => {
    try {
      const [classRes, majorRes, daiDoiRes] = await Promise.all([
        fetch("http://localhost:3001/classes"),
        fetch("http://localhost:3001/majors"),
        fetch("http://localhost:3001/daiDoi"),
      ]);

      if (!classRes.ok || !majorRes.ok) {
        throw new Error("Không thể lấy dữ liệu");
      }

      const classData = await classRes.json();
      const majorData = await majorRes.json();
      const daiDoiData = await daiDoiRes.json();

      setClasses(classData);
      setNganhDaoTao(majorData);
      setDaiDoi(daiDoiData);
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =========================
  // FILTER
  // =========================

  const filteredClasses = classes.filter((item) => {
    // Lọc theo ngành
    const matchMajor =
      selectedMajorId === "all" ||
      String(item.majorId) === String(selectedMajorId);

    // Lọc theo tên lớp
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());

    const matchCompany = selectedDaiDoiId === "all" || String(item.daiDoiId) === String(selectedDaiDoiId);
    return matchMajor && matchSearch && matchCompany;
  }).sort((a, b) => {
    const aName = daiDoi.find((item) => String(item.id) === String(a.daiDoiId))?.nameDaiDoi || "";
    const bName = daiDoi.find((item) => String(item.id) === String(b.daiDoiId))?.nameDaiDoi || "";
    return aName.localeCompare(bName, "vi", { numeric: true }) || a.name.localeCompare(b.name, "vi", { numeric: true });
  });

  // =========================
  // PAGINATION
  // =========================

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const endIndex = startIndex + itemsPerPage;

  const currentClasses = filteredClasses.slice(startIndex, endIndex);

  // =========================
  // PAGINATION BUTTON
  // =========================

  const getPaginationPages = (): PaginationItem[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const paginationPages = getPaginationPages();

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn xóa lớp học này không?",
    );

    if (!confirmDelete) return;

    try {
      const studentsRes = await fetch("http://localhost:3001/students");
      if (!studentsRes.ok)
        throw new Error("Không thể kiểm tra học viên thuộc lớp");

      const students = await studentsRes.json();
      if (
        students.some(
          (student: { classId: string }) =>
            String(student.classId) === String(id),
        )
      ) {
        alert(
          "Không thể xóa lớp đang có học viên. Hãy chuyển hoặc xóa học viên trước.",
        );
        return;
      }

      const res = await fetch(`http://localhost:3001/classes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Xóa thất bại");
      }

      await fetchData();

      // Nếu xóa phần tử cuối của trang
      // thì quay về trang trước
      if (currentClasses.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Lỗi xóa:", error);
    }
  };

  // =========================
  // UPDATE
  // =========================

  const handleUpdate = async () => {
    await fetchData();

    setEditClass(null);
  };

  // =========================
  // CHANGE ITEMS PER PAGE
  // =========================

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = Number(e.target.value);

    setItemsPerPage(value);

    setCurrentPage(1);
  };

  // =========================
  // CHANGE SEARCH
  // =========================

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);

    setCurrentPage(1);
  };

  // =========================
  // CHANGE MAJOR
  // =========================

  const handleMajorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    setSelectedMajorId(value === "all" ? "all" : value);

    setCurrentPage(1);
  };

  const handleDaiDoiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDaiDoiId(e.target.value === "all" ? "all" : e.target.value);
    setCurrentPage(1);
  };

  if (tab === "majors") {
    return (
      <div className="p-4">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTab("majors")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Chuyên ngành
          </button>
          <button
            onClick={() => setTab("classes")}
            className="rounded-lg border px-4 py-2"
          >
            Lớp học
          </button>
        </div>
        <h1 className="mb-4 text-2xl font-bold">Quản lý chuyên ngành</h1>
        <MajorManagement onChanged={fetchData} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-600 to-blue-700 p-5 text-white shadow-lg md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
              Hệ thống đào tạo
            </p>
            <h1 className="mt-2 text-2xl font-bold">Quản lý lớp học</h1>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-sm font-medium text-blue-50">
              {classes.length} lớp đang quản lý
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTab("majors")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            Chuyên ngành
          </button>
          <button
            onClick={() => setTab("classes")}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm transition ${tab === "classes" ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"}`}
          >
            Lớp học
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Tổng lớp</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {classes.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Đang lọc</p>
            <p className="mt-2 text-xl font-bold text-slate-900">
              {selectedMajorId === "all"
                ? "Tất cả ngành"
                : (nganhDaoTao.find(
                    (item) => String(item.id) === String(selectedMajorId),
                  )?.name ?? "Không xác định")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Kết quả</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {filteredClasses.length}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm tên lớp..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={selectedMajorId}
              onChange={handleMajorChange}
              className="min-w-[220px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Tất cả ngành</option>

              {nganhDaoTao.map((major) => (
                <option key={major.id} value={major.id}>
                  {major.name}
                </option>
              ))}
            </select>
            <select
              value={selectedDaiDoiId}
              onChange={handleDaiDoiChange}
              className="min-w-[220px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">Tất cả đại đội</option>
              {[...daiDoi].sort((a, b) => a.nameDaiDoi.localeCompare(b.nameDaiDoi, "vi", { numeric: true })).map((company) => <option key={company.id} value={company.id}>{company.nameDaiDoi}</option>)}
            </select>

            <Button
              className="bg-blue-600 px-5 py-6 text-sm font-semibold text-white hover:bg-blue-700"
              onClick={() => setIsOpen(true)}
            >
              + Thêm lớp học
            </Button>
          </div>
        </div>

        {isOpen && (
            <ModalShell title="Thêm lớp học" description="Thiết lập lớp, chuyên ngành và đơn vị quản lý." onClose={() => setIsOpen(false)} className="max-w-2xl">
              <AddClassComponent
                onClose={async () => {
                  setIsOpen(false);
                  await fetchData();
                }}
              />
            </ModalShell>
        )}

        {editClass && (
            <ModalShell title="Chỉnh sửa lớp học" description={`Cập nhật thông tin lớp ${editClass.name}.`} onClose={() => setEditClass(null)} className="max-w-2xl">
              <EditClassComponent
                classItem={editClass}
                onClose={() => setEditClass(null)}
                onUpdate={handleUpdate}
              />
            </ModalShell>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-auto">
            <table className="min-w-[760px] w-full border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    STT
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Ngành đào tạo
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Tên lớp
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Đại đội quản lý
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {currentClasses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-500"
                    >
                      Không tìm thấy lớp học phù hợp
                    </td>
                  </tr>
                ) : (
                  currentClasses.map((value, index) => {
                    const major = nganhDaoTao.find(
                      (item) => String(item.id) === String(value.majorId),
                    );
                    const daiDoifind = daiDoi.find(
                      (item) => String(item.id) === String(value.daiDoiId),
                    );

                    return (
                      <tr
                        key={value.id}
                        className="border-b border-slate-200 transition duration-200 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 text-slate-600">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {major?.name ?? "Không xác định"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {value.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {daiDoifind?.nameDaiDoi ?? "Không xác định"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditClass(value)}
                              className="rounded-lg bg-blue-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(value.id)}
                              className="rounded-lg bg-red-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Hiển thị</span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <span>lớp / trang</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>

              {paginationPages.map((page, index) => {
                if (page === "...") {
                  return (
                    <span
                      key={`dots-${index}`}
                      className="px-2 py-2 text-slate-500"
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      currentPage === page
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
