"use client";
import { Button } from "@/components/ui/button";
type Props = { totalStudents: number; selectedCount: number; onAdd: () => void; onEditMany: () => void };
export default function StudentHeader({ totalStudents, selectedCount, onAdd, onEditMany }: Props) {
  return <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-3"><div><h1 className="text-2xl font-bold">Quản lý học viên đang học</h1><p className="mt-1 text-[18px] text-gray-500">Tổng: <span className="ml-1 font-bold text-blue-600">{totalStudents}</span> học viên</p></div><div className="flex flex-wrap items-center justify-end gap-2"><Button className="bg-blue-500 px-4 py-6 text-white hover:bg-blue-600" onClick={onAdd}>Thêm học viên</Button><Button disabled={selectedCount === 0} onClick={onEditMany} className="px-4 py-6">Sửa {selectedCount} học viên</Button></div></div>;
}
