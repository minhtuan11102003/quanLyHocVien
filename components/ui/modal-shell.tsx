"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

type ModalShellProps = {
  children: ReactNode;
  title: string;
  description?: string;
  onClose: () => void;
  className?: string;
  showHeader?: boolean;
};

/** A consistent, keyboard-friendly visual container for administrative forms. */
export function ModalShell({
  children,
  title,
  description,
  onClose,
  className = "max-w-5xl",
  showHeader = true,
}: ModalShellProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:p-6"
      onMouseDown={onClose}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`flex max-h-[calc(100vh-1.5rem)] w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/25 sm:max-h-[calc(100vh-3rem)] ${className}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {showHeader && <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-7">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">
              Điều hành dữ liệu
            </p>
            <h2 id="modal-title" className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <X size={19} />
          </button>
        </header>}
        <div className={`min-h-0 flex-1 overflow-y-auto ${showHeader ? "p-5 sm:p-7" : ""}`}>{children}</div>
      </section>
    </div>
  );
}
