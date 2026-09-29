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
        <Link href="/graduated-students">
          <li className={`cursor-pointer rounded-md px-2 py-2 ${pathname === "/graduated-students" ? "bg-[#3580d6] text-white" : "hover:bg-white hover:text-black"}`}>
            Học viên tốt nghiệp
          </li>
        </Link>
        <Link href="/student-batch-actions">
          <li className={`cursor-pointer rounded-md px-2 py-2 ${pathname === "/student-batch-actions" ? "bg-[#3580d6] text-white" : "hover:bg-white hover:text-black"}`}>
            Thao tác theo lớp
          </li>
        </Link>
        <Link href="/graduation">
          <li className={`cursor-pointer rounded-md px-2 py-2 ${pathname === "/graduation" ? "bg-[#3580d6] text-white" : "hover:bg-white hover:text-black"}`}>
            Tốt nghiệp & điều chỉnh công tác
          </li>
        </Link>
        <Link href="/positions">
          <li className={`cursor-pointer rounded-md px-2 py-2 ${pathname === "/positions" ? "bg-[#3580d6] text-white" : "hover:bg-white hover:text-black"}`}>
            Quản lý chức vụ
          </li>
        </Link>
        <Link href="/units">
          <li className={`cursor-pointer rounded-md px-2 py-2 ${pathname === "/units" ? "bg-[#3580d6] text-white" : "hover:bg-white hover:text-black"}`}>
            Quản lý Tiểu đoàn & Đại đội
          </li>
        </Link>
        <Link href="/military-units">
          <li className={`cursor-pointer rounded-md px-2 py-2 ${pathname === "/military-units" ? "bg-[#3580d6] text-white" : "hover:bg-white hover:text-black"}`}>
            Quản lý Quân khu & đơn vị
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
