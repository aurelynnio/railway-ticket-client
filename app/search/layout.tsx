import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tìm kiếm chuyến tàu",
  description: "Tra cứu và tìm chuyến tàu Tết Ất Tỵ 2026 trực tuyến",
};

export default function SearchLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
