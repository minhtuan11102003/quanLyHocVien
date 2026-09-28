"use client";

import AddStudentComponent from "@/components/AddStudent";
import EditStudentComponent from "@/components/EditStudent";
import EditManyStudent from "@/components/EditManyStudent";

import type { QuanKhu, Student } from "@/app/types/student";

type StudentModalsProps = {
  isOpen: boolean;
  editStudent: Student | null;
  isEditManyOpen: boolean;

  selectedIds: string[];
  students: Student[];
  quanKhu: QuanKhu[];

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
  quanKhu,

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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={onCloseAdd}
        >
          <div
            className="relative w-[600px] rounded-xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onCloseAdd}
              className="absolute right-4 top-3 z-10 text-2xl text-gray-500 hover:text-red-500"
            >
              ×
            </button>

            <AddStudentComponent
              onClose={async () => {
                onCloseAdd();
                await onAddSuccess();
              }}
            />
          </div>
        </div>
      )}

      {/* =========================
          EDIT ONE
      ========================= */}

      {editStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={onCloseEdit}
        >
          <div
            className="relative w-[600px] rounded-xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onCloseEdit}
              className="absolute right-4 top-3 z-10 text-2xl text-gray-500 hover:text-red-500"
            >
              ×
            </button>

            <EditStudentComponent
              student={editStudent}
              onClose={onCloseEdit}
              onUpdate={onUpdate}
            />
          </div>
        </div>
      )}

      {/* =========================
          EDIT MANY
      ========================= */}

      {isEditManyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={onCloseEditMany}
        >
          <div
            className="relative w-[600px] rounded-xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onCloseEditMany}
              className="absolute right-4 top-3 z-10 text-2xl text-gray-500 hover:text-red-500"
            >
              ×
            </button>

            <EditManyStudent
              selectedIds={selectedIds}
              students={students}
              onClose={onCloseEditMany}
              onUpdate={onUpdate}
            />
          </div>
        </div>
      )}
    </>
  );
}
