import JSZip from "jszip";
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
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
};
const c = (text: string, bold = false) =>
  new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
  });

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { requests?: Item[] };
    const items = body.requests ?? [];
    if (
      !items.length ||
      items.some((item) => !item.studentName || !item.proposedRank)
    )
      return Response.json(
        { message: "Danh sách hồ sơ không hợp lệ" },
        { status: 400 },
      );
    const zip = JSZip();
    for (const item of items) {
      const date = new Date(item.reviewedAt ?? new Date()).toLocaleDateString(
        "vi-VN",
      );
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "QUYẾT ĐỊNH", bold: true, size: 30 }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Về việc thăng cấp bậc quân hàm",
                    bold: true,
                    size: 25,
                  }),
                ],
              }),
              new Paragraph({ text: "", spacing: { after: 180 } }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Căn cứ hồ sơ xét thăng cấp bậc quân hàm và kết quả phê duyệt của đơn vị;",
                    italics: true,
                  }),
                ],
              }),
              new Paragraph({ text: "Quyết định:" }),
              new Table({
                rows: [
                  ["Họ và tên", item.studentName],
                  ["Mã số học viên", item.maSoHV],
                  ["Đối tượng", item.category],
                  ["Cấp bậc hiện tại", item.currentRank],
                  ["Cấp bậc được thăng", item.proposedRank],
                  ["Ngày quyết định", date],
                  ["Lý do/căn cứ hồ sơ", item.reason],
                ].map(
                  ([a, b]) => new TableRow({ children: [c(a, true), c(b)] }),
                ),
              }),
              new Paragraph({ text: "", spacing: { after: 360 } }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "NGƯỜI CÓ THẨM QUYỀN", bold: true }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "(Ký, ghi rõ họ tên)" })],
              }),
            ],
          },
        ],
      });
      const buffer = await Packer.toBuffer(doc);
      zip.file(
        `quyet-dinh-${item.maSoHV}-${item.studentName.replace(/[^\p{L}\p{N}]+/gu, "-")}.docx`,
        buffer,
      );
    }
    const output = await zip.generateAsync({ type: "uint8array" });
    return new Response(output as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="quyet-dinh-thang-cap-tap-the.zip"',
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Không thể xuất quyết định" },
      { status: 500 },
    );
  }
}
