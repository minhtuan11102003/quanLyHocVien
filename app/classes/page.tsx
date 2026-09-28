/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import AddClassComponent from "@/components/AddClass";
import EditClassComponent from "@/components/EditClass";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type ClassItem = {
  id: string;
  majorId: string;
  name: string;
};

type NganhDaoTao = {
  id: string;
  name: string;
  shortName: string;
};

type PaginationItem = number | "...";

export default function ClassManagement() {
  // =========================
  // STATE
  // =========================

  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [nganhDaoTao, setNganhDaoTao] = useState<NganhDaoTao[]>([]);

  // Modal thêm
  const [isOpen, setIsOpen] = useState(false);

  // Modal sửa
  const [editClass, setEditClass] = useState<ClassItem | null>(null);

  // Ngành đang lọc
  const [selectedMajorId, setSelectedMajorId] = useState<string | "all">("all");

  // Tìm kiếm
  const [search, setSearch] = useState("");

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(5);

  // =========================
  // FETCH DATA
  // =========================

  const fetchData = async () => {
    try {
      const [classRes, majorRes] = await Promise.all([
        fetch("http://localhost:3001/classes"),
        fetch("http://localhost:3001/majors"),
      ]);

      if (!classRes.ok || !majorRes.ok) {
        throw new Error("Không thể lấy dữ liệu");
      }

      const classData = await classRes.json();
      const majorData = await majorRes.json();

      setClasses(classData);
      setNganhDaoTao(majorData);
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
      selectedMajorId === "all" || item.majorId === selectedMajorId;

    // Lọc theo tên lớp
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());

    return matchMajor && matchSearch;
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
      if (!studentsRes.ok) throw new Error("Không thể kiểm tra học viên thuộc lớp");

      const students = await studentsRes.json();
      if (students.some((student: { classId: string }) => student.classId === id)) {
        alert("Không thể xóa lớp đang có học viên. Hãy chuyển hoặc xóa học viên trước.");
        return;
      }

      const res = await fetch(`http://localhost:3001/classes/`, {
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

  return (
    <div className="p-2">
      {/* =================================
          HEADER
      ================================= */}

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý lớp học</h1>

          <p className="mt-1 text-gray-500">
            Tổng số lớp:{" "}
            <span className="font-bold text-blue-600">{classes.length}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-blue-500 px-5 py-6 text-white hover:bg-blue-600"
            onClick={() => setIsOpen(true)}
          >
            + Thêm lớp học
          </Button>
        </div>
      </div>

      {/* =================================
          FILTER
      ================================= */}

      <div className="mb-4 flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
        {/* SEARCH */}

        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Tìm kiếm tên lớp..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          />
        </div>

        {/* MAJOR */}

        <select
          value={selectedMajorId}
          onChange={handleMajorChange}
          className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        >
          <option value="all">Tất cả ngành</option>

          {nganhDaoTao.map((major) => (
            <option key={major.id} value={major.id}>
              {major.name}
            </option>
          ))}
        </select>
      </div>

      {/* =================================
          MODAL ADD
      ================================= */}

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-[600px] rounded-xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-3 z-10 text-2xl text-gray-500 hover:text-red-500"
            >
              ×
            </button>

            <AddClassComponent
              onClose={async () => {
                setIsOpen(false);

                await fetchData();
              }}
            />
          </div>
        </div>
      )}

      {/* =================================
          MODAL EDIT
      ================================= */}

      {editClass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setEditClass(null)}
        >
          <div
            className="relative w-[600px] rounded-xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEditClass(null)}
              className="absolute right-4 top-3 z-10 text-2xl text-gray-500 hover:text-red-500"
            >
              ×
            </button>

            <EditClassComponent
              classItem={editClass}
              onClose={() => setEditClass(null)}
              onUpdate={handleUpdate}
            />
          </div>
        </div>
      )}

      {/* =================================
          TABLE
      ================================= */}

      <div className=" overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
        <table className="w-full border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xl font-bold">STT</th>

              {/* <th className="px-6 py-4 text-left text-xl font-bold">ID</th> */}

              <th className="px-6 py-4 text-left text-xl font-bold">
                Ngành đào tạo
              </th>
              <th className="px-6 py-4 text-left text-xl font-bold">Tên lớp</th>

              <th className="px-6 py-4 text-left text-xl font-bold">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            {currentClasses.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-gray-500">
                  Không tìm thấy lớp học
                </td>
              </tr>
            ) : (
              currentClasses.map((value, index) => {
                const major = nganhDaoTao.find(
                  (item) => item.id === value.majorId,
                );

                return (
                  <tr
                    key={value.id}
                    className="border-b transition duration-300 hover:bg-gray-100"
                  >
                    {/* STT */}

                    <td className="px-6 py-4">{startIndex + index + 1}</td>

                    {/* ID */}

                    {/* <td className="px-6 py-4">{value.id}</td> */}

                    {/* TÊN LỚP */}

                    <td className="px-6 py-4">
                      {major?.name ?? "Không xác định"}
                    </td>
                    <td className="px-6 py-4 font-medium">{value.name}</td>

                    {/* NGÀNH */}

                    {/* THAO TÁC */}

                    <td className="flex gap-2 px-6 py-4">
                      <button
                        onClick={() => setEditClass(value)}
                        className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                      >
                        Sửa
                      </button>

                      <button
                        onClick={() => handleDelete(value.id)}
                        className="rounded bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* =================================
            PAGINATION
        ================================= */}

        <div className="flex items-center justify-between border-t p-4">
          {/* ITEMS PER PAGE */}

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Hiển thị</span>

            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            >
              <option value={5}>5</option>

              <option value={10}>10</option>

              <option value={20}>20</option>
            </select>

            <span className="text-sm text-gray-600">lớp / trang</span>
          </div>

          {/* PAGINATION */}

          <div className="flex items-center gap-2">
            {/* TRƯỚC */}

            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>

            {/* PAGE */}

            {paginationPages.map((page, index) => {
              if (page === "...") {
                return (
                  <span key={`dots-${index}`} className="px-2 py-2">
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded border px-4 py-2 ${
                    currentPage === page
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-300 bg-white hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            {/* SAU */}

            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
