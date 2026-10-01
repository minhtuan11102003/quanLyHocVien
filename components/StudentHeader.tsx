"use client";
import { Button } from "@/components/ui/button";
type Props = { totalStudents: number; selectedCount: number; onAdd: () => void; onEditMany: () => void };
export default function StudentHeader({ totalStudents, selectedCount, onAdd, onEditMany }: Props) {
  return <header className="flex flex-wrap items-end justify-between gap-4 p-4 pb-0 sm:p-6 sm:pb-0"><div><p className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-blue-600">Danh sách hiện tại</p><h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý học viên</h1><p className="mt-1 text-sm text-slate-500">Đang quản lý <span className="font-bold text-blue-700">{totalStudents}</span> học viên</p></div><div className="flex flex-wrap items-center justify-end gap-2"><Button className="rounded-xl bg-blue-600 px-4 py-2.5 text-white shadow-sm hover:bg-blue-700" onClick={onAdd}>+ Thêm học viên</Button><Button disabled={selectedCount === 0} onClick={onEditMany} className="rounded-xl px-4 py-2.5 disabled:cursor-not-allowed">Sửa {selectedCount > 0 ? `${selectedCount} học viên` : "hàng loạt"}</Button></div></header>;
}
