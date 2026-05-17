"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error();
        router.replace("/billing");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-zinc-500">Redirecting...</p>
    </div>
  );
}
