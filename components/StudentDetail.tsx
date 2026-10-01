"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClassItem, NganhDaoTao, QuanKhu, Student } from "@/app/types/student";

type Props = {
  student: Student;
  majors: NganhDaoTao[];
  classes: ClassItem[];
  quanKhu?: QuanKhu[];
  onClose: () => void;
};
type Unit = { id: string; name: string; parentId: string; type: string; source: string };
type UnitRecord = { id: string; nameSuDoan?: string; nameLuDoan?: string; idQuanKhu: string };
type Row = { label: string; value?: unknown; wide?: boolean };
type Section = { title: string; description: string; rows: Row[] };

const EMPTY = "Chưa cập nhật";
const formatDate = (value: unknown) => {
  if (!value) return EMPTY;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("vi-VN");
};
const valueOf = (value: unknown) => value === undefined || value === null || String(value).trim() === "" ? EMPTY : String(value);

export default function StudentDetail({ student, majors, classes, quanKhu = [], onClose }: Props) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [battalions, setBattalions] = useState<{ id: string; nameTieuDoan: string }[]>([]);
  const [companies, setCompanies] = useState<{ id: string; nameDaiDoi: string; idTieuDoan: string }[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch("http://localhost:3001/suDoan"), fetch("http://localhost:3001/luDoan"), fetch("http://localhost:3001/tieuDoan"), fetch("http://localhost:3001/daiDoi")])
      .then(async ([sd, ld, td, dd]) => {
        const [sdData, ldData, tdData, ddData] = await Promise.all([
          sd.ok ? sd.json() : [], ld.ok ? ld.json() : [], td.ok ? td.json() : [], dd.ok ? dd.json() : [],
        ]);
        if (cancelled) return;
        setBattalions(Array.isArray(tdData) ? tdData : []);
        setCompanies(Array.isArray(ddData) ? ddData : []);
        setUnits([
          ...((Array.isArray(sdData) ? sdData : []) as UnitRecord[]).map((x) => ({ id: x.id, name: x.nameSuDoan || "", parentId: x.idQuanKhu, type: "Sư đoàn", source: "suDoan" })),
          ...((Array.isArray(ldData) ? ldData : []) as UnitRecord[]).map((x) => ({ id: x.id, name: x.nameLuDoan || "", parentId: x.idQuanKhu, type: "Lữ đoàn", source: "luDoan" })),
        ]);
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoadingUnits(false); });
    return () => { cancelled = true; };
  }, []);

  const major = majors.find((item) => String(item.id) === String(student.majorId));
  const classItem = classes.find((item) => String(item.id) === String(student.classId) && String(item.majorId) === String(student.majorId));
  const qk = quanKhu.find((item) => String(item.id) === String(student.quanKhuId));
  const unit = units.find((item) => `${item.source}:${item.id}` === student.donViCap2Id || String(item.id) === String(student.donViCap2Id));
  const battalion = battalions.find((item) => String(item.id) === String(student.tieuDoanId));
  const company = companies.find((item) => String(item.id) === String(student.daiDoiId));

  const sections: Section[] = useMemo(() => [
    {
      title: "Thông tin nhận dạng",
      description: "Thông tin cơ bản của học viên",
      rows: [
        { label: "Mã số học viên", value: student.maSoHV }, { label: "Họ và tên", value: student.name },
        { label: "Ngày sinh", value: formatDate(student.birthDay) }, { label: "Giới tính", value: student.gioiTinh },
        { label: "Dân tộc", value: student.danToc }, { label: "Tôn giáo", value: student.tonGiao },
        { label: "Sức khỏe", value: student.sucKhoe }, { label: "Trình độ văn hóa", value: student.vanHoa },
      ],
    },
    {
      title: "Đào tạo và đơn vị",
      description: "Các liên kết quản lý hiện tại",
      rows: [
        { label: "Cấp bậc", value: student.capBac }, { label: "Chức vụ", value: student.chucVu },
        { label: "Ngành đào tạo", value: major ? `${major.name}${major.shortName ? ` (${major.shortName})` : ""}` : undefined }, { label: "Lớp học", value: classItem?.name },
        { label: "Quân khu", value: qk?.nameQuanKhu }, { label: "Sư đoàn/Lữ đoàn", value: loadingUnits ? "Đang tải..." : unit ? `${unit.type} ${unit.name}` : undefined },
        { label: "Tiểu đoàn", value: battalion?.nameTieuDoan || student.tieuDoanId }, { label: "Đại đội", value: company?.nameDaiDoi || student.donVi || student.daiDoiId },
        { label: "Đối tượng đi đào tạo", value: student.doiTuongDaoTao }, { label: "Đơn vị cũ", value: student.donViCu },
      ],
    },
    {
      title: "Giấy tờ và quá trình công tác",
      description: "Thông tin hồ sơ hành chính",
      rows: [
        { label: "Số CMND/CCCD", value: student.soCCCD }, { label: "Ngày cấp CCCD", value: formatDate(student.ngayCapCCCD) },
        { label: "Nơi cấp CCCD", value: student.noiCapCCCD }, { label: "Số thẻ BHYT", value: student.soTheBHYT },
        { label: "Số hiệu quân nhân", value: student.soHieuQuanNhan }, { label: "Ngày nhập ngũ", value: formatDate(student.ngayNhapNgu) },
        { label: "Ngày vào Đoàn", value: formatDate(student.ngayVaoDoan) }, { label: "Ngày vào Đảng", value: formatDate(student.ngayVaoDang) },
        { label: "Ngày chính thức", value: formatDate(student.ngayChinhThuc) }, { label: "Ngày tăng", value: formatDate(student.ngayTang) },
        { label: "Lý do tăng", value: student.lyDoTang, wide: true }, { label: "Ngày giảm", value: formatDate(student.ngayGiam) },
        { label: "Lý do giảm", value: student.lyDoGiam, wide: true },
      ],
    },
    {
      title: "Quê quán và đào tạo chuyên môn",
      description: "Địa chỉ và kết quả đào tạo",
      rows: [
        { label: "Quê quán", value: student.queQuan }, { label: "Nguyên quán", value: student.nguyenQuan },
        { label: "Trú quán", value: student.truQuan }, { label: "Địa chỉ chi tiết", value: student.diaChi, wide: true },
        { label: "Trình độ đào tạo", value: student.trinhDoDaoTao }, { label: "Ngành đào tạo ghi hồ sơ", value: student.nganhDaoTao },
        { label: "Năm tốt nghiệp", value: student.namTotNghiep }, { label: "Xếp loại", value: student.xepLoai },
        { label: "Năng khiếu", value: student.nangKhieu, wide: true },
      ],
    },
    {
      title: "Thông tin gia đình",
      description: "Thông tin thân nhân đã nhập",
      rows: [
        { label: "Họ tên cha", value: student.hoTenCha }, { label: "Nghề nghiệp cha", value: student.ngheNghiepCha },
        { label: "Nơi làm việc cha", value: student.noiLamViecCha }, { label: "Số điện thoại cha", value: student.sdtCha },
        { label: "Họ tên mẹ", value: student.hoTenMe }, { label: "Nghề nghiệp mẹ", value: student.ngheNghiepMe },
        { label: "Nơi làm việc mẹ", value: student.noiLamViecMe }, { label: "Số điện thoại mẹ", value: student.sdtMe },
        { label: "Họ tên vợ/chồng", value: student.hoTenVoChong }, { label: "Nghề nghiệp vợ/chồng", value: student.ngheNghiepVoChong },
        { label: "Nơi làm việc vợ/chồng", value: student.noiLamViecVoChong }, { label: "Số điện thoại vợ/chồng", value: student.sdtVoChong },
      ],
    },
    {
      title: "Liên hệ khi cần báo tin",
      description: "Thông tin dùng trong trường hợp khẩn cấp",
      rows: [
        { label: "Người cần báo tin", value: student.nguoiBaoTin }, { label: "Số điện thoại", value: student.sdtBaoTin },
        { label: "Địa chỉ", value: student.diaChiBaoTin, wide: true }, { label: "Số điện thoại cá nhân", value: student.soDienThoai },
      ],
    },
  ], [student, major, classItem, qk, unit, battalion, company, loadingUnits]);

  return <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
    <header className="flex items-center justify-between bg-gradient-to-r from-[#123a55] to-[#1d658a] px-6 py-5 text-white">
      <div><p className="text-sm text-blue-100">HỒ SƠ HỌC VIÊN</p><h2 className="mt-1 text-2xl font-bold">{student.name || "Chưa có tên"}</h2><p className="mt-1 text-sm text-blue-100">Mã số: {student.maSoHV || EMPTY}</p></div>
      <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-3xl leading-none text-white/80 hover:bg-white/15 hover:text-white" aria-label="Đóng">×</button>
    </header>
    <div className="overflow-y-auto p-5 sm:p-6">
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-blue-100 bg-white p-4"><p className="text-xs uppercase text-slate-500">Cấp bậc</p><p className="mt-1 text-lg font-bold text-blue-800">{valueOf(student.capBac)}</p></div>
        <div className="rounded-xl border border-blue-100 bg-white p-4"><p className="text-xs uppercase text-slate-500">Lớp học</p><p className="mt-1 text-lg font-bold text-slate-800">{valueOf(classItem?.name)}</p></div>
        <div className="rounded-xl border border-blue-100 bg-white p-4"><p className="text-xs uppercase text-slate-500">Đơn vị quản lý</p><p className="mt-1 text-lg font-bold text-slate-800">{valueOf(student.donVi)}</p></div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">{sections.map((section) => <section key={section.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 bg-slate-50 px-5 py-4"><h3 className="font-bold text-slate-800">{section.title}</h3><p className="mt-0.5 text-xs text-slate-500">{section.description}</p></div><dl className="grid gap-x-5 sm:grid-cols-2">{section.rows.map((row) => <div key={row.label} className={`border-b border-slate-100 px-5 py-3 ${row.wide ? "sm:col-span-2" : ""}`}><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{row.label}</dt><dd className={`mt-1 break-words text-sm ${row.value ? "text-slate-800" : "text-slate-400"}`}>{valueOf(row.value)}</dd></div>)}</dl></section>)}</div>
    </div>
    <footer className="flex justify-end border-t bg-white px-6 py-4"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50">Đóng hồ sơ</button></footer>
  </div>;
}
