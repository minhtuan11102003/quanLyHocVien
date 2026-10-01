"use client";

import { useMemo, useState } from "react";

export type PageSize = 5 | 10 | 15 | 0;

export function usePagination<T>(items: T[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const currentItems = useMemo(() => {
    if (pageSize === 0) return items;
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, pageSize, safePage]);

  const changePageSize = (size: PageSize) => { setPageSize(size); setPage(1); };
  return { page: safePage, pageSize, totalPages, currentItems, setPage, setPageSize: changePageSize };
}

export function DataPagination({ page, pageSize, totalPages, totalItems, onPageChange, onPageSizeChange, setPage, setPageSize, label = "mục" }: {
  page: number; pageSize: PageSize; totalPages: number; totalItems: number;
  onPageChange?: (page: number) => void; onPageSizeChange?: (size: PageSize) => void;
  setPage?: (page: number) => void; setPageSize?: (size: PageSize) => void; label?: string;
}) {
  if (!totalItems) return null;
  const changePage = onPageChange || setPage!;
  const changePageSize = onPageSizeChange || setPageSize!;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((item) => totalPages <= 7 || item === 1 || item === totalPages || Math.abs(item - page) <= 1);
  return <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
    <label className="flex items-center gap-2 text-sm text-slate-600">Hiển thị<select value={pageSize} onChange={(event) => changePageSize(Number(event.target.value) as PageSize)} className="rounded-lg border bg-white px-2 py-1.5 font-medium"><option value={5}>5</option><option value={10}>10</option><option value={15}>15</option><option value={0}>Tất cả</option></select><span>{label}</span></label>
    {pageSize !== 0 && totalPages > 1 && <div className="flex flex-wrap items-center gap-1"><button type="button" disabled={page === 1} onClick={() => changePage(page - 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Trước</button>{pages.map((item, index) => <span key={item} className="contents">{index > 0 && item - pages[index - 1] > 1 && <span className="px-1 text-slate-400">…</span>}<button type="button" onClick={() => changePage(item)} className={`rounded-lg border px-3 py-1.5 text-sm ${page === item ? "border-blue-600 bg-blue-600 text-white" : "bg-white"}`}>{item}</button></span>)}<button type="button" disabled={page === totalPages} onClick={() => changePage(page + 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Sau</button></div>}
  </div>;
}
