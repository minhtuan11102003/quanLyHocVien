/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

import StudentHeader from "@/components/StudentHeader";
import StudentFilter from "@/components/StudentFilter";
import StudentTable from "@/components/StudentTable";
import StudentPagination from "@/components/StudentPagination";
import StudentModals from "@/components/StudentModals";
import StudentDetail from "@/components/StudentDetail";

import type {
  Student,
  NganhDaoTao,
  ClassItem,
  PaginationItem,
  QuanKhu,
} from "@/app/types/student";

export default function Home() {
  // =====================================================
  // STATE MODAL
  // =====================================================

  const [isOpen, setIsOpen] = useState(false);

  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  const [isEditManyOpen, setIsEditManyOpen] = useState(false);

  // =====================================================
  // STATE DATA
  // =====================================================

  const [students, setStudents] = useState<Student[]>([]);

  const [nganhDaoTao, setNganhDaoTao] = useState<NganhDaoTao[]>([]);

  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [quanKhu, setQuankhu] = useState<QuanKhu[]>([]);

  // =====================================================
  // STATE SELECT
  // =====================================================

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // =====================================================
  // STATE SEARCH
  // =====================================================

  const [search, setSearch] = useState("");

  // =====================================================
  // STATE FILTER
  // =====================================================

  const [selectedDonVi, setSelectedDonVi] = useState<string>("all");

  const [selectedClassId, setSelectedClassId] = useState<string | "all">("all");

  // =====================================================
  // STATE PAGINATION
  // =====================================================

  const [currentPage, setCurrentPage] = useState(1);

  const [itemsPerPage, setItemsPerPage] = useState(5);

  // =====================================================
  // FETCH DATA
  // =====================================================

  const fetchData = async () => {
    try {
      const [studentRes, nganhRes, classRes, quanKhuRes] = await Promise.all([
        fetch("http://localhost:3001/students"),
        fetch("http://localhost:3001/majors"),
        fetch("http://localhost:3001/classes"),
        fetch("http://localhost:3001/quanKhu"),
      ]);

      if (!studentRes.ok || !nganhRes.ok || !classRes.ok) {
        throw new Error("Không thể lấy dữ liệu");
      }

      const studentData = await studentRes.json();

      const nganhData = await nganhRes.json();

      const classData = await classRes.json();
      const quanKhuData = await quanKhuRes.json();
      setQuankhu(quanKhuData);

      setStudents(studentData);

      setNganhDaoTao(nganhData);

      setClasses(classData);
    } catch (error) {
      console.error("Lỗi:", error);
    }
  };

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // FILTER CLASS
  // =====================================================

  const filteredClasses = classes;

  // =====================================================
  // FILTER STUDENT
  // =====================================================

  const filteredStudents = students.filter((student) => {
    const keyword = search.toLowerCase().trim();

    // Tìm kiếm theo tên hoặc mã số
    const matchSearch =
      keyword === "" ||
      student.name.toLowerCase().includes(keyword) ||
      String(student.maSoHV).includes(keyword);

    // Lọc theo đại đội
    const matchDonVi =
      selectedDonVi === "all" || student.donVi === selectedDonVi;

    // Lọc theo lớp
    const matchClass =
      selectedClassId == "all" || student.classId === selectedClassId;

    return matchSearch && matchDonVi && matchClass;
  });

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages =
    itemsPerPage === 0 ? 1 : Math.ceil(filteredStudents.length / itemsPerPage);

  const startIndex = itemsPerPage === 0 ? 0 : (currentPage - 1) * itemsPerPage;

  const endIndex =
    itemsPerPage === 0 ? filteredStudents.length : startIndex + itemsPerPage;

  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  // =====================================================
  // RESET PAGE KHI FILTER / SEARCH
  // =====================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDonVi, selectedClassId, search, itemsPerPage]);

  // =====================================================
  // KIỂM TRA CURRENT PAGE
  // =====================================================

  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }

      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // =====================================================
  // PAGINATION BUTTON
  // =====================================================

  const getPaginationPages = (): PaginationItem[] => {
    if (totalPages <= 5) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) => index + 1,
      );
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
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

  // =====================================================
  // SELECT STUDENT
  // =====================================================

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }

      return [...prev, id];
    });
  };

  // =====================================================
  // SELECT ALL STUDENT TRÊN TRANG
  // =====================================================

  const handleSelectAll = () => {
    const currentPageIds = currentStudents.map((student) => student.id);

    const isAllSelected =
      currentPageIds.length > 0 &&
      currentPageIds.every((id) => selectedIds.includes(id));

    if (isAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !currentPageIds.includes(id)),
      );

      return;
    }

    setSelectedIds((prev) => [...new Set([...prev, ...currentPageIds])]);
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Bạn có chắc muốn xóa học viên này không?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/students/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Xóa thất bại");
      }

      await fetchData();

      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } catch (error) {
      console.error("Lỗi xóa:", error);
    }
  };

  // =====================================================
  // UPDATE
  // =====================================================

  const handleUpdate = async () => {
    await fetchData();

    setEditStudent(null);
  };

  // =====================================================
  // ADD SUCCESS
  // =====================================================

  const handleAddSuccess = async () => {
    await fetchData();

    setCurrentPage(1);
  };

  // =====================================================
  // CHANGE ITEMS PER PAGE
  // =====================================================

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = Number(e.target.value);

    setItemsPerPage(value);

    setCurrentPage(1);
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);

    setCurrentPage(1);
  };

  // =====================================================
  // CHANGE ĐẠI ĐỘI
  // =====================================================

  const handleDonViChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    setSelectedDonVi(value);

    // Khi đổi đại đội
    // -> reset lớp
    setSelectedClassId("all");

    // Reset page
    setCurrentPage(1);
  };

  // =====================================================
  // CHANGE CLASS
  // =====================================================

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    const classId = value == "all" ? "all" : value;

    setSelectedClassId(classId);

    setCurrentPage(1);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div>
      {/* =================================================
          HEADER
      ================================================= */}

      <StudentHeader
        totalStudents={filteredStudents.length}
        selectedCount={selectedIds.length}
        onAdd={() => setIsOpen(true)}
        onEditMany={() => setIsEditManyOpen(true)}
      />

      {/* =================================================
          SEARCH + FILTER
      ================================================= */}

      <StudentFilter
        search={search}
        selectedDonVi={selectedDonVi}
        selectedClassId={selectedClassId}
        filteredClasses={filteredClasses}
        onSearchChange={handleSearch}
        onDonViChange={handleDonViChange}
        onClassChange={handleClassChange}
      />

      {/* =================================================
          MODALS
      ================================================= */}

      <StudentModals
        isOpen={isOpen}
        editStudent={editStudent}
        isEditManyOpen={isEditManyOpen}
        selectedIds={selectedIds}
        students={students}
        quanKhu={quanKhu}
        onCloseAdd={() => setIsOpen(false)}
        onCloseEdit={() => setEditStudent(null)}
        onCloseEditMany={() => setIsEditManyOpen(false)}
        onAddSuccess={handleAddSuccess}
        onUpdate={handleUpdate}
      />

      {/* =================================================
          TABLE
      ================================================= */}

      <StudentTable
        students={currentStudents}
        nganhDaoTao={nganhDaoTao}
        classes={classes}
        quanKhu={quanKhu}
        selectedIds={selectedIds}
        startIndex={startIndex}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        onEdit={setEditStudent}
        onDetail={setDetailStudent}
        onDelete={handleDelete}
      />

      {/* =================================================
          PAGINATION
      ================================================= */}

      <div className="mx-2 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md">
        <StudentPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          paginationPages={paginationPages}
          onItemsPerPageChange={handleItemsPerPageChange}
          onPageChange={setCurrentPage}
        />
      </div>

      {detailStudent && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDetailStudent(null)}
        >
          <div
            className="w-full max-w-xl rounded-xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <StudentDetail
              student={detailStudent}
              majors={nganhDaoTao}
              classes={classes}
              onClose={() => setDetailStudent(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
