"use client";

import type { PaginationItem } from "@/app/types/student";

type StudentPaginationProps = {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  paginationPages: PaginationItem[];

  onItemsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;

  onPageChange: (page: number) => void;
};

export default function StudentPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  paginationPages,
  onItemsPerPageChange,
  onPageChange,
}: StudentPaginationProps) {
  // Nếu chọn "Tất cả" thì không cần phân trang
  const isShowAll = itemsPerPage == 0;

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      {/* ITEMS PER PAGE */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Hiển thị</span>

        <select
          value={itemsPerPage}
          onChange={onItemsPerPageChange}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>

          {/* TẤT CẢ */}
          <option value={0}>Tất cả</option>
        </select>

        <span>học viên / trang</span>
      </div>

      {/* PAGINATION */}
      {!isShowAll && (
        <div className="flex items-center gap-1.5">
          {/* TRƯỚC */}
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Trước
          </button>

          {/* SỐ TRANG */}
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
                onClick={() => onPageChange(page)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  currentPage === page
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            );
          })}

          {/* SAU */}
          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
