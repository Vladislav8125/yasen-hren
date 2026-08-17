"use client";

import { usePathname } from "next/navigation";
import { LegalFooter } from "@/components/LegalFooter";

export function RootFooter() {
  const pathname = usePathname();

  if (pathname === "/landing" || pathname === "/landing-new") return null;

  return <LegalFooter />;
}
