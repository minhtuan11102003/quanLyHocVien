"use client";

import AddStudentComponent from "@/components/AddStudent";
import EditStudentComponent from "@/components/EditStudent";
import EditManyStudent from "@/components/EditManyStudent";
import { ModalShell } from "@/components/ui/modal-shell";

import type { Student } from "@/app/types/student";

type StudentModalsProps = {
  isOpen: boolean;
  editStudent: Student | null;
  isEditManyOpen: boolean;

  selectedIds: string[];
  students: Student[];
  onCloseAdd: () => void;
  onCloseEdit: () => void;
  onCloseEditMany: () => void;

  onAddSuccess: () => Promise<void>;
  onUpdate: () => Promise<void>;
};

export default function StudentModals({
  isOpen,
  editStudent,
  isEditManyOpen,
  selectedIds,
  students,
  onCloseAdd,
  onCloseEdit,
  onCloseEditMany,

  onAddSuccess,
  onUpdate,
}: StudentModalsProps) {
  return (
    <>
      {/* =========================
          ADD
      ========================= */}

      {isOpen && (
        <ModalShell title="Thêm học viên" description="Nhập hồ sơ và thiết lập các liên kết quản lý." onClose={onCloseAdd}>
            <AddStudentComponent
              onClose={async () => {
                onCloseAdd();
                await onAddSuccess();
              }}
            />
        </ModalShell>
      )}

      {/* =========================
          EDIT ONE
      ========================= */}

      {editStudent && (
        <ModalShell title="Chỉnh sửa học viên" description={`Cập nhật hồ sơ của ${editStudent.name}.`} onClose={onCloseEdit}>
            <EditStudentComponent
              student={editStudent}
              onClose={onCloseEdit}
              onUpdate={onUpdate}
            />
        </ModalShell>
      )}

      {/* =========================
          EDIT MANY
      ========================= */}

      {isEditManyOpen && (
        <ModalShell title="Cập nhật hàng loạt" description={`Áp dụng thay đổi cho ${selectedIds.length} học viên đã chọn.`} onClose={onCloseEditMany}>
            <EditManyStudent
              selectedIds={selectedIds}
              students={students}
              onClose={onCloseEditMany}
              onUpdate={onUpdate}
            />
        </ModalShell>
      )}
    </>
  );
}
