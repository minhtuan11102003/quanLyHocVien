export type Student = {
  id: string;
  maSoHV: string;
  name: string;
  majorId: string;
  classId: string;
  donVi: string;
  chucVu: string;
  danToc: string;
  birthDay: string;
  capBac: string;
  quanKhuId: string;
  donViCap2Id: string;
  tieuDoanId?: string;
  daiDoiId?: string;
  originQuanKhuId?: string;
  originDonViCap2Id?: string;
  graduationStatus?: "graduated" | string;
  graduatedAt?: string;
  [key: string]: unknown;
};


export type StudentProfileExtra = {
  gioiTinh: string;
  tonGiao: string;
  sucKhoe: string;
  vanHoa: string;
  ngayNhapNgu: string;
  donViCu: string;
  ngayVaoDoan: string;
  ngayVaoDang: string;
  ngayChinhThuc: string;
  soTheBHYT: string;
  soCCCD: string;
  ngayCapCCCD: string;
  noiCapCCCD: string;
  soHieuQuanNhan: string;
  hoTenCha: string;
  ngheNghiepCha: string;
  noiLamViecCha: string;
  sdtCha: string;
  hoTenMe: string;
  ngheNghiepMe: string;
  noiLamViecMe: string;
  sdtMe: string;
  hoTenVoChong: string;
  ngheNghiepVoChong: string;
  noiLamViecVoChong: string;
  sdtVoChong: string;
  queQuan: string;
  nguyenQuan: string;
  truQuan: string;
  diaChi: string;
  trinhDoDaoTao: string;
  nganhDaoTao: string;
  namTotNghiep: string;
  xepLoai: string;
  ngayTang: string;
  lyDoTang: string;
  ngayGiam: string;
  lyDoGiam: string;
  nguoiBaoTin: string;
  diaChiBaoTin: string;
  sdtBaoTin: string;
  doiTuongDaoTao: string;
  nangKhieu: string;
  soDienThoai: string;
};

export const emptyStudentProfileExtra: StudentProfileExtra = {
  gioiTinh: "", tonGiao: "", sucKhoe: "", vanHoa: "", ngayNhapNgu: "", donViCu: "",
  ngayVaoDoan: "", ngayVaoDang: "", ngayChinhThuc: "", soTheBHYT: "", soCCCD: "", ngayCapCCCD: "", noiCapCCCD: "", soHieuQuanNhan: "",
  hoTenCha: "", ngheNghiepCha: "", noiLamViecCha: "", sdtCha: "", hoTenMe: "", ngheNghiepMe: "", noiLamViecMe: "", sdtMe: "",
  hoTenVoChong: "", ngheNghiepVoChong: "", noiLamViecVoChong: "", sdtVoChong: "", queQuan: "", nguyenQuan: "", truQuan: "", diaChi: "",
  trinhDoDaoTao: "", nganhDaoTao: "", namTotNghiep: "", xepLoai: "", ngayTang: "", lyDoTang: "", ngayGiam: "", lyDoGiam: "",
  nguoiBaoTin: "", diaChiBaoTin: "", sdtBaoTin: "", doiTuongDaoTao: "", nangKhieu: "", soDienThoai: "",
};

export type NganhDaoTao = {
  id: string;
  name: string;
  shortName: string;
};

export type ClassItem = {
  id: string;
  majorId: string;
  name: string;
};

export type QuanKhu = {
  id: string;
  nameQuanKhu: string;
  code: string;
  description: string;
};

export type PaginationItem = number | "...";

export type DonViCap2 = {
  id: string;
  name: string;
  parentId: string;
  type: "Sư đoàn" | "Lữ đoàn";
  source: "suDoan" | "luDoan";
};
