import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Lịch sử đơn hàng",
  description: "Tra cứu và quản lý các đơn đặt vé tàu",
};

export default function OrdersLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

