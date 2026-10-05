import { mkdir, writeFile } from "node:fs/promises";
import { AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";

const out = new URL("../public/word-templates/", import.meta.url);
const text = (value, options = {}) => new TextRun({ text: value, font: "Times New Roman", size: 24, ...options });
const p = (value = "", options = {}) => new Paragraph({ alignment: options.alignment, spacing: { after: 75 }, indent: options.indent ? { firstLine: 600 } : undefined, children: [text(value, options)] });
const center = (value, options = {}) => p(value, { ...options, alignment: AlignmentType.CENTER });
const cell = (value, bold = false) => new TableCell({ children: [p(value, { bold })] });
const top = (number = "${so_van_ban}") => new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [
  new TableCell({ children: [center("TỔNG CỤC HẬU CẦN", { bold: true }), center("TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true }), center(`Số: ${number}`, { italics: true })] }),
  new TableCell({ children: [center("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", { bold: true }), center("Độc lập - Tự do - Hạnh phúc", { bold: true }), center("────────", { bold: true }), center("Thành phố Hồ Chí Minh, ngày ${ngay_van_ban}", { italics: true })] }),
] })] });
const save = async (filename, children) => writeFile(new URL(filename, out), await Packer.toBuffer(new Document({ sections: [{ properties: { page: { margin: { top: 1050, right: 1100, bottom: 1050, left: 1100 } } }, children }] })));

await mkdir(out, { recursive: true });

await save("danh-sach-de-nghi-thang-quan-ham.docx", [
  top(), p(), center("DANH SÁCH ĐỀ NGHỊ THĂNG QUÂN HÀM CHO HỌC VIÊN", { bold: true, size: 27 }),
  center("Lớp: ${lop}; Chuyên ngành: ${chuyen_nganh}; Đại đội: ${dai_doi}", { bold: true }),
  new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
    new TableRow({ tableHeader: true, children: ["TT", "Họ và tên", "Nhập ngũ", "Chức vụ", "Từ cấp bậc", "Lên cấp bậc", "Ghi chú"].map((value) => cell(value, true)) }),
    new TableRow({ children: [cell("${#students}${tt}"), cell("${ho_ten}"), cell("${ngay_nhap_ngu}"), cell("${chuc_vu}"), cell("${cap_bac_cu}"), cell("${cap_bac_moi}"), cell("${ghi_chu}${/students}")] }),
  ] }),
  p(""), new Paragraph({ alignment: AlignmentType.RIGHT, children: [text("HIỆU TRƯỞNG", { bold: true })] }),
  new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 560 }, children: [text("${nguoi_ky}", { bold: true })] }),
]);

await save("quyet-dinh-thang-quan-ham-ca-nhan.docx", [
  top(), p(), center("QUYẾT ĐỊNH", { bold: true, size: 30 }), center("Về việc thăng cấp bậc quân hàm đối với học viên", { bold: true, size: 27 }), p(),
  center("HIỆU TRƯỞNG TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true }), p(),
  p("Căn cứ Luật Nghĩa vụ quân sự năm 2015;", { italics: true, indent: true }),
  p("Căn cứ Thông tư số 07/2016/TT-BQP ngày 26 tháng 01 năm 2016 của Bộ trưởng Bộ Quốc phòng;", { italics: true, indent: true }),
  p("Theo đề nghị của cơ quan tham mưu và đơn vị quản lý học viên;", { italics: true, indent: true }),
  center("QUYẾT ĐỊNH:", { bold: true }),
  p("Điều 1. Thăng cấp bậc quân hàm từ ${cap_bac_cu} lên ${cap_bac_moi} đối với học viên ${ho_ten}, mã số ${ma_so_hv}; lớp ${lop}; chuyên ngành ${chuyen_nganh}; thuộc ${dai_doi}.", { indent: true }),
  p("Điều 2. Thời điểm hưởng kể từ ngày ${ngay_quyet_dinh}. Căn cứ xét: ${can_cu_xet}.", { indent: true }),
  p("Điều 3. Các cơ quan, đơn vị và cá nhân có liên quan chịu trách nhiệm thi hành Quyết định này./", { indent: true }),
  new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [
    new TableCell({ children: [p("Nơi nhận:", { bold: true }), p("- Như Điều 3;"), p("- Lưu: VT, Hồ sơ.")] }),
    new TableCell({ children: [center("HIỆU TRƯỞNG", { bold: true }), p(""), center("${nguoi_ky}", { bold: true })] }),
  ] })] }),
]);

await save("quyet-dinh-bo-nhiem-can-bo-lop.docx", [
  top(), p("", { spacing: { after: 10 } }), center("QUYẾT ĐỊNH", { bold: true, size: 30 }),
  center("Về việc bổ nhiệm học viên kiêm nhiệm giữ chức cán bộ lớp", { bold: true, size: 27 }), p(),
  center("HIỆU TRƯỞNG TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true }), p(),
  p("Căn cứ Quy chế quản lý học viên quân sự trong nhà trường Quân đội ban hành kèm theo Thông tư số 15/2018/TT-BQP ngày 03/02/2018 của Bộ Quốc phòng;", { italics: true, indent: true }),
  p("Căn cứ nhu cầu biên chế và nhiệm vụ của các đơn vị quản lý học viên;", { italics: true, indent: true }),
  p("Căn cứ chức năng, nhiệm vụ và quyền hạn của Hiệu trưởng Trường Cao đẳng Hậu cần 2;", { italics: true, indent: true }),
  p("Xét đề nghị của ${nguoi_de_nghi}.", { italics: true, indent: true }),
  center("QUYẾT ĐỊNH:", { bold: true }),
  p("Điều 1. Bổ nhiệm ${so_luong} học viên kiêm nhiệm giữ chức cán bộ lớp ${lop}, thuộc ${dai_doi}, gồm:", { indent: true }),
  center("- ${danh_sach_chuc_vu}", { indent: false }),
  center("(Có danh sách kèm theo)", { bold: true, italics: true }),
  p("Điều 2. Quyết định này có hiệu lực thi hành kể từ ngày ${ngay_quyet_dinh}.", { indent: true }),
  p("Điều 3. Chỉ huy cơ quan, đơn vị có liên quan và các học viên có tên tại Điều 1 chịu trách nhiệm thi hành Quyết định này./", { indent: true }),
  new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [
    new TableCell({ children: [p("Nơi nhận:", { bold: true, italics: true }), p("- Cá nhân;"), p("- P. Hậu cần, B. Tài chính;"), p("- Lưu: VT, QL. H005.")] }),
    new TableCell({ children: [center("HIỆU TRƯỞNG", { bold: true }), p(""), p(""), center("${nguoi_ky}", { bold: true })] }),
  ] })] }),
]);
