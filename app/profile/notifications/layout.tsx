import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Thông báo hành trình",
  description: "Cập nhật lịch trình, chuyến tàu và thông tin vé",
};

export default function NotificationsLayoutWrapper({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
