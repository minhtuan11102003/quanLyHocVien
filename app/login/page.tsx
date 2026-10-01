"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const response = await fetch("http://localhost:3001/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.trim(),
        password,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Sai tài khoản hoặc mật khẩu");
      return;
    }

    localStorage.setItem(
      "student_session",
      JSON.stringify({ ...data.user, token: data.token }),
    );
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#102f46] to-[#1d4ed8] p-8 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(96,165,250,0.35),_transparent_30%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-100">
                Hệ thống quản lý
              </div>
              <h1 className="mt-6 max-w-sm text-4xl font-black leading-tight">
                Quản lý học viên toàn quân
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-blue-100/80">
                Theo dõi học viên, quản lý cấp bậc, phân quyền và điều phối tổ
                chức theo luồng Đại đội → Tiểu đoàn → Nhà trường.
              </p>
            </div>

            <div className="relative z-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.16em] text-blue-100/70">
                  Quy trình
                </p>
                <p className="mt-2 text-lg font-bold">4 bước</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.16em] text-blue-100/70">
                  Phân quyền
                </p>
                <p className="mt-2 text-lg font-bold">4 vai trò</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.16em] text-blue-100/70">
                  Tài khoản
                </p>
                <p className="mt-2 text-lg font-bold">Demo</p>
              </div>
            </div>
          </div>

          <div className="flex items-center bg-white p-6 md:p-10">
            <div className="w-full">
              <div className="mb-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl text-blue-700">
                  🔐
                </div>
                <h2 className="text-3xl font-black text-slate-900">
                  Đăng nhập hệ thống
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Quản lý luồng Đại đội → Tiểu đoàn → Nhà trường
                </p>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Tên đăng nhập
                  </label>
                  <input
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Tên đăng nhập"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Mật khẩu
                  </label>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Đăng nhập
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                <p className="font-semibold text-slate-700">Demo tài khoản:</p>
                <p>admin / admin123</p>
                <p>nhatruong / school123</p>
                <p>tieudoan1 / td123</p>
                <p>daidoi1 / dd123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
