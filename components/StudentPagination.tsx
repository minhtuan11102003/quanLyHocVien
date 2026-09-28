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
    <div className="flex items-center justify-between border-t p-4">
      {/* ITEMS PER PAGE */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Hiển thị</span>

        <select
          value={itemsPerPage}
          onChange={onItemsPerPageChange}
          className="rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>

          {/* TẤT CẢ */}
          <option value={0}>Tất cả</option>
        </select>

        <span className="text-sm text-gray-600">học viên / trang</span>
      </div>

      {/* PAGINATION */}
      {!isShowAll && (
        <div className="flex items-center gap-2">
          {/* TRƯỚC */}
          <button
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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
            onClick={() => onPageChange(currentPage + 1)}
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
