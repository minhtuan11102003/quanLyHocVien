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

type Student = {
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
  [key: string]: unknown;
};

type Major = { id: string; name: string };
type ClassItem = { id: string; majorId: string; name: string };

type ExportPayload = {
  students: Student[];
  majors: Major[];
  classes: ClassItem[];
};

const extraFields: [string, string][] = [["Giới tính", "gioiTinh"], ["Tôn giáo", "tonGiao"], ["Sức khỏe", "sucKhoe"], ["Trình độ văn hóa", "vanHoa"], ["Ngày nhập ngũ", "ngayNhapNgu"], ["Đơn vị cũ", "donViCu"], ["Ngày vào Đoàn", "ngayVaoDoan"], ["Ngày vào Đảng", "ngayVaoDang"], ["Ngày chính thức", "ngayChinhThuc"], ["Số thẻ BHYT", "soTheBHYT"], ["Số CMND/CCCD", "soCCCD"], ["Ngày cấp CCCD", "ngayCapCCCD"], ["Nơi cấp CCCD", "noiCapCCCD"], ["Số hiệu quân nhân", "soHieuQuanNhan"], ["Họ tên cha", "hoTenCha"], ["Nghề nghiệp cha", "ngheNghiepCha"], ["Nơi làm việc cha", "noiLamViecCha"], ["SĐT cha", "sdtCha"], ["Họ tên mẹ", "hoTenMe"], ["Nghề nghiệp mẹ", "ngheNghiepMe"], ["Nơi làm việc mẹ", "noiLamViecMe"], ["SĐT mẹ", "sdtMe"], ["Họ tên vợ/chồng", "hoTenVoChong"], ["Nghề nghiệp vợ/chồng", "ngheNghiepVoChong"], ["Nơi làm việc vợ/chồng", "noiLamViecVoChong"], ["SĐT vợ/chồng", "sdtVoChong"], ["Quê quán", "queQuan"], ["Nguyên quán", "nguyenQuan"], ["Trú quán", "truQuan"], ["Địa chỉ", "diaChi"], ["Trình độ đào tạo", "trinhDoDaoTao"], ["Ngành đào tạo", "nganhDaoTao"], ["Năm tốt nghiệp", "namTotNghiep"], ["Xếp loại", "xepLoai"], ["Ngày tăng", "ngayTang"], ["Lý do tăng", "lyDoTang"], ["Ngày giảm", "ngayGiam"], ["Lý do giảm", "lyDoGiam"], ["Người báo tin", "nguoiBaoTin"], ["Địa chỉ báo tin", "diaChiBaoTin"], ["SĐT báo tin", "sdtBaoTin"], ["Đối tượng đào tạo", "doiTuongDaoTao"], ["Năng khiếu", "nangKhieu"], ["Số điện thoại", "soDienThoai"]];

const cell = (value: string, bold = false) =>
  new TableCell({
    children: [
      new Paragraph({ children: [new TextRun({ text: value, bold })] }),
    ],
  });

export async function POST(request: Request) {
  try {
    const { students, majors, classes } =
      (await request.json()) as ExportPayload;

    if (
      !Array.isArray(students) ||
      !Array.isArray(majors) ||
      !Array.isArray(classes) ||
      students.length === 0
    ) {
      return Response.json(
        { message: "Dữ liệu xuất Word không hợp lệ" },
        { status: 400 },
      );
    }

    const sections = students.flatMap((student, index) => {
      const major =
        majors.find((item) => item.id === student.majorId)?.name ??
        "Không xác định";
      const className =
        classes.find(
          (item) =>
            String(item.id) === String(student.classId) && String(item.majorId) === String(student.majorId),
        )?.name ?? "Không xác định";

      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [
            new TextRun({
              text: `THÔNG TIN HỌC VIÊN ${index + 1}`,
              bold: true,
              size: 28,
            }),
          ],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            ["Mã số học viên", student.maSoHV], ["Họ và tên", student.name], ["Ngành đào tạo", major], ["Lớp học", className], ["Đơn vị", student.donVi], ["Chức vụ", student.chucVu], ["Dân tộc", student.danToc], ["Ngày sinh", student.birthDay], ["Cấp bậc", student.capBac],
            ...extraFields.filter(([, key]) => student[key]).map(([label, key]) => [label, String(student[key])]),
          ].map(([label, value]) => new TableRow({ children: [cell(String(label), true), cell(String(value ?? ""))] })),
        }),
        new Paragraph({ text: "", spacing: { after: 360 } }),
      ];
    });

    const buffer = await Packer.toBuffer(
      new Document({ sections: [{ children: sections }] }),
    );
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="danh-sach-hoc-vien.docx"',
      },
    });
  } catch (error) {
    console.error("Không thể xuất Word", error);
    return Response.json(
      { message: "Không thể xuất file Word" },
      { status: 500 },
    );
  }
}
