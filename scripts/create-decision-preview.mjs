import { mkdir, writeFile } from "node:fs/promises";
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

const out = new URL("../public/previews/", import.meta.url);
const run = (text, options = {}) =>
  new TextRun({ text, font: "Times New Roman", size: 26, ...options });
const p = (text = "", options = {}) =>
  new Paragraph({
    spacing: { after: 100 },
    indent: options.indent ? { firstLine: 720 } : undefined,
    children: [run(text, options)],
  });
const c = (text, options = {}) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 70 },
    children: [run(text, options)],
  });
const r = (text, options = {}) =>
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 90 },
    children: [run(text, options)],
  });
const cell = (text, bold = false) =>
  new TableCell({
    children: [new Paragraph({ children: [run(text, { bold })] })],
  });
const infoTable = (rows) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({ children: [cell(label, true), cell(value)] }),
    ),
  });

const officialHeader = (number) => [
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              c("BỘ QUỐC PHÒNG", { bold: true }),
              c("TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true }),
              c(`Số: ${number}`, { italics: true }),
            ],
          }),
          new TableCell({
            children: [
              c("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", { bold: true }),
              c("Độc lập - Tự do - Hạnh phúc", { bold: true }),
              c("────────", { bold: true }),
              c("Hồ Chí Minh, ngày ... tháng ... năm 20..."),
            ],
          }),
        ],
      }),
    ],
  }),
];

const decisionEnd = () => [
  p(
    "Điều 3. Các cơ quan, đơn vị và cá nhân có tên tại Điều 1 chịu trách nhiệm thi hành Quyết định này.",
  ),
  p("Quyết định này có hiệu lực kể từ ngày ký."),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              p("Nơi nhận:", { bold: true }),
              p("- Như Điều 3;"),
              p("- Lưu: VT, Hồ sơ."),
            ],
          }),
          new TableCell({
            children: [
              c("HIỆU TRƯỞNG", { bold: true }),
              c("(Ký, ghi rõ họ tên, đóng dấu)", { italics: true }),
              p(""),
              c("[HỌ VÀ TÊN NGƯỜI KÝ]", { bold: true }),
            ],
          }),
        ],
      }),
    ],
  }),
];

const extract = () => [
  p(""),
  c("TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true }),
  c("TRÍCH SAO", { bold: true, size: 30 }),
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [c("Số: .../TS-CĐHC2", { italics: true })],
          }),
          new TableCell({
            children: [c("Hồ Chí Minh, ngày ... tháng ... năm 20...")],
          }),
        ],
      }),
    ],
  }),
  r("HIỆU TRƯỞNG", { bold: true }),
  r("(Ký, ghi rõ họ tên, đóng dấu)", { italics: true }),
  p(""),
  r("[HỌ VÀ TÊN NGƯỜI KÝ]", { bold: true }),
  p("Nơi nhận: Cá nhân; đơn vị quản lý; lưu hồ sơ.", { italics: true }),
];

const create = async (filename, children) =>
  writeFile(
    new URL(filename, out),
    await Packer.toBuffer(
      new Document({ sections: [{ properties: {}, children }] }),
    ),
  );

await mkdir(out, { recursive: true });

await create("mau-quyet-dinh-thang-cap-bac-quan-ham.docx", [
  ...officialHeader(".../QĐ-CĐHC2"),
  c("DỰ THẢO THAM KHẢO", { bold: true, color: "C00000" }),
  c("QUYẾT ĐỊNH", { bold: true, size: 30 }),
  c("Về việc thăng cấp bậc quân hàm đối với học viên", {
    bold: true,
    size: 28,
  }),
  c("HIỆU TRƯỞNG TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true }),
  p("Căn cứ Luật Nghĩa vụ quân sự năm 2015;", { indent: true }),
  p(
    "Căn cứ Thông tư số 07/2016/TT-BQP ngày 26 tháng 01 năm 2016 của Bộ trưởng Bộ Quốc phòng quy định phong, thăng, giáng cấp bậc quân hàm; bổ nhiệm chức vụ, giáng chức, cách chức; chức vụ tương đương và cấp bậc quân hàm cao nhất đối với chức vụ của hạ sĩ quan, binh sĩ Quân đội nhân dân Việt Nam;",
    { indent: true },
  ),
  p(
    "Căn cứ chức năng, nhiệm vụ, quyền hạn và quy chế tổ chức, hoạt động của Trường Cao đẳng Hậu cần 2;",
    { indent: true },
  ),
  p("Theo đề nghị của cơ quan tham mưu và đơn vị quản lý học viên;", {
    indent: true,
  }),
  c("QUYẾT ĐỊNH:", { bold: true }),
  p("Điều 1. Thăng cấp bậc quân hàm cho học viên có tên sau đây:", {
    indent: true,
  }),
  infoTable([
    ["Họ và tên", "NGUYỄN MINH ANH"],
    ["Mã số học viên", "HV2026-001"],
    ["Đơn vị quản lý", "Đại đội 1 - Tiểu đoàn 1"],
    ["Cấp bậc hiện tại", "Binh nhất"],
    ["Cấp bậc được thăng", "Hạ sĩ"],
    ["Thời điểm hưởng", "Kể từ ngày ... tháng ... năm 20..."],
    [
      "Căn cứ xét",
      "Đủ điều kiện, tiêu chuẩn và thời hạn theo Điều 7, Điều 8 Thông tư 07/2016/TT-BQP.",
    ],
  ]),
  p(
    "Điều 2. Việc công bố quyết định và bổ sung vào hồ sơ học viên thực hiện theo Điều 13 Thông tư số 07/2016/TT-BQP.",
    { indent: true },
  ),
  ...decisionEnd(),
  ...extract(),
]);

await create("mau-quyet-dinh-giao-nhiem-vu-quan-ly-hoc-vien.docx", [
  ...officialHeader(".../QĐ-CĐHC2"),
  c("DỰ THẢO THAM KHẢO", { bold: true, color: "C00000" }),
  c("QUYẾT ĐỊNH", { bold: true, size: 30 }),
  c("Về việc giao nhiệm vụ quản lý học viên", { bold: true, size: 28 }),
  c("HIỆU TRƯỞNG TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true }),
  p(
    "Căn cứ chức năng, nhiệm vụ, quyền hạn và quy chế tổ chức, hoạt động của Trường Cao đẳng Hậu cần 2;",
    { indent: true },
  ),
  p(
    "Căn cứ Quy chế công tác quản lý học viên và quy định nội bộ hiện hành của Nhà trường;",
    { indent: true },
  ),
  p("Theo đề nghị của cơ quan tham mưu và đơn vị quản lý học viên;", {
    indent: true,
  }),
  c("QUYẾT ĐỊNH:", { bold: true }),
  p("Điều 1. Giao nhiệm vụ quản lý học viên cho đồng chí có tên sau đây:", {
    indent: true,
  }),
  infoTable([
    ["Họ và tên", "NGUYỄN MINH ANH"],
    ["Mã số học viên", "HV2026-001"],
    ["Lớp", "Kỹ thuật hậu cần K26A"],
    ["Đơn vị quản lý", "Đại đội 1 - Tiểu đoàn 1"],
    ["Nhiệm vụ được giao", "Lớp trưởng"],
    [
      "Thời hạn",
      "Từ ngày ... tháng ... năm 20... đến khi có quyết định thay thế.",
    ],
    [
      "Trách nhiệm",
      "Thực hiện nhiệm vụ theo Quy chế công tác quản lý học viên và phân công của chỉ huy đơn vị.",
    ],
  ]),
  p(
    "Điều 2. Đồng chí có tên tại Điều 1 chịu sự chỉ đạo của chỉ huy đơn vị; thực hiện đầy đủ trách nhiệm của Lớp trưởng và báo cáo kịp thời các nội dung thuộc phạm vi quản lý.",
    { indent: true },
  ),
  ...decisionEnd(),
  ...extract(),
]);

// Mẫu chức vụ nội bộ theo thể thức Quyết định cán bộ lớp do Nhà trường cung cấp.
const internalPositionHeader = [
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              c("TỔNG CỤC HẬU CẦN", { bold: true }),
              c("TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true }),
              c("Số: .../QĐ-CĐHC2", { italics: true }),
            ],
          }),
          new TableCell({
            children: [
              c("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", { bold: true }),
              c("Độc lập - Tự do - Hạnh phúc", { bold: true }),
              c("────────", { bold: true }),
              c("Thành phố Hồ Chí Minh, ngày ... tháng ... năm ...", {
                italics: true,
              }),
            ],
          }),
        ],
      }),
    ],
  }),
  p(),
  c("QUYẾT ĐỊNH", { bold: true, size: 30 }),
  c("Về việc bổ nhiệm học viên kiêm nhiệm giữ chức cán bộ lớp", {
    bold: true,
    size: 27,
  }),
  p(),
  c("HIỆU TRƯỞNG TRƯỜNG CAO ĐẲNG HẬU CẦN 2", { bold: true }),
  p(),
];
const internalPositionSignature = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({
      children: [
        new TableCell({
          children: [
            p("Nơi nhận:", { bold: true }),
            p("- Cá nhân;"),
            p("- P. Hậu cần, B. Tài chính;"),
            p("- Lưu: VT, QL. H05."),
          ],
        }),
        new TableCell({
          children: [
            c("HIỆU TRƯỞNG", { bold: true }),
            p(),
            p(),
            c("Đại tá Nguyễn Ngọc Huy", { bold: true }),
          ],
        }),
      ],
    }),
  ],
});
await create("mau-quyet-dinh-bo-nhiem-can-bo-lop.docx", [
  ...internalPositionHeader,
  p(
    "Căn cứ Quy chế quản lý học viên quân sự trong nhà trường Quân đội ban hành kèm theo Thông tư số 15/2018/TT-BQP ngày 03/02/2018 của Bộ Quốc phòng;",
    { italics: true },
  ),
  p("Căn cứ nhu cầu biên chế và nhiệm vụ của các đơn vị quản lý học viên;", {
    italics: true,
  }),
  p(
    "Căn cứ chức năng, nhiệm vụ và quyền hạn của Hiệu trưởng Trường Cao đẳng Hậu cần 2;",
    { italics: true },
  ),
  p(
    "Xét đề nghị của đồng chí Trưởng phòng Tham mưu – Hành chính và Đại đội trưởng Đại đội 1.",
    { italics: true },
  ),
  p(),
  c("QUYẾT ĐỊNH:", { bold: true }),
  p(),
  p(
    "Điều 1. Bổ nhiệm 01 học viên kiêm nhiệm giữ chức cán bộ lớp YT38A1, thuộc đơn vị Đại đội 1, gồm:",
    { bold: true },
  ),
  c("- Lớp phó             : 01 đồng chí."),
  c("(Có danh sách kèm theo)", { bold: true, italics: true }),
  p("Điều 2. Quyết định này có hiệu lực thi hành kể từ ngày .../.../20... .", {
    bold: true,
  }),
  p(
    "Điều 3. Chỉ huy cơ quan, đơn vị có liên quan và các học viên có tên tại Điều 1 chịu trách nhiệm thi hành Quyết định này./",
    { bold: true },
  ),
  internalPositionSignature,
]);
