"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CategoriesComponent() {
  const pathname = usePathname();

  return (
    <div className="flex w-[350px] flex-col bg-[#123a55] text-white categoriesLeft">
      {/* TITLE */}
      <div className="flex h-[100px] items-center justify-center text-[18px] font-bold">
        Quản lý hệ thống học viên
      </div>

      {/* MENU */}
      <ul className="mx-2 flex flex-col gap-3 text-[16px] font-semibold">
        {/* QUẢN LÝ HỌC VIÊN */}
        <Link href="/">
          <li
            className={`cursor-pointer rounded-md px-2 py-2 ${
              pathname === "/"
                ? "bg-[#3580d6] text-white"
                : "hover:bg-white hover:text-black"
            }`}
          >
            Quản lý học viên
          </li>
        </Link>

        {/* QUẢN LÝ LỚP HỌC */}
        <Link href="/classes">
          <li
            className={`cursor-pointer rounded-md px-2 py-2 ${
              pathname === "/classes"
                ? "bg-[#3580d6] text-white"
                : "hover:bg-white hover:text-black"
            }`}
          >
            Quản lý lớp học
          </li>
        </Link>
        <Link href="/rank-approval">
          <li className={`cursor-pointer rounded-md px-2 py-2 ${pathname === "/rank-approval" ? "bg-[#3580d6] text-white" : "hover:bg-white hover:text-black"}`}>
            Phê duyệt cấp bậc
          </li>
        </Link>
        <Link href="/ranks">
          <li className="cursor-pointer rounded-md px-2 py-2 hover:bg-white hover:text-black">
            Quản lý cấp bậc
          </li>
        </Link>
      </ul>
    </div>
  );
}
