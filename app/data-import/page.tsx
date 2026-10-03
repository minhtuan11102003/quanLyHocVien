"use client";

import * as XLSX from "xlsx";
import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { DragEvent, useRef, useState } from "react";
import { getSession } from "@/components/AuthGate";

const API = "http://localhost:3001";
type Preview = { total: number; valid: number; sampleRows?: number; errors: { row: number; maSoHV: string; message: string }[] };

export default function DataImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const admin = getSession()?.role === "admin";

  const download = async () => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`${API}/imports/students/template`);
      if (!response.ok) throw new Error();
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url; link.download = "mau-nhap-hoc-vien.xlsx"; link.click();
      URL.revokeObjectURL(url);
    } catch { setMessage("Không thể tạo file mẫu có lựa chọn sẵn."); }
    finally { setBusy(false); }
  };
  const select = async (file?: File) => {
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) return setMessage("Chỉ hỗ trợ file Excel (.xlsx, .xls) hoặc CSV.");
    // Reset input ngay khi nhận file để người dùng có thể chọn lại chính file này sau khi sửa lỗi trùng.
    if (inputRef.current) inputRef.current.value = "";
    setBusy(true); setMessage(""); setPreview(null); setRows([]); setFileName("");
    try {
      const book = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
      const sheet = book.Sheets[book.SheetNames.includes("HOC_VIEN") ? "HOC_VIEN" : book.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
      const header = grid.findIndex((line) => String(line[0] || "").startsWith("maSoHV"));
      if (header < 0) throw new Error("Không tìm thấy hàng tiêu đề maSoHV. Hãy dùng file mẫu của hệ thống.");
      const keys = grid[header].map((value) => String(value || "").split("\n")[0].trim());
      const data = grid.slice(header + 1).map((line) => Object.fromEntries(keys.map((key, index) => [key, String(line[index] || "").trim()]))).filter((row) => Object.values(row).some(Boolean));
      const response = await fetch(`${API}/imports/students/preview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows: data }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể kiểm tra tệp");
      setRows(data); setFileName(file.name); setPreview(result);
    } catch (error) { setRows([]); setFileName(""); setPreview(null); setMessage(error instanceof Error ? error.message : "Không thể đọc tệp"); }
    finally { setBusy(false); }
  };
  const commit = async () => {
    if (!preview || preview.errors.length || !window.confirm(`Nhập ${preview.valid} học viên vào dữ liệu thật?`)) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`${API}/imports/students/commit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không thể nhập dữ liệu");
      setRows([]); setPreview(null); setFileName(""); setMessage(`Đã nhập thành công ${result.imported} học viên.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể nhập dữ liệu"); }
    finally { setBusy(false); }
  };
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    const file = event.dataTransfer.files.item(0);
    if (!file) return setMessage("Không tìm thấy file được kéo vào. Vui lòng thả trực tiếp file Excel/CSV.");
    void select(file);
  };
  if (!admin) return <div className="page-shell"><div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">Chỉ Admin được nhập dữ liệu.</div></div>;

  return <div className="page-shell space-y-5">
    <header className="rounded-3xl bg-gradient-to-br from-sky-700 via-blue-700 to-indigo-800 p-6 text-white shadow-lg"><p className="text-xs font-bold uppercase tracking-[.18em] text-sky-100">Quản trị dữ liệu</p><h1 className="mt-2 text-2xl font-bold">Import dữ liệu học viên</h1><p className="mt-2 max-w-2xl text-sm text-sky-100">Tải mẫu, kéo file Excel vào khu vực bên dưới để kiểm tra, rồi xác nhận nhập khi dữ liệu không còn lỗi.</p></header>
    <section className="grid gap-4 md:grid-cols-3"><Step number="1" title="Tải file mẫu" text="Dùng mẫu có sẵn lựa chọn danh mục và dòng ví dụ." action={<button disabled={busy} onClick={() => void download()} className="mt-3 text-sm font-bold text-sky-700 hover:underline">Tải file mẫu Excel →</button>} /><Step number="2" title="Kéo file vào" text="Hệ thống đọc Excel/CSV, kiểm tra mã và liên kết dữ liệu." /><Step number="3" title="Xác nhận nhập" text="Chỉ ghi dữ liệu khi toàn bộ các dòng hợp lệ." /></section>
    <section className="rounded-3xl border bg-white p-5 shadow-sm"><div onDragEnter={(event) => { event.preventDefault(); event.stopPropagation(); setDragging(true); }} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "copy"; setDragging(true); }} onDragLeave={(event) => { event.preventDefault(); event.stopPropagation(); setDragging(false); }} onDrop={drop} className={`flex min-h-72 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${dragging ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-sky-50/50"}`}><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700"><UploadCloud size={34} /></div><h2 className="mt-4 text-lg font-bold text-slate-900">Kéo và thả file dữ liệu vào đây</h2><p className="mt-2 max-w-md text-sm text-slate-500">Thả file là hệ thống tự đọc và kiểm tra ngay; không cần bấm chọn file lại. Hỗ trợ Excel (.xlsx, .xls) và CSV.</p><button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="mt-5 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50">Chọn file để import</button><input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => void select(event.target.files?.[0])} />{fileName && <div className="mt-5 flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"><FileSpreadsheet size={19} className="text-emerald-600" />{fileName}</div>}</div><div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><b>Dòng ví dụ trong file mẫu tự được bỏ qua.</b> Bạn không cần xoá mã <code>HV2026-001</code>; hệ thống không bao giờ nhập dòng đó vào dữ liệu thật.</div></section>
    {busy && <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600">Đang đọc và kiểm tra dữ liệu...</div>}{message && <div className={`rounded-2xl border p-4 text-sm ${message.startsWith("Đã nhập") ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message}</div>}
    {preview && <section className="overflow-hidden rounded-3xl border bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4 border-b p-5"><div><h2 className="font-bold text-slate-900">Kết quả kiểm tra file</h2><p className="mt-1 text-sm text-slate-600">Tổng <b>{preview.total}</b> · Hợp lệ <b className="text-emerald-700">{preview.valid}</b> · Lỗi <b className="text-red-700">{preview.errors.length}</b>{preview.sampleRows ? <span className="ml-2 text-amber-700">· Đã bỏ qua {preview.sampleRows} dòng ví dụ</span> : null}</p></div><button disabled={busy || !!preview.errors.length} onClick={() => void commit()} className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Xác nhận nhập dữ liệu</button></div>{preview.errors.length ? <div className="divide-y">{preview.errors.map((error) => <p key={`${error.row}-${error.message}`} className="p-3 text-sm text-red-700">Dòng {error.row} · {error.maSoHV || "—"}: {error.message}</p>)}</div> : <p className="p-5 text-sm text-emerald-700">Tất cả dữ liệu hợp lệ. Bạn có thể xác nhận để ghi vào hệ thống.</p>}</section>}
  </div>;
}
function Step({ number, title, text, action }: { number: string; title: string; text: string; action?: React.ReactNode }) { return <article className="rounded-2xl border bg-white p-4 shadow-sm"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">{number}</span><h2 className="mt-3 font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{text}</p>{action}</article>; }
