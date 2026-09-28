"use client";

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
    <div className="mx-2 mt-4 w-full min-w-0 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-md">
      <table className="w-full min-w-max border-collapse">
        {/* HEADER */}

        <thead className="bg-gray-200">
          <tr>
            <th className="px-4 py-4 text-left text-xl font-bold">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onSelectAll}
                className="h-5 w-5"
              />
            </th>

            <th className="py-4 text-left text-xl font-bold">STT</th>

            <th className="px-4 py-4 text-left text-xl font-bold">Mã Số HV</th>

            <th className="px-6 py-4 text-left text-xl font-bold">
              Ngành đào tạo
            </th>

            <th className="px-6 py-4 text-left text-xl font-bold">Lớp học</th>

            <th className="px-6 py-4 text-left text-xl font-bold">
              Tên học viên
            </th>

            <th className="px-6 py-4 text-left text-xl font-bold">Đơn vị</th>

            <th className="px-6 py-4 text-left text-xl font-bold">Cấp bậc</th>
            <th className="px-6 py-4 text-left text-xl font-bold">Ngày sinh</th>

            <th className="px-6 py-4 text-left text-xl font-bold">Thao tác</th>
          </tr>
        </thead>

        {/* BODY */}

        <tbody>
          {students.length == 0 ? (
            <tr>
              <td colSpan={9} className="py-10 text-center text-gray-500">
                Không tìm thấy học viên
              </td>
            </tr>
          ) : (
            students.map((student, index) => {
              const nganh = nganhDaoTao.find(
                (item) => item.id === student.majorId,
              );

              const lop = classes.find(
                (item) =>
                  item.id == student.classId && item.majorId == student.majorId,
              );

              return (
                <tr
                  key={student.id}
                  className="border-b transition duration-300 hover:bg-gray-100"
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

                  <td className="px-4 py-4">{student.maSoHV}</td>

                  {/* NGÀNH */}

                  <td className="px-6 py-4">
                    {nganh?.name ?? "Không xác định"}
                  </td>

                  {/* LỚP */}

                  <td className="px-6 py-4">{lop?.name ?? "Không xác định"}</td>

                  {/* TÊN */}

                  <td className="px-6 py-4">{student.name}</td>

                  {/* ĐƠN VỊ */}

                  <td className="px-6 py-4">{student.donVi}</td>

                  {/* CHỨC VỤ */}
                  <td className="px-6 py-4">{student.capBac}</td>
                  <td className="px-6 py-4">
                    {new Date(student.birthDay).toLocaleDateString("vi-VN")}
                  </td>

                  {/* THAO TÁC */}

                  <td className="flex gap-2 px-6 py-4">
                    <button
                      onClick={() => onDetail(student)}
                      className="rounded bg-gray-600 px-4 py-2 font-bold text-white hover:bg-gray-700"
                    >
                      Chi tiết
                    </button>

                    <button
                      onClick={() => onEdit(student)}
                      className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                    >
                      Sửa
                    </button>

                    <button
                      onClick={() => onDelete(student.id)}
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
    </div>
  );
}
