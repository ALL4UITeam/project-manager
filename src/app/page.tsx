"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";

export default function HomePage() {
  const router = useRouter();
  const { currentUser } = useApp();

  useEffect(() => {
    if (currentUser) {
      router.replace(
        currentUser.role === "EXTERNAL" ? "/calendar" : "/projects"
      );
    } else {
      router.replace("/login");
    }
  }, [currentUser, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
