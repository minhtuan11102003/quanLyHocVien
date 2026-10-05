import { readFile } from "node:fs/promises";
import path from "node:path";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";
import PizZip from "pizzip";
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

export const runtime = "nodejs";

type Student = Record<string, unknown> & {
  id: string;
  name: string;
  maSoHV: string;
  capBac?: string;
  chucVu?: string;
  birthDay?: string;
  className?: string;
  majorName?: string;
};
type FormName = "phieuhv" | "sodiemdanh" | "thehv";
const run = (text: string, options: Record<string, unknown> = {}) =>
  new TextRun({ text, font: "Times New Roman", size: 24, ...options });
const paragraph = (text = "", options: Record<string, unknown> = {}) =>
  new Paragraph({
    children: [run(text, options)],
    spacing: { after: 90 },
    ...options,
  });
const centered = (text: string, options: Record<string, unknown> = {}) =>
  paragraph(text, { alignment: AlignmentType.CENTER, ...options });
const header = () =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              centered("TỔNG CỤC HẬU CẦN", { bold: true }),
              centered("TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true }),
            ],
          }),
          new TableCell({
            children: [
              centered("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", { bold: true }),
              centered("Độc lập - Tự do - Hạnh phúc", { bold: true }),
            ],
          }),
        ],
      }),
    ],
  });
const doc = (children: (Paragraph | Table)[]) =>
  new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } },
        },
        children,
      },
    ],
  });
const landscapeDoc = (children: (Paragraph | Table)[]) =>
  new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 16838, height: 11906, orientation: "landscape" },
            margin: { top: 700, right: 700, bottom: 700, left: 700 },
          },
        },
        children,
      },
    ],
  });
const value = (student: Student, key: string) => String(student[key] || "");

export const studentSheet = (student: Student) =>
  doc([
    header(),
    paragraph(
      `Số phiếu: ...........................                                      Mã số học viên: ${student.maSoHV}`,
      { italics: true },
    ),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                centered("Ảnh màu", { italics: true }),
                centered("3 x 4 cm", { italics: true }),
              ],
            }),
            new TableCell({
              children: [
                centered("PHIẾU HỌC VIÊN", { bold: true, size: 32 }),
                centered(
                  `Lớp ${value(student, "classDisplay") || student.className || "................"} - Chuyên ngành: ${student.majorName || "................"}`,
                  { italics: true },
                ),
              ],
            }),
          ],
        }),
      ],
    }),
    paragraph(`Họ và tên (chữ in hoa): ${student.name.toUpperCase()}`, {
      bold: true,
    }),
    paragraph(
      `Ngày sinh: ${student.birthDay || "................"}  -  Nơi sinh: ${value(student, "nguyenQuan") || "................"}                         Nam ☐  Nữ ☐`,
    ),
    paragraph(
      `Cấp bậc: ${student.capBac || "................"}  -  Chức vụ: ${student.chucVu || "Học viên"}  -  Tiểu đội: ................`,
    ),
    paragraph(
      `Hộ khẩu thường trú: ${value(student, "truQuan") || value(student, "diaChi") || "................................................................"}`,
    ),
    paragraph(
      `Điện thoại liên hệ: ${value(student, "soDienThoai") || "................"}`,
    ),
    paragraph(
      `Dân tộc: ${student.danToc || "................"}  -  Tôn giáo: ${value(student, "tonGiao") || "................"}`,
    ),
    paragraph(
      `Ngày, tháng, năm nhập ngũ: ${value(student, "ngayNhapNgu") || "................"}  -  Đơn vị cũ: ${value(student, "donViCu") || "................"}`,
    ),
    paragraph(
      "Diện chính sách:   ☐ Con liệt sỹ     ☐ Con thương binh     ☐ Người dân tộc     ☐ Diện khác",
    ),
    paragraph(
      `Ngày vào Đoàn TNCS Hồ Chí Minh: ${value(student, "ngayVaoDoan") || "................"}`,
    ),
    paragraph(
      `Ngày vào Đảng CSVN: ${value(student, "ngayVaoDang") || "................"}                         Chính thức: ${value(student, "ngayChinhThuc") || "................"}`,
    ),
    paragraph(
      `Năng khiếu cá nhân: ${value(student, "nangKhieu") || "................................................................"}`,
    ),
    paragraph(
      `Họ tên cha: ${value(student, "hoTenCha") || "................"}  -  Nghề nghiệp: ${value(student, "ngheNghiepCha") || "................"}`,
    ),
    paragraph(
      `Nơi làm việc, số điện thoại: ${value(student, "noiLamViecCha") || "................"} - ${value(student, "sdtCha") || "................"}`,
    ),
    paragraph(
      `Họ tên mẹ: ${value(student, "hoTenMe") || "................"}  -  Nghề nghiệp: ${value(student, "ngheNghiepMe") || "................"}`,
    ),
    paragraph(
      `Nơi làm việc, số điện thoại: ${value(student, "noiLamViecMe") || "................"} - ${value(student, "sdtMe") || "................"}`,
    ),
    paragraph(
      `Họ tên vợ/chồng: ${value(student, "hoTenVoChong") || "................"}  -  Nghề nghiệp: ${value(student, "ngheNghiepVoChong") || "................"}`,
    ),
    paragraph(
      `Nơi làm việc, số điện thoại: ${value(student, "noiLamViecVoChong") || "................"} - ${value(student, "sdtVoChong") || "................"}`,
    ),
    paragraph(
      `Khi cần báo tin cho ai: ${value(student, "nguoiBaoTin") || "................"}`,
    ),
    paragraph(
      `Địa chỉ: ${value(student, "diaChiBaoTin") || "................................................................"}`,
    ),
    paragraph("Ghi chú:", { bold: true, underline: {} }),
    paragraph(
      "- Mỗi học viên lập 02 phiếu: Phòng Đào tạo lưu 01, cán bộ quản lý lớp 01;",
      { indent: true },
    ),
    paragraph(
      "- Cán bộ quản lý lớp kiểm tra đầy đủ thông tin mới ký vào phiếu;",
      { indent: true },
    ),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                paragraph(
                  "Yêu cầu ghi đầy đủ, chính xác. Phiếu là căn cứ quản lý và cấp bằng tốt nghiệp.",
                  { italics: true },
                ),
              ],
            }),
            new TableCell({
              children: [
                centered("HỌC VIÊN KÝ", { bold: true }),
                paragraph(""),
                centered(student.name, { bold: true }),
              ],
            }),
          ],
        }),
      ],
    }),
    centered("KẾT QUẢ HỌC TẬP, RÈN LUYỆN", { bold: true }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            "Kết quả",
            "HK1",
            "HK2",
            "Năm 1",
            "HK3",
            "HK4",
            "Năm 2",
            "Toàn khóa",
          ].map(
            (item) =>
              new TableCell({
                children: [
                  paragraph(item, {
                    bold: true,
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
          ),
        }),
        ...[
          "Kết quả học tập",
          "Kết quả rèn luyện",
          "Khen thưởng",
          "Kỷ luật",
        ].map(
          (label) =>
            new TableRow({
              children: [label, "", "", "", "", "", "", ""].map(
                (item) => new TableCell({ children: [paragraph(item)] }),
              ),
            }),
        ),
      ],
    }),
  ]);

export const attendance = (students: Student[]) => {
  const groups = [
    ...students
      .reduce((map, student) => {
        const key = `${student.majorName || "Chưa cập nhật chuyên ngành"}__${student.className || "Chưa cập nhật lớp"}`;
        map.set(key, [...(map.get(key) || []), student]);
        return map;
      }, new Map<string, Student[]>())
      .entries(),
  ];
  const headerCells = [
    "TT",
    "Họ và tên",
    "Cấp bậc",
    "Chức vụ",
    ...Array.from({ length: 7 }, (_, index) => `Tháng ${index + 1}`),
  ];
  const rows = [
    new TableRow({
      children: headerCells.map(
        (item) =>
          new TableCell({
            children: [
              paragraph(item, {
                bold: true,
                alignment: AlignmentType.CENTER,
                size: 18,
              }),
            ],
          }),
      ),
    }),
    new TableRow({
      children: [
        "",
        "",
        "",
        "",
        ...Array.from({ length: 7 }, () => "T1   T2   T3   T4"),
      ].map(
        (item) =>
          new TableCell({
            children: [
              paragraph(item, {
                bold: true,
                alignment: AlignmentType.CENTER,
                size: 16,
              }),
            ],
          }),
      ),
    }),
    ...groups.flatMap(([key, group]) => {
      const [major, className] = key.split("__");
      return [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: headerCells.length,
              children: [
                paragraph(
                  `+ CHUYÊN NGÀNH ${major} - LỚP ${className} = ${group.length}`,
                  { bold: true, size: 18 },
                ),
              ],
            }),
          ],
        }),
        ...group.map(
          (student, index) =>
            new TableRow({
              children: [
                String(index + 1),
                student.name,
                student.capBac || "",
                student.chucVu || "Học viên",
                ...Array.from({ length: 7 }, () => ""),
              ].map(
                (item) =>
                  new TableCell({ children: [paragraph(item, { size: 18 })] }),
              ),
            }),
        ),
      ];
    }),
  ];
  return landscapeDoc([
    header(),
    centered("DANH SÁCH ĐIỂM DANH HỌC VIÊN", { bold: true, size: 28 }),
    centered(
      `Đơn vị: ${value(students[0] || ({} as Student), "daiDoiName") || "Đại đội quản lý"}`,
    ),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 360 },
      children: [run("HIỆU TRƯỞNG", { bold: true })],
    }),
  ]);
};
const renderStudentSheet = async (student: Student) => {
  const source = await readFile(
    path.join(
      process.cwd(),
      "public",
      "word-templates",
      "mau-phieu-hoc-vien.docx",
    ),
  );
  const template = new Docxtemplater(new PizZip(source), {
    delimiters: { start: "${", end: "}" },
    paragraphLoop: true,
    linebreaks: true,
  });
  template.render({
    ho_ten: student.name.toUpperCase(),
    HO_TEN: student.name.toUpperCase(),
    ma_so_hv: student.maSoHV,
    lop:
      value(student, "classDisplay") || student.className || "................",
    chuyen_nganh: student.majorName || "................",
    cap_bac: student.capBac || "................",
    chuc_vu: student.chucVu || "Học viên",
    ngay_sinh: formatDate(student.birthDay),
    gioi_tinh: value(student, "gioiTinh") || "................",
    noi_sinh: value(student, "nguyenQuan") || "................",
    dan_toc: value(student, "danToc") || "................",
    ton_giao: value(student, "tonGiao") || "................",
    ngay_nhap_ngu: value(student, "ngayNhapNgu") || "................",
    don_vi_cu: value(student, "donViCu") || "................",
    dia_chi: value(student, "diaChi") || "................",
    dien_thoai: value(student, "soDienThoai") || "................",
    ho_ten_cha: value(student, "hoTenCha") || "................",
    ho_ten_me: value(student, "hoTenMe") || "................",
    nguoi_bao_tin: value(student, "nguoiBaoTin") || "................",
    nghe_nghiep_cha: value(student, "ngheNghiepCha") || "................",
    noi_lam_viec_cha: value(student, "noiLamViecCha") || "................",
    sdt_cha: value(student, "sdtCha") || "................",
    nghe_nghiep_me: value(student, "ngheNghiepMe") || "................",
    noi_lam_viec_me: value(student, "noiLamViecMe") || "................",
    sdt_me: value(student, "sdtMe") || "................",
    ho_ten_vo_chong: value(student, "hoTenVoChong") || "................",
    nghe_nghiep_vo_chong:
      value(student, "ngheNghiepVoChong") || "................",
    noi_lam_viec_vo_chong:
      value(student, "noiLamViecVoChong") || "................",
    sdt_vo_chong: value(student, "sdtVoChong") || "................",
  });
  return template.getZip().generate({ type: "nodebuffer" });
};

const formatDate = (date?: string) => {
  if (!date) return "................";
  const match = String(date).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(date);
};

export const card = (student: Student) =>
  doc([
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                centered("TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true, size: 28 }),
                centered("THẺ HỌC VIÊN", { bold: true, size: 36 }),
                centered(student.name.toUpperCase(), { bold: true, size: 30 }),
                centered(`Lớp ${student.className || "................"}`),
                centered(
                  `Khoá học: ${value(student, "khoaHoc") || "................"}`,
                ),
                centered(`MSHV: ${student.maSoHV}`, { bold: true }),
              ],
            }),
          ],
        }),
      ],
    }),
  ]);

export async function POST(request: Request) {
  try {
    const { students, forms } = (await request.json()) as {
      students?: Student[];
      forms?: FormName[];
    };
    if (!students?.length || !forms?.length)
      return Response.json(
        { message: "Hãy chọn học viên và biểu mẫu cần xuất." },
        { status: 400 },
      );
    const normalized = students.map((student) => {
      const record = student as Record<string, unknown>;
      const text = (...keys: string[]) =>
        keys
          .map((key) => record[key])
          .find((item) => typeof item === "string" && item.trim()) as
          | string
          | undefined;
      return {
        ...student,
        name:
          text("name", "hoTen", "fullName", "studentName") ||
          "CHƯA CẬP NHẬT HỌ TÊN",
        maSoHV:
          text("maSoHV", "maHocVien", "studentCode") || "CHƯA CẬP NHẬT MÃ SỐ",
        className: text("className", "lopHoc", "tenLop") || "Chưa cập nhật lớp",
        majorName:
          text("majorName", "nganhDaoTao", "chuyenNganh", "tenNganh") ||
          "Chưa cập nhật chuyên ngành",
      };
    });
    const zip = new JSZip();
    if (forms.includes("phieuhv"))
      for (const student of normalized) {
        const output = await renderStudentSheet(student).catch(() =>
          Packer.toBuffer(studentSheet(student)),
        );
        zip.file(`phieu-hoc-vien-${student.maSoHV}.docx`, output);
      }
    if (forms.includes("thehv"))
      for (const student of normalized)
        zip.file(
          `the-hoc-vien-${student.maSoHV}.docx`,
          await Packer.toBuffer(card(student)),
        );
    if (forms.includes("sodiemdanh"))
      zip.file(
        "so-diem-danh-hoc-vien.docx",
        await Packer.toBuffer(attendance(normalized)),
      );
    const output = await zip.generateAsync({ type: "uint8array" });
    return new Response(output as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="bieu-mau-hoc-vien.zip"',
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Không thể xuất biểu mẫu học viên." },
      { status: 500 },
    );
  }
}
