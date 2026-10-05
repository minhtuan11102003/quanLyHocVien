import JSZip from "jszip";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Docxtemplater from "docxtemplater";
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

type Item = {
  id: string;
  studentName: string;
  maSoHV: string;
  category: string;
  currentRank: string;
  proposedRank: string;
  reason: string;
  submittedAt: string;
  reviewedAt?: string;
  className?: string;
  majorName?: string;
  companyName?: string;
  enlistedAt?: string;
  positionName?: string;
};
type ExportMode = "collective" | "individual";

export const runtime = "nodejs";

const run = (text: string, options: object = {}) =>
  new TextRun({ text, font: "Times New Roman", size: 26, ...options });
const p = (text = "", options: { bold?: boolean; italics?: boolean; indent?: boolean; alignment?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) =>
  new Paragraph({ alignment: options.alignment, spacing: { after: 100 }, indent: options.indent ? { firstLine: 720 } : undefined, children: [run(text, options)] });
const centered = (text: string, options: object = {}) =>
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 70 }, children: [run(text, options)] });
const tableCell = (text: string, bold = false) => new TableCell({ children: [new Paragraph({ children: [run(text, { bold })] })] });
const table = (rows: string[][], headers = true) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows.map((row, index) => new TableRow({ children: row.map((value) => tableCell(value, headers && index === 0)) })) });
const date = (value?: string) => new Date(value ?? new Date()).toLocaleDateString("vi-VN");
const safeFilename = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const monthYear = (value?: string) => {
  const matched = String(value ?? "").match(/^(\d{4})-(\d{2})/);
  return matched ? `${matched[2]}/${matched[1]}` : value || "";
};
const renderTemplate = async (filename: string, data: Record<string, unknown>) => {
  const source = await readFile(path.join(process.cwd(), "public", "word-templates", filename));
  const doc = new Docxtemplater(new PizZip(source), {
    delimiters: { start: "${", end: "}" },
    paragraphLoop: true,
    linebreaks: true,
  });
  doc.render(data);
  return doc.getZip().generate({ type: "nodebuffer" });
};

const header = (number: string) => [
  new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [
    new TableCell({ children: [centered("BỘ QUỐC PHÒNG", { bold: true }), centered("TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true }), centered(`Số: ${number}`, { italics: true })] }),
    new TableCell({ children: [centered("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", { bold: true }), centered("Độc lập - Tự do - Hạnh phúc", { bold: true }), centered("────────", { bold: true }), centered(`Hồ Chí Minh, ngày ${date()}`)] }),
  ] })] }),
  centered("DỰ THẢO THAM KHẢO", { bold: true, color: "C00000" }),
  centered("QUYẾT ĐỊNH", { bold: true, size: 30 }),
  centered("Về việc thăng cấp bậc quân hàm đối với học viên", { bold: true, size: 28 }),
  centered("HIỆU TRƯỞNG TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true }),
  p("Căn cứ Luật Nghĩa vụ quân sự năm 2015;", { italics: true, indent: true }),
  p("Căn cứ Thông tư số 07/2016/TT-BQP ngày 26 tháng 01 năm 2016 của Bộ trưởng Bộ Quốc phòng quy định phong, thăng, giáng cấp bậc quân hàm đối với hạ sĩ quan, binh sĩ Quân đội nhân dân Việt Nam;", { italics: true, indent: true }),
  p("Căn cứ chức năng, nhiệm vụ, quyền hạn và quy chế tổ chức, hoạt động của Trường Cao đẳng Hậu cần 2;", { italics: true, indent: true }),
  p("Theo đề nghị của cơ quan tham mưu và đơn vị quản lý học viên;", { italics: true, indent: true }),
  centered("QUYẾT ĐỊNH:", { bold: true }),
];

const signing = () => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [
  new TableCell({ children: [p("Nơi nhận:", { bold: true }), p("- Như Điều 3;"), p("- Lưu: VT, Hồ sơ.")] }),
  new TableCell({ children: [centered("HIỆU TRƯỞNG", { bold: true }), centered("(Ký, ghi rõ họ tên, đóng dấu)", { italics: true }), p(""), centered("[HỌ VÀ TÊN NGƯỜI KÝ]", { bold: true })] }),
] })] });

const extract = () => [
  p(""), centered("TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true }), centered("TRÍCH SAO", { bold: true, size: 30 }),
  centered("Số: .../TS-CĐHC2", { italics: true }),
  new Paragraph({ alignment: AlignmentType.RIGHT, children: [run("HIỆU TRƯỞNG", { bold: true })] }),
  new Paragraph({ alignment: AlignmentType.RIGHT, children: [run("(Ký, ghi rõ họ tên, đóng dấu)", { italics: true })] }),
];

const individualDocument = (item: Item) => new Document({ sections: [{ children: [
  ...header(".../QĐ-CĐHC2"),
  p("Điều 1. Thăng cấp bậc quân hàm cho học viên có tên sau đây:", { indent: true }),
  table([["Họ và tên", item.studentName], ["Mã số học viên", item.maSoHV], ["Đơn vị quản lý", item.companyName || "Chưa cập nhật"], ["Lớp", item.className || "Chưa cập nhật"], ["Chuyên ngành", item.majorName || "Chưa cập nhật"], ["Cấp bậc hiện tại", item.currentRank], ["Cấp bậc được thăng", item.proposedRank], ["Thời điểm hưởng", `Kể từ ngày ${date(item.reviewedAt)}`], ["Căn cứ xét", item.reason || "Theo hồ sơ đã được phê duyệt."]], false),
  p("Điều 2. Việc công bố quyết định và bổ sung vào hồ sơ học viên thực hiện theo quy định hiện hành.", { indent: true }),
  p("Điều 3. Các cơ quan, đơn vị và cá nhân có tên tại Điều 1 chịu trách nhiệm thi hành Quyết định này. Quyết định có hiệu lực kể từ ngày ký.", { indent: true }),
  signing(), ...extract(),
] }] });

const collectiveDocument = (items: Item[]) => {
  const classNames = [...new Set(items.map((item) => item.className || "Chưa cập nhật lớp"))].join(", ");
  const majorNames = [...new Set(items.map((item) => item.majorName || "Chưa cập nhật chuyên ngành"))].join(", ");
  const companyNames = [...new Set(items.map((item) => item.companyName || "Chưa cập nhật đại đội"))].join(", ");
  const rows = [["TT", "Họ và tên", "Nhập ngũ", "Chức vụ", "Từ cấp bậc", "Lên cấp bậc", "Ghi chú"], ...items.map((item, index) => [String(index + 1), item.studentName, monthYear(item.enlistedAt), item.positionName || "Học viên", item.currentRank, item.proposedRank, ""])];
  const listTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, index) => new TableRow({ tableHeader: index === 0, children: row.map((value) => tableCell(value, index === 0)) })),
  });
  const children = [
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [
      new TableCell({ children: [centered("TỔNG CỤC HẬU CẦN", { bold: true }), centered("TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true }), centered("Số: .../...", { italics: true })] }),
      new TableCell({ children: [centered("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", { bold: true }), centered("Độc lập - Tự do - Hạnh phúc", { bold: true }), centered("────────", { bold: true }), centered(`Thành phố Hồ Chí Minh, ngày ${date()}`, { italics: true })] }),
    ] })] }),
    p(""),
    centered("DANH SÁCH ĐỀ NGHỊ THĂNG QUÂN HÀM CHO HỌC VIÊN", { bold: true, size: 27 }),
    centered(`Lớp: ${classNames}; Chuyên ngành: ${majorNames}; Đại đội: ${companyNames}`, { bold: true }),
    listTable,
    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 300 }, children: [run("HIỆU TRƯỞNG", { bold: true })] }),
    new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 560 }, children: [run("[HỌ VÀ TÊN NGƯỜI KÝ]", { bold: true })] }),
  ];
  return new Document({ sections: [{ children }] });
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { requests?: Item[]; mode?: ExportMode; documentNumber?: string; signedDate?: string; signerName?: string };
    const items = body.requests ?? [];
    const mode = body.mode;
    const documentNumber = String(body.documentNumber ?? "").trim();
    const signedDate = String(body.signedDate ?? "").trim();
    const signerName = String(body.signerName ?? "").trim();
    if (!items.length || !["collective", "individual"].includes(mode ?? "") || items.some((item) => !item.studentName || !item.maSoHV || !item.proposedRank))
      return Response.json({ message: "Danh sách hồ sơ hoặc hình thức xuất không hợp lệ" }, { status: 400 });
    if (!documentNumber || !signedDate || !signerName)
      return Response.json({ message: "Thiếu số văn bản, ngày ký hoặc người ký" }, { status: 400 });

    if (mode === "collective") {
      const output = await renderTemplate("danh-sach-de-nghi-thang-quan-ham.docx", {
        so_van_ban: documentNumber,
        ngay_van_ban: signedDate,
        lop: [...new Set(items.map((item) => item.className || "Chưa cập nhật lớp"))].join(", "),
        chuyen_nganh: [...new Set(items.map((item) => item.majorName || "Chưa cập nhật chuyên ngành"))].join(", "),
        dai_doi: [...new Set(items.map((item) => item.companyName || "Chưa cập nhật đại đội"))].join(", "),
        nguoi_ky: signerName,
        students: items.map((item, index) => ({
          tt: index + 1,
          ho_ten: item.studentName,
          ngay_nhap_ngu: monthYear(item.enlistedAt),
          chuc_vu: item.positionName || "Học viên",
          cap_bac_cu: item.currentRank,
          cap_bac_moi: item.proposedRank,
          ghi_chu: "",
        })),
      }).catch(() => Packer.toBuffer(collectiveDocument(items)));
      return new Response(output as unknown as BodyInit, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": 'attachment; filename="quyet-dinh-thang-cap-tap-the.docx"' } });
    }

    const zip = JSZip();
    for (const item of items) {
      const output = await renderTemplate("quyet-dinh-thang-quan-ham-ca-nhan.docx", {
        so_van_ban: documentNumber,
        ngay_van_ban: signedDate,
        ho_ten: item.studentName,
        ma_so_hv: item.maSoHV,
        lop: item.className || "Chưa cập nhật lớp",
        chuyen_nganh: item.majorName || "Chưa cập nhật chuyên ngành",
        dai_doi: item.companyName || "Chưa cập nhật đại đội",
        cap_bac_cu: item.currentRank,
        cap_bac_moi: item.proposedRank,
        ngay_quyet_dinh: signedDate,
        can_cu_xet: item.reason || "Theo hồ sơ đã được phê duyệt",
        nguoi_ky: signerName,
      }).catch(() => Packer.toBuffer(individualDocument(item)));
      zip.file(`quyet-dinh-${item.maSoHV}-${safeFilename(item.studentName)}.docx`, output);
    }
    const output = await zip.generateAsync({ type: "uint8array" });
    return new Response(output as unknown as BodyInit, { headers: { "Content-Type": "application/zip", "Content-Disposition": 'attachment; filename="quyet-dinh-thang-cap-ca-nhan.zip"' } });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Không thể xuất quyết định" }, { status: 500 });
  }
}
