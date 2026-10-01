import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CategoriesComponent from "@/components/Categories";
import AuthGate from "@/components/AuthGate";

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
      <body className="min-h-screen bg-slate-100 text-slate-900">
        <AuthGate>
          <div className="flex min-h-screen w-full">
            <CategoriesComponent />
            <main className="min-w-0 flex-1 bg-slate-100">{children}</main>
          </div>
        </AuthGate>
      </body>
    </html>
  );
}
