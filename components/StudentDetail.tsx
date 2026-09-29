"use client";
import { useEffect, useState } from "react";
import type { ClassItem, NganhDaoTao, Student, QuanKhu } from "@/app/types/student";

type Props = { student: Student; majors: NganhDaoTao[]; classes: ClassItem[]; quanKhu?: QuanKhu[]; onClose: () => void };
type Unit = { id: string; name: string; parentId: string; type: string; source: string };
export default function StudentDetail({ student, majors, classes, quanKhu = [], onClose }: Props) {
  const [units, setUnits] = useState<Unit[]>([]);
  useEffect(() => { Promise.all([fetch("http://localhost:3001/suDoan"), fetch("http://localhost:3001/luDoan")]).then(async ([sd, ld]) => { const [a,b] = await Promise.all([sd.json(),ld.json()]); setUnits([...a.map((x:any)=>({id:x.id,name:x.nameSuDoan,parentId:x.idQuanKhu,type:"Sư đoàn",source:"suDoan"})), ...b.map((x:any)=>({id:x.id,name:x.nameLuDoan,parentId:x.idQuanKhu,type:"Lữ đoàn",source:"luDoan"}))]); }); }, []);
  const major = majors.find((item) => item.id === student.majorId);
  const classItem = classes.find((item) => String(item.id) === String(student.classId) && String(item.majorId) === String(student.majorId));
  const qk = quanKhu.find((item) => item.id === student.quanKhuId);
  const unit = units.find((item) => `${item.source}:${item.id}` === student.donViCap2Id || item.id === student.donViCap2Id);
  const rows = [["Mã số học viên", student.maSoHV], ["Họ và tên", student.name], ["Ngành đào tạo", major?.name ?? "Không xác định"], ["Lớp học", classItem?.name ?? "Không xác định"], ["Quân khu", qk?.nameQuanKhu ?? "Chưa cập nhật"], ["Sư đoàn/Lữ đoàn", unit ? `${unit.type} ${unit.name}` : "Chưa cập nhật"], ["Đại đội", student.donVi], ["Chức vụ", student.chucVu], ["Dân tộc", student.danToc], ["Ngày sinh", student.birthDay ? new Date(student.birthDay).toLocaleDateString("vi-VN") : "Chưa cập nhật"], ["Cấp bậc", student.capBac]];
  return <div className="space-y-4 p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Chi tiết học viên</h2><p className="text-sm text-gray-500">Thông tin hiện tại trong hệ thống</p></div><button type="button" onClick={onClose} className="text-2xl text-gray-500 hover:text-red-600">×</button></div><dl className="divide-y rounded-lg border">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-3 gap-3 p-3 text-sm"><dt className="font-semibold text-gray-600">{label}</dt><dd className="col-span-2">{value}</dd></div>)}</dl><div className="flex justify-end"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 hover:bg-gray-50">Đóng</button></div></div>;
}
