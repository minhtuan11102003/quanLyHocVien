import { DataPagination, usePagination } from "@/components/DataPagination";

type Transfer = {
  id: string;
  studentName: string;
  maSoHV: string;
  type: "return" | "transfer";
  fromQuanKhuId: string;
  toQuanKhuId: string;
  fromDonViCap2Id: string;
  toDonViCap2Id: string;
};

export function GraduationDecisionHistory({
  history,
  regionName,
  unitName,
}: {
  history: Transfer[];
  regionName: (id?: string) => string;
  unitName: (id?: string) => string;
}) {
  const pagination = usePagination(history);
  return (
    <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="border-b p-4">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700">Lịch sử quyết định</p>
        <h2 className="mt-1 font-bold text-slate-900">Kết quả tốt nghiệp và điều chuyển</h2>
      </div>
      <div className="overflow-auto">
        <table className="min-w-[850px] w-full">
          <thead className="bg-slate-50"><tr><th className="p-3 text-left">Học viên</th><th className="p-3 text-left">Hình thức</th><th className="p-3 text-left">Đơn vị cũ</th><th className="p-3 text-left">Đơn vị sau tốt nghiệp</th></tr></thead>
          <tbody>
            {pagination.currentItems.map((item) => <tr key={item.id} className="border-t"><td className="p-3">{item.studentName}<div className="text-xs text-slate-500">{item.maSoHV}</div></td><td className="p-3">{item.type === "return" ? "Về đơn vị cũ" : "Điều chuyển"}</td><td className="p-3">{regionName(item.fromQuanKhuId)} / {unitName(item.fromDonViCap2Id)}</td><td className="p-3">{regionName(item.toQuanKhuId)} / {unitName(item.toDonViCap2Id)}</td></tr>)}
            {!history.length && <tr><td colSpan={4} className="p-7 text-center text-slate-500">Chưa có quyết định</td></tr>}
          </tbody>
        </table>
      </div>
      <DataPagination {...pagination} totalItems={history.length} label="quyết định / trang" />
    </section>
  );
}
