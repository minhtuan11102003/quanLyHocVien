/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

import StudentHeader from "@/components/StudentHeader";
import StudentFilter from "@/components/StudentFilter";
import StudentTable from "@/components/StudentTable";
import StudentPagination from "@/components/StudentPagination";
import StudentModals from "@/components/StudentModals";
import StudentDetail from "@/components/StudentDetail";
import { ModalShell } from "@/components/ui/modal-shell";

import type {
  Student,
  NganhDaoTao,
  ClassItem,
  PaginationItem,
  QuanKhu,
} from "@/app/types/student";

type NamedUnit = { id: string; nameSuDoan?: string; nameLuDoan?: string };

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
  const [subUnits, setSubUnits] = useState<{ id: string; name: string; type: string; source: string }[]>([]);
  const [companies, setCompanies] = useState<{ id: string; nameDaiDoi: string }[]>([]);

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
  const [selectedMajorId, setSelectedMajorId] = useState<string | "all">("all");
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
      const [studentRes, nganhRes, classRes, quanKhuRes, suDoanRes, luDoanRes, daiDoiRes] = await Promise.all([
        fetch("http://localhost:3001/students"),
        fetch("http://localhost:3001/majors"),
        fetch("http://localhost:3001/classes"),
        fetch("http://localhost:3001/quanKhu"),
        fetch("http://localhost:3001/suDoan"),
        fetch("http://localhost:3001/luDoan"),
        fetch("http://localhost:3001/daiDoi"),
      ]);

      if (!studentRes.ok || !nganhRes.ok || !classRes.ok) {
        throw new Error("Không thể lấy dữ liệu");
      }

      const studentData = await studentRes.json();

      const nganhData = await nganhRes.json();

      const classData = await classRes.json();
      const quanKhuData = await quanKhuRes.json();
      const suDoanData = await suDoanRes.json();
      const luDoanData = await luDoanRes.json();
      const daiDoiData = daiDoiRes.ok ? await daiDoiRes.json() : [];
      setCompanies(Array.isArray(daiDoiData) ? daiDoiData : []);
      setQuankhu(quanKhuData);
      setSubUnits([...(suDoanData as NamedUnit[]).map((x) => ({ id: x.id, name: x.nameSuDoan || "Chưa đặt tên", type: "Sư đoàn", source: "suDoan" })), ...(luDoanData as NamedUnit[]).map((x) => ({ id: x.id, name: x.nameLuDoan || "Chưa đặt tên", type: "Lữ đoàn", source: "luDoan" }))]);

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

  const filteredClasses = classes.filter((item) => {
    const byMajor = selectedMajorId === "all" || String(item.majorId) === String(selectedMajorId);
    const byCompany = selectedDonVi === "all" || String(item.daiDoiId || "") === String(selectedDonVi);
    return byMajor && byCompany;
  });

  // =====================================================
  // FILTER STUDENT
  // =====================================================

  const filteredStudents = students.filter((student) => {
    if (student.graduationStatus === "graduated") return false;
    const keyword = search.toLowerCase().trim();

    // Tìm kiếm theo tên hoặc mã số
    const matchSearch =
      keyword === "" ||
      student.name.toLowerCase().includes(keyword) ||
      String(student.maSoHV).includes(keyword);

    // Lọc theo đại đội
    const matchDonVi =
      selectedDonVi === "all" || String(student.daiDoiId || "") === String(selectedDonVi);

    // Lọc theo lớp
    const matchMajor = selectedMajorId === "all" || String(student.majorId) === String(selectedMajorId);
    const matchClass = selectedClassId === "all" || String(student.classId) === String(selectedClassId);

    return matchSearch && matchDonVi && matchMajor && matchClass;
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
  }, [selectedDonVi, selectedMajorId, selectedClassId, search, itemsPerPage]);

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

    // Khi đổi đại đội, chỉ giữ lại ngành/lớp thuộc đại đội đó.
    setSelectedClassId("all");

    // Reset page
    setCurrentPage(1);
  };

  // =====================================================
  // CHANGE CHUYÊN NGÀNH
  // =====================================================

  const handleMajorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMajorId(e.target.value === "all" ? "all" : e.target.value);
    setSelectedClassId("all");
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
    <div className="page-shell space-y-5">
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
        selectedMajorId={selectedMajorId}
        selectedClassId={selectedClassId}
        majors={nganhDaoTao}
        filteredClasses={filteredClasses}
        companies={companies}
        onSearchChange={handleSearch}
        onDonViChange={handleDonViChange}
        onMajorChange={handleMajorChange}
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
        subUnits={subUnits}
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

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
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
        <ModalShell title="Chi tiết hồ sơ" onClose={() => setDetailStudent(null)} className="max-w-6xl" showHeader={false}>
            <StudentDetail
              student={detailStudent}
              majors={nganhDaoTao}
              classes={classes}
              quanKhu={quanKhu}
              onClose={() => setDetailStudent(null)}
            />
        </ModalShell>
      )}
    </div>
  );
}
