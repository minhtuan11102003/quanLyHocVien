"use client";

import { Button } from "@/components/ui/button";
import type { ClassItem, NganhDaoTao, Student } from "@/app/types/student";

type Props = {
  students: Student[];
  nganhDaoTao: NganhDaoTao[];
  classes: ClassItem[];
  onClose: () => void;
  onExport: () => void;
};

export default function PreviewWord({
  students,
  nganhDaoTao,
  classes,
  onClose,
  onExport,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-5"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-[900px] flex-col rounded-xl bg-gray-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}

        <div className="flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold">Xem trước Word</h2>

            <p className="text-sm text-gray-500">
              {students.length} học viên được chọn
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-red-500"
          >
            ×
          </button>
        </div>

        {/* PREVIEW */}

        <div className="flex-1 overflow-y-auto p-8">
          {students.map((student, index) => {
            const major = nganhDaoTao.find(
              (item) => String(item.id) === String(student.majorId),
            );

            const classItem = classes.find(
              (item) =>
                String(item.id) === String(student.classId) && String(item.majorId) === String(student.majorId),
            );

            return (
              <div key={student.maSoHV} className="mb-8 bg-white p-8 shadow-md">
                {/* TIÊU ĐỀ */}

                <div className="mb-6 text-center">
                  <h1 className="text-xl font-bold uppercase">
                    THÔNG TIN HỌC VIÊN
                  </h1>

                  <p className="mt-2 text-sm text-gray-500">
                    Học viên {index + 1}
                  </p>
                </div>

                {/* BẢNG */}

                <table className="w-full border-collapse border border-black">
                  <tbody>
                    <tr>
                      <td className="w-[35%] border border-black p-3 font-bold">
                        Mã số học viên
                      </td>

                      <td className="border border-black p-3">
                        {student.maSoHV}
                      </td>
                    </tr>

                    <tr>
                      <td className="border border-black p-3 font-bold">
                        Họ và tên
                      </td>

                      <td className="border border-black p-3">
                        {student.name}
                      </td>
                    </tr>

                    <tr>
                      <td className="border border-black p-3 font-bold">
                        Ngành đào tạo
                      </td>

                      <td className="border border-black p-3">
                        {major ? `${major.name}${major.shortName ? ` (${major.shortName})` : ""}` : "Không xác định"}
                      </td>
                    </tr>

                    <tr>
                      <td className="border border-black p-3 font-bold">
                        Lớp học
                      </td>

                      <td className="border border-black p-3">
                        {classItem?.name ?? "Không xác định"}
                      </td>
                    </tr>

                    <tr>
                      <td className="border border-black p-3 font-bold">
                        Đơn vị
                      </td>

                      <td className="border border-black p-3">
                        {student.donVi}
                      </td>
                    </tr>

                    <tr>
                      <td className="border border-black p-3 font-bold">
                        Chức vụ
                      </td>

                      <td className="border border-black p-3">
                        {student.chucVu}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* FOOTER */}

        <div className="flex justify-end gap-3 border-t bg-white px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>

          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={onExport}
          >
            Xuất Word
          </Button>
        </div>
      </div>
    </div>
  );
}
