import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Cổng Quản trị",
  description: "Bảng điều khiển quản trị hệ thống Vé Tàu Tết",
};

export default function AdminLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

