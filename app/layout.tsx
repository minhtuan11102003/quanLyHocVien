import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CategoriesComponent from "@/components/Categories";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quản lý hệ thống học viên",
  description: "Quản lý hệ thống học viên",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="w-full h-full flex ">
        <CategoriesComponent />

        <div className="main-wrapper bg-white w-full h-full text-black">
          {children}
        </div>
      </body>
    </html>
  );
}
