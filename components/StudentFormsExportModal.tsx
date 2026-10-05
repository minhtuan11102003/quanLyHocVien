"use client";

import { useState } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import type {
  ClassItem,
  NganhDaoTao,
  QuanKhu,
  Student,
} from "@/app/types/student";

type FormKey = "phieuhv" | "sodiemdanh" | "thehv";
const options: { id: FormKey; title: string; description: string }[] = [
  {
    id: "phieuhv",
    title: "Phiếu học viên",
    description: "Một phiếu hồ sơ chi tiết cho mỗi học viên.",
  },
  {
    id: "sodiemdanh",
    title: "Sổ điểm danh",
    description: "Một danh sách điểm danh tổng hợp các học viên đã chọn.",
  },
  {
    id: "thehv",
    title: "Thẻ học viên",
    description: "Một thẻ học viên cho mỗi học viên đã chọn.",
  },
];

export default function StudentFormsExportModal({
  students,
  classes,
  majors,
  companies,
  regions,
  onClose,
}: {
  students: Student[];
  classes: ClassItem[];
  majors: NganhDaoTao[];
  companies: { id: string; nameDaiDoi: string }[];
  regions: QuanKhu[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<FormKey[]>(["phieuhv"]);
  const [exporting, setExporting] = useState(false);
  const toggle = (id: FormKey) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  const exportForms = async () => {
    if (!selected.length) return alert("Hãy chọn ít nhất một biểu mẫu.");
    setExporting(true);
    try {
      const payload = students.map((student) => {
        const classItem = classes.find(
          (item) => String(item.id) === String(student.classId),
        );
        const major = majors.find(
          (item) => String(item.id) === String(student.majorId),
        );
        const region = regions.find(
          (item) =>
            String(item.id) ===
            String(student.originQuanKhuId || student.quanKhuId),
        );
        return {
          ...student,
          name: student.name || String(student.hoTen || student.fullName || ""),
          maSoHV:
            student.maSoHV ||
            String(student.maHocVien || student.studentCode || ""),
          className: classItem?.name || "Chưa cập nhật lớp",
          classDisplay:
            major?.shortName || classItem?.name || "Chưa cập nhật lớp",
          majorName: major?.name || "Chưa cập nhật chuyên ngành",
          donViCu:
            region?.nameQuanKhu || String(student.donViCu || "Chưa cập nhật"),
          daiDoiName:
            companies.find(
              (item) => String(item.id) === String(student.daiDoiId),
            )?.nameDaiDoi || "Đại đội quản lý",
        };
      });
      const response = await fetch("/api/export-student-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: payload, forms: selected }),
      });
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => null))?.message ||
            "Không thể xuất biểu mẫu.",
        );
      const link = document.createElement("a");
      link.href = URL.createObjectURL(await response.blob());
      link.download = "bieu-mau-hoc-vien.zip";
      link.click();
      URL.revokeObjectURL(link.href);
      onClose();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Không thể xuất biểu mẫu.",
      );
    } finally {
      setExporting(false);
    }
  };
  return (
    <ModalShell
      title="Xuất biểu mẫu học viên"
      onClose={() => !exporting && onClose()}
      className="max-w-3xl"
    >
      <div className="space-y-5 p-1">
        <p className="text-sm text-slate-600">
          Xuất biểu mẫu cho <b>{students.length}</b> học viên đã chọn. Có thể
          chọn một hoặc nhiều biểu mẫu; hệ thống tải về một file ZIP.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {options.map((option) => {
            const active = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option.id)}
                className={`min-h-36 rounded-2xl border-2 p-5 text-left transition ${active ? "border-indigo-400 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"}`}
              >
                <span className="block text-base font-bold text-slate-900">
                  {option.title}
                </span>
                <span className="mt-2 block text-sm leading-5 text-slate-600">
                  {option.description}
                </span>
                <span
                  className={`mt-4 inline-block text-xs font-bold ${active ? "text-indigo-700" : "text-slate-400"}`}
                >
                  {active ? "✓ Đã chọn" : "Chọn biểu mẫu"}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={exportForms}
            disabled={exporting || !selected.length}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {exporting
              ? "Đang tạo file..."
              : `Xuất ${selected.length} biểu mẫu`}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
