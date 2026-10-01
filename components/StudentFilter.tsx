"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import type { ClassItem } from "@/app/types/student";

type StudentFilterProps = {
  search: string;

  selectedDonVi: string;
  selectedMajorId: string | "all";
  selectedClassId: string | "all";
  majors: { id: string; name: string; shortName?: string }[];
  filteredClasses: ClassItem[];
  companies: { id: string; nameDaiDoi: string }[];

  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  onDonViChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onMajorChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onClassChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

export default function StudentFilter({
  search,
  selectedDonVi,
  selectedMajorId,
  selectedClassId,
  majors,
  filteredClasses,
  companies,
  onSearchChange,
  onDonViChange,
  onMajorChange,
  onClassChange,
}: StudentFilterProps) {
  return (
    <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><SlidersHorizontal size={16} /></span>Bộ lọc danh sách</div>
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.4fr)_repeat(3,minmax(150px,1fr))]">
      {/* SEARCH */}

      <div className="min-w-0">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tìm kiếm</label>
        <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input
          type="text"
          value={search}
          onChange={onSearchChange}
          placeholder="Tìm theo tên hoặc mã số học viên..."
          className="field-control pl-10"
        /></div>
      </div>

      {/* ĐẠI ĐỘI */}

      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Đại đội<select
        value={selectedDonVi}
        onChange={onDonViChange}
        className="field-control mt-1"
      >
        <option value="all">Tất cả đại đội</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.nameDaiDoi}
          </option>
        ))}
      </select></label>

      {/* CHUYÊN NGÀNH */}
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chuyên ngành<select
        value={selectedMajorId}
        onChange={onMajorChange}
        className="field-control mt-1"
      >
        <option value="all">Tất cả chuyên ngành</option>
        {majors.map((major) => <option key={major.id} value={major.id}>{major.name}{major.shortName ? ` (${major.shortName})` : ""}</option>)}
      </select></label>

      {/* LỚP */}
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lớp học<select
        value={selectedClassId}
        onChange={onClassChange}
        className="field-control mt-1"
      >
        <option value="all">Tất cả lớp</option>

        {filteredClasses.map((classItem) => (
          <option key={classItem.id} value={classItem.id}>
            {classItem.name}
          </option>
        ))}
      </select></label>
      </div>
    </section>
  );
}
