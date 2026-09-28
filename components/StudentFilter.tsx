"use client";

import type { ClassItem } from "@/app/types/student";

type StudentFilterProps = {
  search: string;

  selectedDonVi: string;

  selectedClassId: string | "all";

  filteredClasses: ClassItem[];

  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  onDonViChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;

  onClassChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

export default function StudentFilter({
  search,
  selectedDonVi,
  selectedClassId,
  filteredClasses,
  onSearchChange,
  onDonViChange,
  onClassChange,
}: StudentFilterProps) {
  return (
    <div className="mx-2 mt-4 flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
      {/* SEARCH */}

      <div className="flex-1">
        <input
          type="text"
          value={search}
          onChange={onSearchChange}
          placeholder="Tìm theo tên hoặc mã số học viên..."
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* ĐẠI ĐỘI */}

      <select
        value={selectedDonVi}
        onChange={onDonViChange}
        className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
      >
        <option value="all">Tất cả đại đội</option>
        <option value="Đại đội 1">Đại đội 1</option>
        <option value="Đại đội 2">Đại đội 2</option>
        <option value="Đại đội 3">Đại đội 3</option>
        <option value="Đại đội 4">Đại đội 4</option>
        <option value="Đại đội 5">Đại đội 5</option>
      </select>

      {/* LỚP */}

      <select
        value={selectedClassId}
        onChange={onClassChange}
        className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
      >
        <option value="all">Tất cả lớp</option>

        {filteredClasses.map((classItem) => (
          <option key={classItem.id} value={classItem.id}>
            {classItem.name}
          </option>
        ))}
      </select>
    </div>
  );
}
