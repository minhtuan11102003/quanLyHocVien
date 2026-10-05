import { writeFile } from "node:fs/promises";
import { Packer } from "docx";
import { attendance, card, studentSheet } from "../app/api/export-student-forms/route.ts";

await writeFile(
  new URL("../public/word-templates/mau-phieu-hoc-vien.docx", import.meta.url),
  await Packer.toBuffer(
    studentSheet({
      id: "TEMPLATE",
      name: "${ho_ten}",
      maSoHV: "${ma_so_hv}",
      className: "${lop}",
      classDisplay: "${lop}",
      majorName: "${chuyen_nganh}",
      capBac: "${cap_bac}",
      chucVu: "${chuc_vu}",
      birthDay: "${ngay_sinh}",
      gioiTinh: "${gioi_tinh}",
      nguyenQuan: "${noi_sinh}",
      danToc: "${dan_toc}",
      tonGiao: "${ton_giao}",
      ngayNhapNgu: "${ngay_nhap_ngu}",
      donViCu: "${don_vi_cu}",
      diaChi: "${dia_chi}",
      soDienThoai: "${dien_thoai}",
      hoTenCha: "${ho_ten_cha}",
      ngheNghiepCha: "${nghe_nghiep_cha}",
      noiLamViecCha: "${noi_lam_viec_cha}",
      sdtCha: "${sdt_cha}",
      hoTenMe: "${ho_ten_me}",
      ngheNghiepMe: "${nghe_nghiep_me}",
      noiLamViecMe: "${noi_lam_viec_me}",
      sdtMe: "${sdt_me}",
      hoTenVoChong: "${ho_ten_vo_chong}",
      ngheNghiepVoChong: "${nghe_nghiep_vo_chong}",
      noiLamViecVoChong: "${noi_lam_viec_vo_chong}",
      sdtVoChong: "${sdt_vo_chong}",
      nguoiBaoTin: "${nguoi_bao_tin}",
    }),
  ),
);

const placeholderStudent = {
  id: "TEMPLATE", name: "[HỌ VÀ TÊN HỌC VIÊN]", maSoHV: "[MÃ SỐ HỌC VIÊN]",
  className: "[LỚP HỌC]", majorName: "[CHUYÊN NGÀNH]", daiDoiName: "[ĐẠI ĐỘI QUẢN LÝ]",
  capBac: "[CẤP BẬC]", chucVu: "[CHỨC VỤ]", khoaHoc: "[KHÓA HỌC]",
};
await writeFile(
  new URL("../public/word-templates/mau-so-diem-danh.docx", import.meta.url),
  await Packer.toBuffer(attendance([placeholderStudent])),
);
await writeFile(
  new URL("../public/word-templates/mau-the-hoc-vien.docx", import.meta.url),
  await Packer.toBuffer(card(placeholderStudent)),
);
