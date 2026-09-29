"use client";
import { useEffect, useState } from "react";
import ClassBatchActions from "@/components/ClassBatchActions";
import type { ClassItem, Student } from "@/app/types/student";
export default function StudentBatchActionsPage() {
  const [students, setStudents] = useState<Student[]>([]); const [classes, setClasses] = useState<ClassItem[]>([]); const [mode, setMode] = useState<"rank" | "graduation" | null>(null);
  const load = async () => { const [s,c] = await Promise.all([fetch("http://localhost:3001/students"), fetch("http://localhost:3001/classes")]); setStudents(await s.json()); setClasses(await c.json()); };
  useEffect(() => { load().catch(console.error); }, []);
  return <div className="p-5"><div className="mb-6"><h1 className="text-2xl font-bold">Thao tác theo lớp</h1><p className="mt-1 text-gray-500">Tách riêng khỏi bảng quản lý học viên để dễ xử lý số lượng lớn.</p></div><div className="grid max-w-4xl gap-5 md:grid-cols-2"><button onClick={() => setMode("rank")} className="rounded-xl border bg-white p-6 text-left shadow-sm transition hover:border-indigo-500 hover:shadow-md"><h2 className="text-lg font-bold text-indigo-700">Nâng quân hàm theo lớp</h2><p className="mt-2 text-sm text-gray-600">Chọn một lớp hoặc tất cả lớp, sau đó chọn cấp bậc riêng cho từng học viên. Hồ sơ sẽ chuyển sang chờ phê duyệt.</p></button><button onClick={() => setMode("graduation")} className="rounded-xl border bg-white p-6 text-left shadow-sm transition hover:border-emerald-500 hover:shadow-md"><h2 className="text-lg font-bold text-emerald-700">Tốt nghiệp và điều chỉnh công tác</h2><p className="mt-2 text-sm text-gray-600">Chọn tất cả học viên hoặc từng cá nhân; mỗi người có thể về đơn vị cũ hoặc điều chuyển sang nơi mới.</p></button></div>{mode && <ClassBatchActions mode={mode} students={students} classes={classes} onClose={() => setMode(null)} onSaved={load} />}</div>;
}
