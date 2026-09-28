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
