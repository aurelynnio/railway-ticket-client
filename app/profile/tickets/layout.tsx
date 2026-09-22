import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Vé tàu của tôi",
  description: "Danh sách vé tàu Tết điện tử và thông tin hành trình",
};

export default function TicketsLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
