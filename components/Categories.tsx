/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Building2,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Medal,
  Network,
  ShieldCheck,
  Upload,
  UserCircle,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";
import { getSession, type SessionUser } from "@/components/AuthGate";

type MenuItem = { href: string; label: string; icon: typeof LayoutDashboard };
const mainMenu: MenuItem[] = [
  { href: "/", label: "Quản lý học viên", icon: Users },
  { href: "/rank-approval", label: "Phê duyệt cấp bậc", icon: ClipboardCheck },
  { href: "/position-approval", label: "Phê duyệt bổ nhiệm", icon: UserCog },
  {
    href: "/graduation",
    label: "Tốt nghiệp & điều chuyển",
    icon: GraduationCap,
  },
  {
    href: "/graduation-approval",
    label: "Phê duyệt tốt nghiệp",
    icon: ClipboardCheck,
  },
  {
    href: "/graduated-students",
    label: "Học viên tốt nghiệp",
    icon: ShieldCheck,
  },
];
const managementMenu: MenuItem[] = [
  { href: "/classes", label: "Lớp học & chuyên ngành", icon: BookOpen },
  {
    href: "/student-batch-actions",
    label: "Thao tác theo lớp",
    icon: UsersRound,
  },
  { href: "/units", label: "Tiểu đoàn & Đại đội", icon: Network },
  { href: "/military-units", label: "Quân khu & đơn vị", icon: Building2 },
  { href: "/positions", label: "Chức vụ", icon: UserCog },
  { href: "/ranks", label: "Cấp bậc", icon: Medal },
  { href: "/data-import", label: "Nhập dữ liệu Excel", icon: Upload },
  { href: "/profile", label: "Tài khoản của tôi", icon: UserCircle },
];

export default function CategoriesComponent() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionUser | null>(null);
  useEffect(() => setSession(getSession()), [pathname]);
  if (pathname === "/login") return null;
  const hasPermission = (permission: string) =>
    session?.role === "admin" ||
    Boolean(session?.permissions?.includes(permission));
  const canSee = (item: MenuItem) => {
    if (item.href === "/profile" || item.href === "/") return true;
    if (
      ["/rank-approval", "/position-approval", "/graduation-approval"].includes(
        item.href,
      )
    )
      return (
        hasPermission("manage_graduation") ||
        hasPermission("create_rank_request") ||
        hasPermission("submit_school") ||
        hasPermission("approve_school")
      );
    if (item.href === "/graduation")
      return hasPermission("manage_graduation") || session?.role === "company";
    if (item.href === "/graduated-students")
      return hasPermission("view_students");
    if (item.href === "/classes") return hasPermission("manage_classes");
    if (item.href === "/student-batch-actions")
      return hasPermission("manage_students");
    if (item.href === "/data-import")
      return ["admin", "battalion", "company"].includes(session?.role || "");
    if (item.href === "/units")
      return hasPermission("manage_units") && session?.role !== "company";
    if (
      item.href === "/military-units" ||
      item.href === "/positions" ||
      item.href === "/ranks"
    )
      return ["admin", "school"].includes(session?.role || "");
    return false;
  };
  const visibleMainMenu = mainMenu.filter(canSee);
  const visibleManagementMenu = managementMenu.filter(canSee);
  const renderItem = ({ href, label, icon: Icon }: MenuItem) => {
    const active =
      href === "/"
        ? pathname === "/"
        : href === "/graduation"
          ? pathname === "/graduation"
          : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${active ? "bg-white text-[#123a55] shadow-sm" : "text-blue-50/80 hover:bg-white/10 hover:text-white"}`}
      >
        <Icon size={17} strokeWidth={1.8} />
        <span className="flex-1">{label}</span>
        {active && <ChevronRight size={15} />}
      </Link>
    );
  };
  return (
    <>
      <div className="sticky top-0 z-40 flex items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#102f46] px-3 py-2 text-white lg:hidden">
        <div className="mr-2 flex shrink-0 items-center gap-2 border-r border-white/15 pr-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <GraduationCap size={18} />
          </div>
          <span className="whitespace-nowrap text-sm font-bold">
            Quản lý học viên
          </span>
        </div>
        <div className="flex min-w-max gap-1">
          {[
            ...visibleMainMenu,
            ...visibleManagementMenu,
            ...(session?.role === "admin"
              ? [
                  {
                    href: "/permissions",
                    label: "Chức năng & tài khoản",
                    icon: KeyRound,
                  },
                ]
              : []),
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium ${(href === "/" && pathname === "/") || (href === "/graduation" ? pathname === "/graduation" : href !== "/" && pathname.startsWith(href)) ? "bg-white text-[#123a55]" : "text-blue-50/80 hover:bg-white/10"}`}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>
      </div>
      <aside className="hidden h-screen w-[278px] shrink-0 flex-col bg-[#102f46] text-white lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-950/30">
              <GraduationCap size={23} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-blue-200">
                Hệ thống
              </p>
              <h1 className="text-sm font-bold leading-tight">
                Quản lý học viên
              </h1>
            </div>
          </div>
        </div>
        <div className="mx-4 mt-5 rounded-2xl border border-white/10 bg-white/5 p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-400/20 text-sm font-bold text-blue-100">
              {session?.name?.slice(0, 1) || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {session?.name || "Chưa đăng nhập"}
              </p>
              <p className="mt-0.5 text-[11px] text-blue-200/70">
                {session?.role || ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("student_session");
              router.replace("/login");
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-blue-100 transition hover:bg-white/10"
          >
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
        <nav className="mt-6 flex-1 overflow-y-auto px-4 pb-5">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-blue-200/50">
            Điều hành
          </p>
          <div className="space-y-1">{visibleMainMenu.map(renderItem)}</div>
          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-blue-200/50">
            Danh mục hệ thống
          </p>
          <div className="space-y-1">
            {visibleManagementMenu.map(renderItem)}
            {session?.role === "admin" &&
              renderItem({
                href: "/permissions",
                label: "Chức năng & tài khoản",
                icon: KeyRound,
              })}
          </div>
        </nav>
        <div className="border-t border-white/10 px-5 py-4 text-[11px] text-blue-200/50">
          Quản lý hồ sơ · v2.0
        </div>
      </aside>
    </>
  );
}
