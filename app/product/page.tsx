"use client";

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
          Nội bộ
        </div>
        <h1 className="mt-4 text-3xl font-black text-slate-900">
          Trang sản phẩm nội bộ
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Mục này đang được chuẩn hóa theo giao diện chính của hệ thống quản lý
          học viên. Khi cần, nội dung sẽ được cập nhật theo module đang phát
          triển.
        </p>
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          Đang phát triển · Chờ bổ sung tính năng hoặc nội dung chuyên biệt.
        </div>
      </div>
    </div>
  );
}
