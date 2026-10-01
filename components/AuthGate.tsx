/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
export type SessionUser = {
  id: string;
  username: string;
  name: string;
  role: "admin" | "school" | "battalion" | "company";
  unitId?: string;
  permissions: string[];
  token?: string;
};
export const getSession = (): SessionUser | null => {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("student_session") || "null");
  } catch {
    return null;
  }
};
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(path === "/login");
  useLayoutEffect(() => {
    if (path === "/login") {
      setReady(true);
      return;
    }
    const session = getSession();
    if (!session || !session.token) {
      localStorage.removeItem("student_session");
      router.replace("/login");
      return;
    }
    const nativeFetch = window.fetch.bind(window);
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const target =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      if (!target.includes("localhost:3001") || !session.token)
        return nativeFetch(input, init);
      const headers = new Headers(
        init?.headers || (input instanceof Request ? input.headers : undefined),
      );
      if (!headers.has("Authorization"))
        headers.set("Authorization", `Bearer ${session.token}`);
      return nativeFetch(input, { ...init, headers });
    }) as typeof window.fetch;
    setReady(true);
    return () => {
      window.fetch = nativeFetch;
    };
  }, [path, router]);
  if (!ready)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  return <>{children}</>;
}
