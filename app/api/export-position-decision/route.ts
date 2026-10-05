import { readFile } from "node:fs/promises";
import path from "node:path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

export const runtime = "nodejs";

type Student = { id: string; name: string; maSoHV: string; classId?: string; daiDoiId?: string };
type PositionRequest = { id: string; positionName: string; totalStudents: number; className?: string | null; daiDoiName?: string; reason?: string; students?: Student[] };

export async function POST(request: Request) {
  try {
    const { request: item, documentNumber, signedDate, signerName } = (await request.json()) as { request?: PositionRequest; documentNumber?: string; signedDate?: string; signerName?: string };
    if (!item?.id || !item.positionName || !item.totalStudents)
      return Response.json({ message: "Hồ sơ bổ nhiệm không hợp lệ" }, { status: 400 });
    if (!String(documentNumber || "").trim() || !String(signedDate || "").trim() || !String(signerName || "").trim())
      return Response.json({ message: "Thiếu số văn bản, ngày ký hoặc người ký" }, { status: 400 });

    const source = await readFile(path.join(process.cwd(), "public", "word-templates", "quyet-dinh-bo-nhiem-can-bo-lop.docx"));
    const doc = new Docxtemplater(new PizZip(source), { delimiters: { start: "${", end: "}" }, paragraphLoop: true, linebreaks: true });
    doc.render({
      so_van_ban: String(documentNumber).trim(),
      ngay_van_ban: String(signedDate).trim(),
      ngay_quyet_dinh: String(signedDate).trim(),
      so_luong: item.totalStudents,
      lop: item.className || "[TÊN LỚP]",
      dai_doi: item.daiDoiName || "[ĐẠI ĐỘI QUẢN LÝ]",
      danh_sach_chuc_vu: `${item.positionName}: ${item.totalStudents} đồng chí`,
      nguoi_de_nghi: "đồng chí Trưởng phòng Tham mưu – Hành chính và Đại đội trưởng đơn vị quản lý học viên",
      nguoi_ky: String(signerName).trim(),
    });
    const output = doc.getZip().generate({ type: "nodebuffer" });
    return new Response(output as unknown as BodyInit, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": 'attachment; filename="quyet-dinh-bo-nhiem-can-bo-lop.docx"' } });
  } catch (error) {
    console.error(error);
    return Response.json({ message: "Không thể xuất quyết định bổ nhiệm" }, { status: 500 });
  }
}
