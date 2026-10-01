"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";

import type {
  ClassItem,
  NganhDaoTao,
  Student,
  QuanKhu,
} from "@/app/types/student";

type StudentTableProps = {
  students: Student[];
  nganhDaoTao: NganhDaoTao[];
  classes: ClassItem[];
  quanKhu: QuanKhu[];
  subUnits: { id: string; name: string; type: string; source: string }[];

  selectedIds: string[];

  startIndex: number;

  onSelect: (id: string) => void;
  onSelectAll: () => void;

  onEdit: (student: Student) => void;
  onDetail: (student: Student) => void;
  onDelete: (id: string) => void;
};

export default function StudentTable({
  students,
  nganhDaoTao,
  classes,
  quanKhu,
  subUnits,
  selectedIds,
  startIndex,
  onSelect,
  onSelectAll,
  onEdit,
  onDetail,
  onDelete,
}: StudentTableProps) {
  const isAllSelected =
    students.length > 0 &&
    students.every((student) => selectedIds.includes(student.id));

  return (
    <div className="mt-5 min-w-0 max-w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-bold text-slate-900">Danh sách học viên</h2><p className="mt-0.5 text-sm text-slate-500">Chọn một hoặc nhiều hồ sơ để thao tác.</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{students.length} kết quả</span></div>
      <div className="max-h-[calc(100vh-330px)] overflow-auto"><table className="w-full min-w-[1080px] border-collapse">
        {/* HEADER */}

        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onSelectAll}
                className="h-5 w-5"
              />
            </th>

            <th className="py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">STT</th>

            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Mã Số HV</th>

            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              Ngành đào tạo
            </th>

            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Lớp học</th>

            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              Tên học viên
            </th>

            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Quân khu</th>
            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Đơn vị cũ</th>

            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Cấp bậc</th>
            {/* <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Ngày sinh</th> */}

            <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Thao tác</th>
          </tr>
        </thead>

        {/* BODY */}

        <tbody>
          {students.length == 0 ? (
            <tr>
              <td colSpan={11} className="py-10 text-center text-gray-500">
                Không tìm thấy học viên
              </td>
            </tr>
          ) : (
            students.map((student, index) => {
              const nganh = nganhDaoTao.find(
                (item) => String(item.id) === String(student.majorId),
              );

              const lop = classes.find(
                (item) =>
                  String(item.id) === String(student.classId) && String(item.majorId) === String(student.majorId),
              );

              return (
                <tr
                  key={student.id}
                  className="border-b border-slate-100 transition hover:bg-blue-50/50"
                >
                  {/* CHECKBOX */}

                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={() => onSelect(student.id)}
                      className="h-5 w-5"
                    />
                  </td>

                  {/* STT */}

                  <td className="py-4">{startIndex + index + 1}</td>

                  {/* MÃ */}

                  <td className="px-4 py-4 font-mono text-xs font-semibold text-slate-600">{student.maSoHV}</td>

                  {/* NGÀNH */}

                  <td className="px-6 py-4">
                    {nganh ? `${nganh.name}${nganh.shortName ? ` (${nganh.shortName})` : ""}` : "Không xác định"}
                  </td>

                  {/* LỚP */}

                  <td className="px-6 py-4">{lop?.name ?? "Không xác định"}</td>

                  {/* TÊN */}

                  <td className="px-6 py-4"><div className="font-semibold text-slate-900">{student.name}</div><div className="mt-0.5 text-xs text-slate-500">{student.chucVu || "Học viên"}</div></td>

                  {/* ĐƠN VỊ GỐC */}
                  <td className="px-6 py-4">
                    {quanKhu.find(
                      (x) =>
                        x.id === student.originQuanKhuId ||
                        x.id === student.quanKhuId,
                    )?.nameQuanKhu ?? "Chưa cập nhật"}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const id =
                        student.originDonViCap2Id || student.donViCap2Id;
                      const unit = subUnits.find(
                        (x) => `${x.source}:${x.id}` === id || x.id === id,
                      );
                      return unit ? `${unit.type} ${unit.name}` : student.donVi;
                    })()}
                  </td>

                  {/* CHỨC VỤ */}
                  <td className="px-6 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{student.capBac}</span></td>
                  {/* <td className="px-6 py-4">
                    {new Date(student.birthDay).toLocaleDateString("vi-VN")}
                  </td> */}

                  {/* THAO TÁC */}

                  <td className="px-6 py-4"><div className="flex gap-1.5">
                    <button
                      onClick={() => onDetail(student)}
                      title="Xem chi tiết"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      onClick={() => onEdit(student)}
                      title="Chỉnh sửa"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      onClick={() => onDelete(student.id)}
                      title="Xóa học viên"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div></td>
                </tr>
              );
            })
          )}
        </tbody>
      </table></div>
    </div>
  );
}
