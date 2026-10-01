"use client";
import type { StudentProfileExtra } from "@/app/types/student";

type Props = {
  value: StudentProfileExtra;
  onChange: (name: keyof StudentProfileExtra, value: string) => void;
};
type Field = {
  key: keyof StudentProfileExtra;
  label: string;
  type?: "date" | "tel";
};
const groups: { title: string; fields: Field[] }[] = [
  {
    title: "Thông tin cá nhân",
    fields: [
      { key: "gioiTinh", label: "Giới tính" },
      { key: "tonGiao", label: "Tôn giáo" },
      { key: "sucKhoe", label: "Sức khỏe" },
      { key: "vanHoa", label: "Trình độ văn hóa" },
      { key: "ngayNhapNgu", label: "Ngày nhập ngũ", type: "date" },
      { key: "donViCu", label: "Đơn vị cũ" },
      { key: "soHieuQuanNhan", label: "Số hiệu quân nhân" },
      { key: "soTheBHYT", label: "Số thẻ BHYT" },
    ],
  },
  {
    title: "Đoàn, Đảng và giấy tờ",
    fields: [
      { key: "ngayVaoDoan", label: "Ngày vào Đoàn", type: "date" },
      { key: "ngayVaoDang", label: "Ngày vào Đảng", type: "date" },
      { key: "ngayChinhThuc", label: "Ngày chính thức", type: "date" },
      { key: "soCCCD", label: "Số CMND/CCCD" },
      { key: "ngayCapCCCD", label: "Ngày cấp CCCD", type: "date" },
      { key: "noiCapCCCD", label: "Nơi cấp CCCD" },
    ],
  },
  {
    title: "Gia đình",
    fields: [
      { key: "hoTenCha", label: "Họ tên cha" },
      { key: "ngheNghiepCha", label: "Nghề nghiệp cha" },
      { key: "noiLamViecCha", label: "Nơi làm việc cha" },
      { key: "sdtCha", label: "SĐT cha", type: "tel" },
      { key: "hoTenMe", label: "Họ tên mẹ" },
      { key: "ngheNghiepMe", label: "Nghề nghiệp mẹ" },
      { key: "noiLamViecMe", label: "Nơi làm việc mẹ" },
      { key: "sdtMe", label: "SĐT mẹ", type: "tel" },
      { key: "hoTenVoChong", label: "Họ tên vợ/chồng" },
      { key: "ngheNghiepVoChong", label: "Nghề nghiệp vợ/chồng" },
      { key: "noiLamViecVoChong", label: "Nơi làm việc vợ/chồng" },
      { key: "sdtVoChong", label: "SĐT vợ/chồng", type: "tel" },
    ],
  },
  {
    title: "Quê quán và đào tạo",
    fields: [
      { key: "queQuan", label: "Quê quán" },
      { key: "nguyenQuan", label: "Nguyên quán" },
      { key: "truQuan", label: "Trú quán" },
      { key: "diaChi", label: "Địa chỉ chi tiết" },
      { key: "trinhDoDaoTao", label: "Trình độ đào tạo" },
      { key: "nganhDaoTao", label: "Ngành đào tạo" },
      { key: "namTotNghiep", label: "Năm tốt nghiệp" },
      { key: "xepLoai", label: "Xếp loại" },
      { key: "doiTuongDaoTao", label: "Đối tượng đi đào tạo" },
      { key: "nangKhieu", label: "Năng khiếu" },
      { key: "soDienThoai", label: "Số điện thoại", type: "tel" },
    ],
  },
  {
    title: "Biến động hồ sơ và người báo tin",
    fields: [
      { key: "ngayTang", label: "Ngày tăng", type: "date" },
      { key: "lyDoTang", label: "Lý do tăng" },
      { key: "ngayGiam", label: "Ngày giảm", type: "date" },
      { key: "lyDoGiam", label: "Lý do giảm" },
      { key: "nguoiBaoTin", label: "Người cần báo tin" },
      { key: "diaChiBaoTin", label: "Địa chỉ báo tin" },
      { key: "sdtBaoTin", label: "Số điện thoại báo tin", type: "tel" },
    ],
  },
];
export default function StudentProfileExtraFields({ value, onChange }: Props) {
  return (
    <div className="space-y-5 rounded-xl border bg-slate-50 p-4">
      <div>
        <h3 className="text-lg font-bold text-slate-800">
          Thông tin hồ sơ mở rộng
        </h3>
        <p className="text-sm text-slate-500">
          Các trường theo mẫu quản lý hồ sơ; không bắt buộc nếu chưa có dữ liệu.
        </p>
      </div>
      {groups.map((group) => (
        <section key={group.title}>
          <h4 className="mb-3 border-b pb-2 font-semibold text-blue-800">
            {group.title}
          </h4>
          <div className="grid gap-3 md:grid-cols-2">
            {group.fields.map((field) => (
              <label
                key={field.key}
                className="text-sm font-medium text-slate-700"
              >
                {field.label}
                <input
                  type={field.type || "text"}
                  value={value[field.key]}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-white px-3 py-2.5 font-normal outline-none focus:border-blue-500"
                />
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
