"use client";
import type { ClassItem, NganhDaoTao, Student } from "@/app/types/student";

type Props = { student: Student; majors: NganhDaoTao[]; classes: ClassItem[]; onClose: () => void };
export default function StudentDetail({ student, majors, classes, onClose }: Props) {
  const major = majors.find((item) => item.id === student.majorId);
  const classItem = classes.find((item) => item.id === student.classId && item.majorId === student.majorId);
  const rows = [["Mã số học viên", student.maSoHV], ["Họ và tên", student.name], ["Ngành đào tạo", major?.name ?? "Không xác định"], ["Lớp học", classItem?.name ?? "Không xác định"], ["Đơn vị", student.donVi], ["Chức vụ", student.chucVu], ["Dân tộc", student.danToc], ["Ngày sinh", student.birthDay ? new Date(student.birthDay).toLocaleDateString("vi-VN") : "Chưa cập nhật"], ["Cấp bậc", student.capBac]];
  return <div className="space-y-4 p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Chi tiết học viên</h2><p className="text-sm text-gray-500">Thông tin hiện tại trong hệ thống</p></div><button type="button" onClick={onClose} className="text-2xl text-gray-500 hover:text-red-600">×</button></div><dl className="divide-y rounded-lg border">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-3 gap-3 p-3 text-sm"><dt className="font-semibold text-gray-600">{label}</dt><dd className="col-span-2">{value}</dd></div>)}</dl><div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 hover:bg-gray-50">Đóng</button></div></div>;
}
