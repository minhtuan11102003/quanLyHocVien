"use client";
import { Button } from "@/components/ui/button";
type StudentHeaderProps = {
  totalStudents: number;
  selectedCount: number;
  onAdd: () => void;
  onEditMany: () => void;
};
export default function StudentHeader({
  totalStudents,
  selectedCount,
  onAdd,
  onEditMany,
}: StudentHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 pt-3">
      <div>
        <h1 className="text-2xl font-bold">Quản lý học viên</h1>
        <p className="mt-1 text-[18px] text-gray-500">
          Tổng:
          <span className="ml-1 font-bold text-blue-600">{totalStudents}</span>
          <span className="ml-1">học viên</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          className="bg-blue-500 px-4 py-6 text-white hover:bg-blue-600"
          onClick={onAdd}
        >
          Thêm học viên
        </Button>
        <Button
          disabled={selectedCount === 0}
          onClick={onEditMany}
          className="px-4 py-6"
        >
          Sửa {selectedCount} học viên
        </Button>
      </div>
    </div>
  );
}
