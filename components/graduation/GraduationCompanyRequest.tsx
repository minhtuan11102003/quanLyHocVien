import type { FormEvent, ReactNode } from "react";

export function GraduationCompanyRequest({
  onSubmit,
  children,
}: {
  onSubmit: (event: FormEvent) => void;
  children: ReactNode;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-3xl border bg-white p-5 shadow-sm"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">
          Đại đội yêu cầu
        </p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">
          Lập yêu cầu tốt nghiệp hoặc điều chuyển
        </h2>
      </div>
      {children}
    </form>
  );
}
