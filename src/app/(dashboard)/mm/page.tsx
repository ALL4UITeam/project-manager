"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MMRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/md");
  }, [router]);
  return null;
}
